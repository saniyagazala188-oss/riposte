"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { limitsFor } from "@/lib/access";
import { generateJson, geminiConfigured, Overloaded, RateLimited } from "@/lib/ai/gemini";
import {
  brandTerms,
  buildPromptStudioPrompt,
  cleanPromptTopics,
  parseKeywords,
  promptProblem,
  PROMPT_SCHEMA,
} from "@/lib/aeo/prompts";
import type { CheckState } from "@/app/app/actions";

async function brandsFor(supabase: Awaited<ReturnType<typeof requireUser>>["supabase"], productName: string | null) {
  const { data: comps } = await supabase.from("competitors").select("id, name, domain");
  return {
    comps: comps ?? [],
    brands: brandTerms([productName ?? "", ...(comps ?? []).map((c) => c.name)], (comps ?? []).map((c) => c.domain)),
  };
}

export async function generatePrompts(_prev: CheckState, formData: FormData): Promise<CheckState> {
  const { supabase, user } = await requireUser();
  if (!geminiConfigured()) return { status: "error", message: "AI isn't set up yet: the GEMINI_API_KEY setting is missing." };

  const rawKeywords = String(formData.get("keywords") ?? "").slice(0, 3000);
  const priorities = String(formData.get("priorities") ?? "").slice(0, 1000).trim();
  const keywords = parseKeywords(rawKeywords);
  await supabase.from("profiles").update({ aeo_keywords: rawKeywords, aeo_priorities: priorities }).eq("id", user.id);
  if (keywords.length < 2) return { status: "error", message: "Add at least 2 keywords, one per line." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("product_name, product_pitch, ideal_customer, differentiators")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile?.product_pitch) return { status: "error", message: "Fill in Your product first, so the prompts match your buyers." };

  const { brands } = await brandsFor(supabase, profile.product_name);
  const { data: topicRows } = await supabase.from("content_topics").select("topics");
  const competitorTopics = [
    ...new Set((topicRows ?? []).flatMap((r) => ((r.topics as { name: string }[]) ?? []).map((t) => t.name))),
  ].slice(0, 20);

  let result;
  try {
    result = cleanPromptTopics(
      await generateJson(buildPromptStudioPrompt(profile, keywords, priorities, competitorTopics), PROMPT_SCHEMA, {
        timeoutMs: 80000,
      }),
      brands,
    );
  } catch (e) {
    if (e instanceof RateLimited || e instanceof Overloaded)
      return { status: "error", message: "Google's AI is overloaded right now. Try again in a minute." };
    return { status: "error", message: `Couldn't write prompts this time (${(e as Error).message.slice(0, 160)}).` };
  }
  if (!result.topics.length) return { status: "error", message: "The AI's answer wasn't usable. Please try again." };

  // Keep tracked prompts and your own; replace the rest.
  await supabase.from("ai_prompts").delete().eq("user_id", user.id).eq("tracked", false).eq("source", "ai");
  const { data: kept } = await supabase.from("ai_prompts").select("text, position");
  const keptText = new Set((kept ?? []).map((k) => k.text.toLowerCase()));
  let position = Math.max(0, ...(kept ?? []).map((k) => k.position)) + 1;
  const rows = result.topics.flatMap((t) =>
    t.prompts
      .filter((p) => !keptText.has(p.text.toLowerCase()))
      .map((p) => ({ user_id: user.id, topic: t.name, kind: t.kind, dimension: p.dimension, text: p.text, position: position++ })),
  );
  const { error } = await supabase.from("ai_prompts").insert(rows);
  if (error) return { status: "error", message: "Couldn't save the prompts. Please try again." };

  const d = result.dropped;
  const removed = [
    d.brand && `${d.brand} named a brand`,
    d.informational && `${d.informational} asked to learn, not to buy`,
    d.length && `${d.length} too short or long`,
    d.duplicate && `${d.duplicate} repeated`,
  ].filter(Boolean);
  revalidatePath("/app/prompts");
  return {
    status: "done",
    message: `Wrote ${rows.length} prompts in ${result.topics.length} topics.${removed.length ? ` Removed ${removed.join(", ")}.` : ""}`,
  };
}

export async function toggleTracked(formData: FormData) {
  const { supabase, user } = await requireUser();
  const MAX_TRACKED = limitsFor(user.email).trackedPrompts;
  const id = String(formData.get("prompt_id") ?? "");
  const track = formData.get("track") === "1";
  if (track) {
    const { count } = await supabase.from("ai_prompts").select("id", { count: "exact", head: true }).eq("tracked", true);
    if ((count ?? 0) >= MAX_TRACKED) return;
  }
  await supabase.from("ai_prompts").update({ tracked: track }).eq("id", id);
  revalidatePath("/app/prompts");
  revalidatePath("/app/visibility");
}

export async function deletePrompt(formData: FormData) {
  const { supabase } = await requireUser();
  await supabase.from("ai_prompts").delete().eq("id", String(formData.get("prompt_id") ?? ""));
  revalidatePath("/app/prompts");
  revalidatePath("/app/visibility");
}

export async function addOwnPrompt(_prev: CheckState, formData: FormData): Promise<CheckState> {
  const { supabase, user } = await requireUser();
  const text = String(formData.get("text") ?? "").replace(/\s+/g, " ").trim().slice(0, 400);
  const topic = String(formData.get("topic") ?? "").replace(/\s+/g, " ").trim().slice(0, 80) || "Your own prompts";
  if (!text) return { status: "error", message: "Write a prompt first." };
  const { data: profile } = await supabase.from("profiles").select("product_name").eq("id", user.id).maybeSingle();
  const { brands } = await brandsFor(supabase, profile?.product_name ?? null);
  const problem = promptProblem(text, brands);
  if (problem === "brand")
    return { status: "error", message: "Leave brand names out: real buyers ask for the best tool, and naming a brand skews the answer." };
  if (problem === "informational")
    return { status: "error", message: "This asks to learn, not to buy. Try \"What's the best… for…\" or \"Is X or Y better for…\"." };
  if (problem === "length") return { status: "error", message: "Aim for 10 to 40 words, the way a real buyer asks." };
  const { data: same } = await supabase.from("ai_prompts").select("kind").eq("topic", topic).limit(1);
  const { data: last } = await supabase.from("ai_prompts").select("position").order("position", { ascending: false }).limit(1);
  const { error } = await supabase.from("ai_prompts").insert({
    user_id: user.id,
    topic,
    kind: same?.[0]?.kind ?? "spear",
    dimension: "specificity",
    text,
    source: "manual",
    position: (last?.[0]?.position ?? 0) + 1,
  });
  if (error) return { status: "error", message: "Couldn't save it. Please try again." };
  revalidatePath("/app/prompts");
  return { status: "done", message: "Added." };
}
