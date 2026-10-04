import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { generateJson, geminiConfigured } from "@/lib/ai/gemini";
import { loadContent } from "@/lib/content/load";
import { titleFromUrl } from "@/lib/content/stats";
import type { Profile } from "@/lib/signals/prompt";
import {
  buildStoryPrompt,
  buildTrendPrompt,
  cleanStories,
  cleanTrends,
  STORY_SCHEMA,
  TREND_SCHEMA,
  type StorySignal,
  type TrendInput,
} from "./prompts";

const DAY = 24 * 60 * 60 * 1000;
const STORY_WINDOW_DAYS = 30;
const TREND_WINDOW_DAYS = 45;

async function profileOf(db: SupabaseClient, userId: string): Promise<Profile> {
  const { data } = await db
    .from("profiles")
    .select("product_name, product_pitch, ideal_customer, differentiators")
    .eq("id", userId)
    .maybeSingle();
  return (data as Profile) ?? { product_name: null, product_pitch: null, ideal_customer: null };
}

export type InsightResult = { found: number; message: string };

// Linked signals: joins related recent signals of ONE competitor into stories.
export async function findStories(
  db: SupabaseClient,
  userId: string,
  competitorId: string,
  { timeoutMs = 40000 } = {},
): Promise<InsightResult> {
  if (!geminiConfigured()) return { found: 0, message: "AI isn't set up yet: the GEMINI_API_KEY setting is missing." };
  const [{ data: competitor }, { data: rows }] = await Promise.all([
    db.from("competitors").select("id, name").eq("id", competitorId).eq("user_id", userId).maybeSingle(),
    db
      .from("signals")
      .select("id, title, what_changed, category, created_at")
      .eq("competitor_id", competitorId)
      .eq("user_id", userId)
      .eq("noise", false)
      .neq("status", "dismissed")
      .gte("created_at", new Date(Date.now() - STORY_WINDOW_DAYS * DAY).toISOString())
      .order("created_at", { ascending: true })
      .limit(25),
  ]);
  if (!competitor) return { found: 0, message: "Competitor not found." };
  const signals: StorySignal[] = (rows ?? []).map((r) => ({
    id: r.id,
    title: r.title,
    what_changed: r.what_changed,
    category: r.category,
    date: r.created_at,
  }));
  if (signals.length < 2) {
    return { found: 0, message: `Riposte needs at least 2 signals from ${competitor.name} in the last ${STORY_WINDOW_DAYS} days to connect them.` };
  }

  const stories = cleanStories(
    await generateJson(buildStoryPrompt(await profileOf(db, userId), competitor.name, signals), STORY_SCHEMA, { timeoutMs }),
    signals,
  );

  // Keep stories someone already reviewed or dismissed; replace the rest with the new reading.
  const { data: kept } = await db
    .from("stories")
    .select("signal_ids")
    .eq("competitor_id", competitorId)
    .neq("status", "new");
  const keptKeys = new Set((kept ?? []).map((k) => [...(k.signal_ids as string[])].sort().join(",")));
  await db.from("stories").delete().eq("competitor_id", competitorId).eq("status", "new");
  const fresh = stories.filter((s) => !keptKeys.has([...s.signal_ids].sort().join(",")));
  if (fresh.length) {
    await db.from("stories").insert(fresh.map((s) => ({ ...s, user_id: userId, competitor_id: competitorId })));
  }
  return {
    found: fresh.length,
    message: fresh.length
      ? `Found ${fresh.length} connected ${fresh.length === 1 ? "move" : "moves"}.`
      : `No connected moves: ${competitor.name}'s recent changes look unrelated.`,
  };
}

// Trend alerts: topics that two or more competitors published about recently.
export async function findTrends(db: SupabaseClient, userId: string, { timeoutMs = 45000 } = {}): Promise<InsightResult> {
  if (!geminiConfigured()) return { found: 0, message: "AI isn't set up yet: the GEMINI_API_KEY setting is missing." };
  const { data: competitors } = await db.from("competitors").select("id, name").eq("user_id", userId);
  const list = competitors ?? [];
  const since = Date.now() - TREND_WINDOW_DAYS * DAY;

  const [content, { data: newPages }] = await Promise.all([
    loadContent(
      db,
      list.map((c) => c.id),
    ),
    db
      .from("changes")
      .select("competitor_id, added, kind")
      .eq("user_id", userId)
      .in("kind", ["new_pages", "new_posts"])
      .gte("detected_at", new Date(since).toISOString()),
  ]);

  const inputs: TrendInput[] = [];
  for (const c of list) {
    const titles = new Set<string>();
    for (const item of content.get(c.id)?.feed ?? []) {
      const t = item.date ? Date.parse(item.date) : NaN;
      if (Number.isFinite(t) && t >= since && item.title) titles.add(item.title.slice(0, 160));
    }
    for (const ch of (newPages ?? []).filter((x) => x.competitor_id === c.id)) {
      for (const a of (ch.added as unknown[]) ?? []) {
        const t = typeof a === "string" ? titleFromUrl(a) : ((a as { title?: string }).title ?? "");
        if (t.length > 8) titles.add(t.slice(0, 160));
      }
    }
    if (titles.size) inputs.push({ id: c.id, name: c.name, titles: [...titles].slice(0, 40) });
  }
  if (inputs.length < 2) {
    return {
      found: 0,
      message: `Trends need at least 2 competitors that published in the last ${TREND_WINDOW_DAYS} days. Right now ${inputs.length} ${inputs.length === 1 ? "does" : "do"}. Add competitors with a blog feed.`,
    };
  }

  const trends = cleanTrends(
    await generateJson(buildTrendPrompt(await profileOf(db, userId), inputs, TREND_WINDOW_DAYS), TREND_SCHEMA, { timeoutMs }),
    inputs,
  );
  await db.from("trends").delete().eq("user_id", userId).eq("status", "new");
  if (trends.length) await db.from("trends").insert(trends.map((t) => ({ ...t, user_id: userId })));
  return {
    found: trends.length,
    message: trends.length
      ? `Found ${trends.length} ${trends.length === 1 ? "trend" : "trends"} across ${inputs.length} competitors.`
      : `No shared topics yet across the ${inputs.length} competitors publishing recently.`,
  };
}
