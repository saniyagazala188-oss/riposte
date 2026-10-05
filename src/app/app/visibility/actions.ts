"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { geminiConfigured } from "@/lib/ai/gemini";
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
  if (r.reason && (r.busy || r.failed)) parts.push(`Google said: ${r.reason}`);
  return { status: r.asked ? "done" : "error", message: parts.join(" ") };
}
