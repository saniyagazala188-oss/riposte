import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { emailConfigured, sendEmail, sendSlack } from "./send";
import { alertEmail, digestEmail, slackMessage, type SignalForMessage } from "./templates";

type ProfileRow = {
  id: string;
  email: string | null;
  email_alerts: boolean;
  weekly_digest: boolean;
  slack_webhook_url: string | null;
  last_digest_at: string | null;
};

type SignalRow = Omit<SignalForMessage, "competitor"> & { user_id: string; competitors: { name: string } | null };

const SIGNAL_FIELDS = "id, user_id, title, what_changed, so_what, action, impact, competitor_id, competitors(name)";
const DAY = 24 * 60 * 60 * 1000;

function toMessage(s: SignalRow): SignalForMessage {
  return { ...s, competitor: s.competitors?.name ?? "A competitor" };
}

// Sends one alert per user for new high-impact signals (email and/or Slack), once each.
// Needs the admin client, because it reads email settings across users.
export async function sendAlerts(db: SupabaseClient, { userId }: { userId?: string } = {}) {
  let query = db
    .from("signals")
    .select(SIGNAL_FIELDS)
    .eq("impact", "high")
    .eq("noise", false)
    .eq("status", "new")
    .is("alerted_at", null)
    .gte("created_at", new Date(Date.now() - 3 * DAY).toISOString())
    .order("created_at", { ascending: true })
    .limit(200);
  if (userId) query = query.eq("user_id", userId);
  const { data } = await query;
  const rows = (data ?? []) as unknown as SignalRow[];
  if (!rows.length) return { users: 0, signals: 0, errors: [] as string[] };

  const byUser = new Map<string, SignalRow[]>();
  for (const r of rows) byUser.set(r.user_id, [...(byUser.get(r.user_id) ?? []), r]);
  const { data: profiles } = await db
    .from("profiles")
    .select("id, email, email_alerts, weekly_digest, slack_webhook_url, last_digest_at")
    .in("id", [...byUser.keys()]);

  const errors: string[] = [];
  let sent = 0;
  for (const p of (profiles ?? []) as ProfileRow[]) {
    const signals = (byUser.get(p.id) ?? []).map(toMessage);
    let delivered = !p.email_alerts && !p.slack_webhook_url; // nothing wanted: just mark as handled

    if (p.email_alerts && p.email && emailConfigured()) {
      try {
        await sendEmail(p.email, alertEmail(signals));
        delivered = true;
      } catch (e) {
        errors.push(`email: ${(e as Error).message}`);
      }
    } else if (p.email_alerts && !emailConfigured()) {
      delivered = true; // email not set up on the server yet; the signal still shows in the feed
    }
    if (p.slack_webhook_url) {
      try {
        const heading = signals.length === 1 ? "High-impact competitor change" : `${signals.length} high-impact competitor changes`;
        await sendSlack(p.slack_webhook_url, slackMessage(heading, signals));
        delivered = true;
      } catch (e) {
        errors.push(`slack: ${(e as Error).message}`);
      }
    }

    if (delivered) {
      await db
        .from("signals")
        .update({ alerted_at: new Date().toISOString() })
        .in("id", signals.map((s) => s.id));
      sent += signals.length;
    }
  }
  return { users: byUser.size, signals: sent, errors };
}

// The weekly digest: everything meaningful from the last 7 days, most important first.
export async function sendDigests(db: SupabaseClient, { userId, force = false }: { userId?: string; force?: boolean } = {}) {
  let query = db
    .from("profiles")
    .select("id, email, email_alerts, weekly_digest, slack_webhook_url, last_digest_at")
    .eq("weekly_digest", true);
  if (userId) query = query.eq("id", userId);
  const { data: profiles } = await query;

  const since = new Date(Date.now() - 7 * DAY);
  const weekOf = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", timeZone: "Asia/Kolkata" });
  const errors: string[] = [];
  let sent = 0;

  for (const p of (profiles ?? []) as ProfileRow[]) {
    if (!force && p.last_digest_at && Date.now() - new Date(p.last_digest_at).getTime() < 6 * DAY) continue;
    const { count: competitors } = await db
      .from("competitors")
      .select("id", { count: "exact", head: true })
      .eq("user_id", p.id);
    if (!competitors) continue; // nothing watched yet, nothing to report

    const { data } = await db
      .from("signals")
      .select(SIGNAL_FIELDS)
      .eq("user_id", p.id)
      .eq("noise", false)
      .neq("status", "dismissed")
      .gte("created_at", since.toISOString())
      .order("created_at", { ascending: false })
      .limit(100);
    const order = { high: 0, medium: 1, low: 2 };
    const signals = ((data ?? []) as unknown as SignalRow[])
      .map(toMessage)
      .sort((a, b) => order[a.impact] - order[b.impact]);

    let delivered = false;
    if (p.email && emailConfigured()) {
      try {
        await sendEmail(p.email, digestEmail(signals, { competitors, weekOf }));
        delivered = true;
      } catch (e) {
        errors.push(`email: ${(e as Error).message}`);
      }
    }
    if (p.slack_webhook_url && signals.length) {
      try {
        await sendSlack(p.slack_webhook_url, slackMessage(`Your week in competitors: ${signals.length} changes`, signals));
        delivered = true;
      } catch (e) {
        errors.push(`slack: ${(e as Error).message}`);
      }
    }
    if (delivered) {
      await db.from("profiles").update({ last_digest_at: new Date().toISOString() }).eq("id", p.id);
      sent++;
    }
  }
  return { sent, errors };
}
