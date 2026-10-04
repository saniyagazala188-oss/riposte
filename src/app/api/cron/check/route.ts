import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkSources, type SourceRow } from "@/lib/fetcher/check";
import { processChanges } from "@/lib/signals/process";
import { sendAlerts, sendDigests } from "@/lib/notify/alerts";

// Runs every morning (see vercel.json):
// 1. checks every page that is due (daily competitors after 12 hours, weekly after ~6.5 days),
// 2. turns new changes into AI signals,
// 3. sends alerts for high-impact signals,
// 4. on Mondays, sends the weekly digest.
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
    // The job runs once a day, so a daily page is due unless someone pressed Check now in the last 12 hours.
    const gap = competitor?.check_frequency === "weekly" ? 156 * HOUR : 12 * HOUR;
    return now - new Date(s.last_checked_at).getTime() >= gap;
  }) as SourceRow[];

  const results = await checkSources(db, due, { concurrency: 6, budgetMs: 170000 });
  const summary = results.reduce<Record<string, number>>((acc, r) => {
    acc[r.status] = (acc[r.status] ?? 0) + 1;
    return acc;
  }, {});

  const signals = await processChanges(db, { limit: 60, concurrency: 2, budgetMs: 80000 });
  const alerts = await sendAlerts(db);
  const url = new URL(request.url);
  const digest =
    new Date().getUTCDay() === 1 || url.searchParams.get("digest") === "1"
      ? await sendDigests(db, { force: url.searchParams.get("digest") === "1" })
      : null;

  return NextResponse.json({ due: due.length, checked: results.length, summary, signals, alerts, digest });
}
