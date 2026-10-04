import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkSources, type SourceRow } from "@/lib/fetcher/check";
import { processChanges } from "@/lib/signals/process";
import { sendAlerts, sendDigests } from "@/lib/notify/alerts";
import { findStories, findTrends } from "@/lib/insights/run";

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

  const results = await checkSources(db, due, { concurrency: 6, budgetMs: 150000 });
  const summary = results.reduce<Record<string, number>>((acc, r) => {
    acc[r.status] = (acc[r.status] ?? 0) + 1;
    return acc;
  }, {});

  const signals = await processChanges(db, { limit: 60, concurrency: 2, budgetMs: 60000 });
  const alerts = await sendAlerts(db);

  // Linked signals: competitors with new signals in the last day get their related moves joined up.
  const linked = { competitors: 0, stories: 0 };
  const { data: fresh } = await db
    .from("signals")
    .select("user_id, competitor_id")
    .eq("noise", false)
    .gte("created_at", new Date(now - 26 * HOUR).toISOString());
  const pairs = [...new Map((fresh ?? []).map((f) => [f.competitor_id, f])).values()].slice(0, 10);
  const timeLeft = () => 270000 - (Date.now() - now); // stay inside the 300-second limit
  for (const p of pairs) {
    if (timeLeft() < 25000) break;
    try {
      linked.stories += (await findStories(db, p.user_id, p.competitor_id, { timeoutMs: 20000 })).found;
      linked.competitors++;
    } catch {
      // AI busy: try again tomorrow
    }
  }
  const url = new URL(request.url);
  const monday = new Date().getUTCDay() === 1;
  // Trend alerts: refreshed once a week, before the Monday digest.
  const trendRuns: string[] = [];
  if (monday) {
    const { data: owners } = await db.from("competitors").select("user_id");
    for (const userId of [...new Set((owners ?? []).map((o) => o.user_id as string))].slice(0, 20)) {
      if (timeLeft() < 30000) break;
      try {
        trendRuns.push((await findTrends(db, userId, { timeoutMs: 25000 })).message);
      } catch {
        trendRuns.push("AI busy");
      }
    }
  }
  const digest =
    monday || url.searchParams.get("digest") === "1"
      ? await sendDigests(db, { force: url.searchParams.get("digest") === "1" })
      : null;

  return NextResponse.json({ due: due.length, checked: results.length, summary, signals, alerts, linked, trends: trendRuns, digest });
}
