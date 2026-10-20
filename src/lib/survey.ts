// The beta survey: 6 short questions, asked 7 days after someone is approved.
// The same questions are used by the in-app card, the survey page, the reminder email and the admin summary.
import type { SupabaseClient, User } from "@supabase/supabase-js";

export const SURVEY_AFTER_DAYS = 7; // card shows this long after approval
export const SURVEY_EMAIL_AFTER_DAYS = 10; // one reminder email if still unanswered

export const SURVEY = {
  before_tool: {
    q: "How did you keep up with competitors before Riposte?",
    options: [
      ["by_hand", "Checked their sites by hand"],
      ["alerts", "Google Alerts"],
      ["monitor", "A page-change monitor"],
      ["other_tool", "Another competitive intelligence tool"],
      ["none", "I didn't really keep up"],
      ["other", "Something else"],
    ],
  },
  most_useful: {
    q: "Which part helps you most?",
    options: [
      ["signals", "Signals: what changed and why it matters"],
      ["action_kits", "Action kits and first drafts"],
      ["news_youtube", "News and YouTube"],
      ["comparisons", "Comparison pages and content intel"],
      ["ai_visibility", "Prompt Studio and AI visibility"],
      ["alerts", "Email and Slack alerts"],
      ["other", "Something else"],
    ],
  },
  disappointment: {
    q: "How would you feel if you could no longer use Riposte?",
    options: [
      ["very", "Very disappointed"],
      ["somewhat", "Somewhat disappointed"],
      ["not", "Not disappointed"],
    ],
  },
  fair_price: {
    q: "What would feel like a fair monthly price?",
    options: [
      ["under_19", "Under $19"],
      ["19_49", "$19 to $49"],
      ["49_99", "$49 to $99"],
      ["99_plus", "More than $99"],
    ],
  },
} as const;

export const MISSING_Q = "What confused you, or what's missing?";
export const CALL_Q = "Happy to do a 15-minute call about it?";

export type SurveyKey = keyof typeof SURVEY;

// These two allow several answers (checkboxes), saved as "a|b|other:their words".
export const MULTI: SurveyKey[] = ["before_tool", "most_useful"];
export const isMulti = (key: SurveyKey) => MULTI.includes(key);
export const splitAnswers = (v: string | null | undefined) => (v ? v.split("|").filter(Boolean) : []);

const optionLabel = (key: SurveyKey, value: string) =>
  (SURVEY[key].options as readonly (readonly [string, string])[]).find(([v]) => v === value)?.[1] ?? value;

export const labelFor = (key: SurveyKey, value: string | null) =>
  splitAnswers(value)
    .map((v) => (v.startsWith("other:") ? `Something else: ${v.slice(6)}` : optionLabel(key, v)))
    .join(", ");

const DAY = 24 * 60 * 60 * 1000;

// Should the "Got 2 minutes?" card show for this person right now?
export async function surveyDue(supabase: SupabaseClient, user: User): Promise<boolean> {
  const { data: row } = await supabase.from("beta_survey").select("answered_at, dismissed_at").eq("user_id", user.id).maybeSingle();
  if (row?.answered_at || row?.dismissed_at) return false;
  // Approval date from the waitlist; falls back to when the account was made.
  let since = user.created_at || "1970-01-01T00:00:00Z";
  try {
    const { data } = await supabase.rpc("my_approved_at");
    if (typeof data === "string" && new Date(data).getTime() > new Date(since).getTime()) since = data;
  } catch {
    // migration not run yet, or the local preview: use the account date
  }
  return Date.now() - new Date(since).getTime() >= SURVEY_AFTER_DAYS * DAY;
}
