import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkSources, type SourceRow } from "@/lib/fetcher/check";

// Runs every morning (see vercel.json). Checks every page that is due:
// daily competitors after ~20 hours, weekly competitors after ~6.5 days.
export const maxDuration = 300;
export const dynamic = "force-dynamic";

const HOUR = 60 * 60 * 1000;

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Not allowed" }, { status: 401 });
  }

  const db = createAdminClient();
  if (!db) return NextResponse.json({ error: "SUPABASE_SERVICE_ROLE_KEY is not set" }, { status: 500 });

  const { data, error } = await db
    .from("sources")
    .select("id, user_id, competitor_id, type, url, last_checked_at, competitors(check_frequency)")
    .order("last_checked_at", { ascending: true, nullsFirst: true })
    .limit(500);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const now = Date.now();
  const due = (data ?? []).filter((s) => {
    if (!s.last_checked_at) return true;
    const competitor = s.competitors as unknown as { check_frequency: string } | null;
    const gap = competitor?.check_frequency === "weekly" ? 156 * HOUR : 20 * HOUR;
    return now - new Date(s.last_checked_at).getTime() >= gap;
  }) as SourceRow[];

  const results = await checkSources(db, due, { concurrency: 6, budgetMs: 250000 });
  const summary = results.reduce<Record<string, number>>((acc, r) => {
    acc[r.status] = (acc[r.status] ?? 0) + 1;
    return acc;
  }, {});

  return NextResponse.json({ due: due.length, checked: results.length, summary });
}
