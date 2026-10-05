"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { generateJson, geminiConfigured, Overloaded, RateLimited } from "@/lib/ai/gemini";
import { buildComparePrompt, cleanComparison, COMPARE_SCHEMA } from "@/lib/compare/prompt";
import type { CheckState } from "@/app/app/actions";

export async function writeComparison(_prev: CheckState, formData: FormData): Promise<CheckState> {
  const { supabase, user } = await requireUser();
  if (!geminiConfigured()) return { status: "error", message: "AI isn't set up yet: the GEMINI_API_KEY setting is missing." };
  const competitorId = String(formData.get("competitor_id") ?? "");

  const [{ data: competitor }, { data: profile }, { data: sources }, { data: signals }, { data: topics }, { data: prompts }, { data: existing }] =
    await Promise.all([
      supabase.from("competitors").select("id, name, domain").eq("id", competitorId).maybeSingle(),
      supabase.from("profiles").select("product_name, product_pitch, ideal_customer, differentiators").eq("id", user.id).maybeSingle(),
      supabase.from("sources").select("id, type").eq("competitor_id", competitorId).in("type", ["pricing", "changelog"]),
      supabase
        .from("signals")
        .select("id, created_at, title, what_changed")
        .eq("competitor_id", competitorId)
        .eq("noise", false)
        .neq("status", "dismissed")
        .order("created_at", { ascending: false })
        .limit(12),
      supabase.from("content_topics").select("topics").eq("competitor_id", competitorId).maybeSingle(),
      supabase.from("ai_prompts").select("text").order("tracked", { ascending: false }).order("position").limit(8),
      supabase.from("comparisons").select("content, generated_at").eq("competitor_id", competitorId).maybeSingle(),
    ]);
  if (!competitor) return { status: "error", message: "Competitor not found." };
  if (!profile?.product_pitch) return { status: "error", message: "Fill in Your product first, so your side of the page is accurate." };

  const latestLines = async (type: string) => {
    const ids = (sources ?? []).filter((s) => s.type === type).map((s) => s.id);
    if (!ids.length) return [];
    const { data } = await supabase.from("snapshots").select("lines").in("source_id", ids).order("fetched_at", { ascending: false }).limit(1);
    return ((data?.[0]?.lines as string[] | null) ?? []).slice(0, 200);
  };
  const [pricing, changelog] = await Promise.all([latestLines("pricing"), latestLines("changelog")]);

  const today = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  let content;
  try {
    content = cleanComparison(
      await generateJson(
        buildComparePrompt(
          profile,
          {
            competitor: competitor.name.replace(/\(.*?\)/g, "").trim(),
            domain: competitor.domain,
            pricing,
            changelog: changelog.slice(0, 40),
            signals: (signals ?? []).map((s) => ({ date: s.created_at, title: s.title, what_changed: s.what_changed })),
            topics: ((topics?.topics as { name: string }[] | null) ?? []).map((t) => t.name),
            buyerQuestions: (prompts ?? []).map((p) => p.text),
          },
          today,
        ),
        COMPARE_SCHEMA,
        { timeoutMs: 60000 },
      ),
    );
  } catch (e) {
    if (e instanceof RateLimited || e instanceof Overloaded)
      return { status: "error", message: "Google's AI is overloaded right now. Try again in a minute." };
    return { status: "error", message: `Couldn't write the page this time (${(e as Error).message.slice(0, 160)}).` };
  }
  if (!content) return { status: "error", message: "The AI's answer wasn't usable. Please try again." };

  const { error } = await supabase.from("comparisons").upsert(
    {
      user_id: user.id,
      competitor_id: competitor.id,
      generated_at: new Date().toISOString(),
      content,
      previous_content: existing?.content ?? null,
      previous_generated_at: existing?.generated_at ?? null,
      signal_ids: (signals ?? []).map((s) => s.id),
    },
    { onConflict: "competitor_id" },
  );
  if (error) return { status: "error", message: "Couldn't save the page. Please try again." };
  revalidatePath("/app", "layout");
  return { status: "done", message: existing ? "Updated with their latest changes." : "Written. Review the placeholders in [brackets] before publishing." };
}
