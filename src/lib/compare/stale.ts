import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Comparison } from "./prompt";

export type ComparisonRow = {
  competitor_id: string;
  generated_at: string;
  content: Comparison;
  previous_content: Comparison | null;
  previous_generated_at: string | null;
  signal_ids: string[];
};
export type StaleSignal = { id: string; title: string; created_at: string; category: string };

// A comparison page is out of date when the competitor changed pricing, product or positioning
// after the page was written.
export async function loadComparisons(db: SupabaseClient, competitorIds?: string[]) {
  let q = db.from("comparisons").select("competitor_id, generated_at, content, previous_content, previous_generated_at, signal_ids");
  if (competitorIds) q = q.in("competitor_id", competitorIds);
  const { data } = await q;
  const pages = (data ?? []) as ComparisonRow[];
  const stale = new Map<string, StaleSignal[]>();
  if (pages.length) {
    const oldest = pages.reduce((m, p) => (p.generated_at < m ? p.generated_at : m), pages[0].generated_at);
    const { data: sigs } = await db
      .from("signals")
      .select("id, competitor_id, title, created_at, category")
      .in("competitor_id", pages.map((p) => p.competitor_id))
      .eq("noise", false)
      .in("category", ["pricing", "product", "positioning"])
      .gt("created_at", oldest)
      .order("created_at", { ascending: false });
    for (const p of pages) {
      const used = new Set(p.signal_ids);
      const fresh = (sigs ?? []).filter((s) => s.competitor_id === p.competitor_id && s.created_at > p.generated_at && !used.has(s.id));
      if (fresh.length) stale.set(p.competitor_id, fresh as StaleSignal[]);
    }
  }
  return { pages: new Map(pages.map((p) => [p.competitor_id, p])), stale };
}
