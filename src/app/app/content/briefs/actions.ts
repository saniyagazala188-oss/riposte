"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { generateJson, geminiConfigured, Overloaded, RateLimited } from "@/lib/ai/gemini";
import { BRIEF_SCHEMA, buildBriefPrompt, cleanBrief, type BriefInput } from "@/lib/briefs/prompt";

export type BriefState = { status: "idle" | "done" | "error"; message?: string; briefId?: string };

export async function writeBrief(_prev: BriefState, formData: FormData): Promise<BriefState> {
  const { supabase, user } = await requireUser();
  if (!geminiConfigured()) return { status: "error", message: "AI isn't set up yet: the GEMINI_API_KEY setting is missing." };
  const source = formData.get("source") === "trend" ? "trend" : "visibility";
  const sourceId = String(formData.get("source_id") ?? "");

  let input: BriefInput | null = null;
  if (source === "trend") {
    const { data: t } = await supabase.from("trends").select("topic, summary, competitors").eq("id", sourceId).maybeSingle();
    if (t) {
      const comps = (t.competitors as { name: string; titles: string[] }[]) ?? [];
      input = {
        kind: "trend",
        topic: t.topic,
        evidence: [...comps.flatMap((c) => c.titles.map((title) => `${c.name}: "${title}"`)), t.summary].filter(Boolean),
      };
    }
  } else {
    const [{ data: p }, { data: a }] = await Promise.all([
      supabase.from("ai_prompts").select("text").eq("id", sourceId).maybeSingle(),
      supabase.from("visibility_answers").select("mentions, citations").eq("prompt_id", sourceId).order("run_at", { ascending: false }).limit(1).maybeSingle(),
    ]);
    if (p) {
      const mentions = ((a?.mentions as { key: string; name: string; position: number; known_for?: string[]; gap?: string }[]) ?? []).slice(0, 6);
      const cites = ((a?.citations as { domain: string }[]) ?? []).slice(0, 6);
      input = {
        kind: "visibility",
        topic: p.text,
        evidence: [
          ...mentions.map(
            (m) =>
              `AI recommended #${m.position}: ${m.name}` +
              (m.known_for?.length ? `, picked for: ${m.known_for.join("; ")}` : "") +
              (m.gap ? `. What we'd need to show: ${m.gap}` : ""),
          ),
          ...(cites.length ? [`Sites the answer relied on: ${cites.map((c) => c.domain).join(", ")}`] : []),
        ],
      };
    }
  }
  if (!input) return { status: "error", message: "Couldn't find what to write the brief about." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("product_name, product_pitch, ideal_customer, differentiators")
    .eq("id", user.id)
    .maybeSingle();

  let brief;
  try {
    brief = cleanBrief(
      await generateJson(buildBriefPrompt(profile ?? { product_name: null, product_pitch: null, ideal_customer: null }, input), BRIEF_SCHEMA, {
        timeoutMs: 80000,
      }),
    );
  } catch (e) {
    if (e instanceof RateLimited || e instanceof Overloaded)
      return {
        status: "error",
        message: /too long/.test((e as Error).message)
          ? "Google's AI was too slow this time. Please click again."
          : "Google's AI is at its limit for this minute. Wait a minute and click again.",
      };
    return { status: "error", message: `Couldn't write the brief this time (${(e as Error).message.slice(0, 160)}).` };
  }
  if (!brief) return { status: "error", message: "The AI's answer wasn't usable. Please try again." };

  const { data: row, error } = await supabase
    .from("content_briefs")
    .insert({ user_id: user.id, source, source_id: sourceId || null, topic: input.topic.slice(0, 300), content: brief })
    .select("id")
    .single();
  if (error || !row) return { status: "error", message: "Couldn't save the brief. Has migration 0013 been run?" };
  revalidatePath("/app/content");
  return { status: "done", message: "Brief ready.", briefId: row.id };
}

export async function setBriefStatus(formData: FormData) {
  const { supabase } = await requireUser();
  const status = String(formData.get("status") ?? "");
  if (!["new", "writing", "published"].includes(status)) return;
  await supabase.from("content_briefs").update({ status }).eq("id", String(formData.get("brief_id") ?? ""));
  revalidatePath("/app/content");
}

export async function deleteBrief(formData: FormData) {
  const { supabase } = await requireUser();
  await supabase.from("content_briefs").delete().eq("id", String(formData.get("brief_id") ?? ""));
  revalidatePath("/app/content");
}
