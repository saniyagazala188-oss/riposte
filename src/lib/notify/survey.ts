import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { adminEmails } from "@/lib/access";
import { AUTHOR, SITE_URL } from "@/lib/site";
import { SURVEY_EMAIL_AFTER_DAYS } from "@/lib/survey";
import { emailConfigured, sendEmail } from "./send";

const DAY = 24 * 60 * 60 * 1000;

export function surveyEmail() {
  const url = `${SITE_URL}/app/survey`;
  const name = AUTHOR.name.split(" ")[0];
  const text = `Hi! You've been using Riposte for about 10 days. Thank you for being one of the first.

Could you answer 6 quick questions? It takes about 2 minutes, and your answers decide what gets built next and what Riposte should cost.

${url}

I read every answer. And if you'd rather talk, there's a box for that at the end.

${name}, from Riposte`;
  const html = text
    .split("\n\n")
    .map((p) => (p === url ? `<p><a href="${url}" style="display:inline-block;background:#0e6b66;color:#fff;padding:10px 18px;border-radius:10px;text-decoration:none;font-weight:600">Answer 6 quick questions</a></p>` : `<p>${p.replace(/\n/g, "<br>")}</p>`))
    .join("");
  return { subject: "2 minutes to help shape Riposte?", text, html };
}

// One reminder email per person, 10 days after approval, if they haven't answered the survey.
// Runs from the morning job. Sends at most 20 a day.
export async function sendSurveyReminders(db: SupabaseClient) {
  if (!emailConfigured()) return { sent: 0, skipped: "email not set up" };
  const cutoff = new Date(Date.now() - SURVEY_EMAIL_AFTER_DAYS * DAY).toISOString();
  const { data: approved } = await db.from("waitlist").select("email").not("approved_at", "is", null).lte("approved_at", cutoff).limit(500);
  const admins = adminEmails();
  const emails = (approved ?? []).map((r) => String(r.email).toLowerCase()).filter((e) => e && !admins.includes(e));
  if (!emails.length) return { sent: 0 };

  const { data: people } = await db.from("profiles").select("id, email").in("email", emails);
  const ids = (people ?? []).map((p) => p.id as string);
  if (!ids.length) return { sent: 0 };
  const { data: done } = await db.from("beta_survey").select("user_id, answered_at, emailed_at").in("user_id", ids);
  const skip = new Set((done ?? []).filter((d) => d.answered_at || d.emailed_at).map((d) => d.user_id as string));

  let sent = 0;
  const failed: string[] = [];
  for (const p of (people ?? []).filter((x) => !skip.has(x.id as string)).slice(0, 20)) {
    try {
      await sendEmail(String(p.email), surveyEmail());
      await db.from("beta_survey").upsert({ user_id: p.id, email: p.email, emailed_at: new Date().toISOString() }, { onConflict: "user_id" });
      sent++;
    } catch (e) {
      failed.push(e instanceof Error ? e.message.slice(0, 80) : "failed");
    }
  }
  return { sent, failed: failed.length ? failed : undefined };
}
