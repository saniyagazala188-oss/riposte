import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { generateJson, geminiConfigured, Overloaded, RateLimited } from "@/lib/ai/gemini";
import { SOURCE_LABELS, type SourceType } from "@/lib/discovery/parse";
import { buildSignalPrompt, cleanDraft, SIGNAL_SCHEMA, type Profile } from "./prompt";

const MAX_ATTEMPTS = 3;

type PendingChange = {
  id: string;
  user_id: string;
  competitor_id: string;
  kind: "content" | "new_posts" | "new_pages";
  added: unknown[];
  removed: unknown[];
  ai_attempts: number;
  competitors: { name: string; domain: string } | null;
  sources: { type: SourceType; url: string } | null;
};

export type ProcessResult = { written: number; failed: number; waiting: number; skipped?: string };

// Turns detected changes into AI signals. Works with the admin client (all users)
// or a signed-in user's client (that user only, through Row Level Security).
export async function processChanges(
  db: SupabaseClient,
  { userId, limit = 40, concurrency = 2, budgetMs = 45000 }: { userId?: string; limit?: number; concurrency?: number; budgetMs?: number } = {},
): Promise<ProcessResult> {
  if (!geminiConfigured()) return { written: 0, failed: 0, waiting: 0, skipped: "GEMINI_API_KEY is not set" };

  let query = db
    .from("changes")
    .select("id, user_id, competitor_id, kind, added, removed, ai_attempts, competitors(name, domain), sources(type, url)")
    .eq("processed", false)
    .order("detected_at", { ascending: true })
    .limit(limit);
  if (userId) query = query.eq("user_id", userId);
  const { data, error } = await query;
  if (error || !data?.length) return { written: 0, failed: 0, waiting: 0 };
  const pending = data as unknown as PendingChange[];

  // Product profiles, one per user involved.
  const userIds = [...new Set(pending.map((c) => c.user_id))];
  const { data: profiles } = await db
    .from("profiles")
    .select("id, product_name, product_pitch, ideal_customer")
    .in("id", userIds);
  const profileOf = new Map((profiles ?? []).map((p) => [p.id as string, p as Profile]));

  const started = Date.now();
  let written = 0;
  let failed = 0;
  let stop = false;
  let next = 0;

  async function handle(change: PendingChange) {
    const profile = profileOf.get(change.user_id) ?? { product_name: null, product_pitch: null, ideal_customer: null };
    const prompt = buildSignalPrompt(profile, {
      kind: change.kind,
      added: change.added ?? [],
      removed: change.removed ?? [],
      competitorName: change.competitors?.name ?? "A competitor",
      competitorDomain: change.competitors?.domain ?? "",
      pageType: change.sources ? SOURCE_LABELS[change.sources.type] : "Page",
      pageUrl: change.sources?.url ?? "",
    });

    try {
      const draft = cleanDraft(await generateJson(prompt, SIGNAL_SCHEMA));
      if (!draft) throw new Error("Unusable answer");
      const { error: insertError } = await db.from("signals").upsert(
        { user_id: change.user_id, competitor_id: change.competitor_id, change_id: change.id, ...draft },
        { onConflict: "change_id", ignoreDuplicates: true },
      );
      if (insertError) throw new Error(insertError.message);
      await db.from("changes").update({ processed: true }).eq("id", change.id);
      written++;
    } catch (e) {
      if (e instanceof RateLimited || e instanceof Overloaded) {
        stop = true; // AI busy: try the rest next time, without counting this as a failed attempt
        return;
      }
      failed++;
      const attempts = (change.ai_attempts ?? 0) + 1;
      // After a few failed tries, stop retrying; the raw change still shows in the feed.
      await db
        .from("changes")
        .update({ ai_attempts: attempts, processed: attempts >= MAX_ATTEMPTS })
        .eq("id", change.id);
    }
  }

  async function worker() {
    while (!stop && next < pending.length && Date.now() - started < budgetMs) {
      await handle(pending[next++]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, pending.length) }, worker));

  return { written, failed, waiting: pending.length - written - failed };
}
