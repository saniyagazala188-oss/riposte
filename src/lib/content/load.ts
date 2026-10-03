import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { FeedItem } from "./stats";

export type CompetitorContent = { feed: FeedItem[]; urls: string[]; hasFeed: boolean; hasSitemap: boolean };

// The latest blog feed and sitemap that Riposte read for each competitor.
export async function loadContent(db: SupabaseClient, competitorIds: string[]): Promise<Map<string, CompetitorContent>> {
  const out = new Map<string, CompetitorContent>();
  for (const id of competitorIds) out.set(id, { feed: [], urls: [], hasFeed: false, hasSitemap: false });
  if (!competitorIds.length) return out;

  const { data: sources } = await db
    .from("sources")
    .select("id, competitor_id, type")
    .in("competitor_id", competitorIds)
    .in("type", ["feed", "sitemap"]);
  if (!sources?.length) return out;

  // Newest snapshot per page only (older ones would repeat the same posts and pages).
  const latest = await Promise.all(
    sources.map((src) =>
      db
        .from("snapshots")
        .select("items")
        .eq("source_id", src.id)
        .order("fetched_at", { ascending: false })
        .limit(1)
        .maybeSingle()
        .then(({ data }) => ({ src, items: data?.items })),
    ),
  );
  for (const { src, items } of latest) {
    const entry = out.get(src.competitor_id);
    if (!entry || !Array.isArray(items)) continue;
    if (src.type === "feed") {
      entry.feed.push(...(items as FeedItem[]));
      entry.hasFeed = true;
    } else {
      entry.urls.push(...(items as string[]));
      entry.hasSitemap = true;
    }
  }
  for (const e of out.values()) e.urls = [...new Set(e.urls)];
  return out;
}
