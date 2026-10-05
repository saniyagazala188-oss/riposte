"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { generateJson, geminiConfigured, Overloaded, RateLimited } from "@/lib/ai/gemini";
import { attachReasons, buildReasonsPrompt, cleanReasons, REASONS_SCHEMA, type Mention, type Profile, type Reason } from "@/lib/visibility/analyse";
import { runVisibility } from "@/lib/visibility/run";
import type { CheckState } from "@/app/app/actions";

export async function runVisibilityNow(): Promise<CheckState> {
  const { supabase, user } = await requireUser();
  if (!geminiConfigured()) return { status: "error", message: "AI isn't set up yet: the GEMINI_API_KEY setting is missing." };
  const { count } = await supabase.from("ai_prompts").select("id", { count: "exact", head: true }).eq("tracked", true);
  if (!count) return { status: "error", message: "Track a few prompts in Prompt Studio first." };

  // Prompts asked in the last 30 minutes are skipped, so a second click doesn't spend searches twice.
  const r = await runVisibility(supabase, { userId: user.id, freshHours: 0.5, budgetMs: 70000, concurrency: 2 });
  revalidatePath("/app/visibility");
  if (!r.asked && !r.failed && !r.waiting && !r.busy)
    return { status: "done", message: "All tracked prompts were asked in the last 30 minutes. Results are below." };
  const parts = [`Asked ${r.asked} of ${count} prompts.`];
  if (r.busy) parts.push("Google's AI stopped answering, so the rest will run next time.");
  else if (r.waiting) parts.push(`${r.waiting} didn't fit in time; press Run again to finish them.`);
  if (r.failed) parts.push(`${r.failed} failed.`);
  if (r.reason && (r.busy || r.failed)) parts.push(r.reason.startsWith("The answer couldn't be saved") ? r.reason : `Google said: ${r.reason}`);
  return { status: r.asked ? "done" : "error", message: parts.join(" ") };
}

export type ExplainState = { status: "idle" | "done" | "error"; message?: string };

// Reads the reasons out of an answer that was saved before reasons existed, and saves them.
// Uses the saved answer, so the question isn't asked again.
export async function explainAnswer(_prev: ExplainState, formData: FormData): Promise<ExplainState> {
  const { supabase, user } = await requireUser();
  if (!geminiConfigured()) return { status: "error", message: "AI isn't set up yet: the GEMINI_API_KEY setting is missing." };
  const id = String(formData.get("answer_id") ?? "");
  const [{ data: a }, { data: profile }] = await Promise.all([
    supabase.from("visibility_answers").select("id, answer, mentions").eq("id", id).maybeSingle(),
    supabase.from("profiles").select("product_name, product_pitch, ideal_customer, differentiators").eq("id", user.id).maybeSingle(),
  ]);
  if (!a?.answer) return { status: "error", message: "Couldn't find that answer." };
  let reasons: Reason[];
  try {
    reasons = cleanReasons(await generateJson(buildReasonsPrompt(a.answer, profile as Profile | null), REASONS_SCHEMA, { timeoutMs: 55000 }));
  } catch (e) {
    if (e instanceof RateLimited || e instanceof Overloaded)
      return { status: "error", message: "Google's AI is at its limit for this minute. Wait a minute and click again." };
    return { status: "error", message: `Couldn't read the reasons (${(e as Error).message.slice(0, 160)}).` };
  }
  const mentions = attachReasons(a.mentions as Mention[], reasons);
  // Mark every competitor as read, even if the answer gave no reason for one.
  const marked = mentions.map((m) => (m.key === "you" || m.known_for ? m : { ...m, known_for: [] }));
  const { error } = await supabase.from("visibility_answers").update({ mentions: marked }).eq("id", a.id);
  if (error) return { status: "error", message: `Couldn't save the reasons: ${error.message}` };
  revalidatePath("/app/visibility");
  return { status: "done" };
}
