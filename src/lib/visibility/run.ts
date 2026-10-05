import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { generateJson, geminiConfigured, groundedAnswer, Overloaded, RateLimited } from "@/lib/ai/gemini";
import { attachReasons, buildReasonsPrompt, citationDomains, cleanReasons, entitiesFor, findMentions, REASONS_SCHEMA, type Profile, type Reason } from "./analyse";

const HOUR = 60 * 60 * 1000;

export type VisibilityResult = { asked: number; failed: number; waiting: number; busy: boolean; reason?: string };

// Asks each tracked prompt in Gemini with Google Search and records who the answer names
// and which sites it used. Prompts answered within `freshHours` are skipped.
export async function runVisibility(
  db: SupabaseClient,
  { userId, freshHours = 156, budgetMs = 60000, concurrency = 2 }: { userId?: string; freshHours?: number; budgetMs?: number; concurrency?: number } = {},
): Promise<VisibilityResult> {
  if (!geminiConfigured()) return { asked: 0, failed: 0, waiting: 0, busy: false };
  let q = db.from("ai_prompts").select("id, user_id, text").eq("tracked", true).limit(200);
  if (userId) q = q.eq("user_id", userId);
  const { data: prompts } = await q;
  if (!prompts?.length) return { asked: 0, failed: 0, waiting: 0, busy: false };

  const { data: recent } = await db
    .from("visibility_answers")
    .select("prompt_id")
    .in("prompt_id", prompts.map((p) => p.id))
    .gte("run_at", new Date(Date.now() - freshHours * HOUR).toISOString());
  const done = new Set((recent ?? []).map((r) => r.prompt_id));
  const due = prompts.filter((p) => !done.has(p.id));
  if (!due.length) return { asked: 0, failed: 0, waiting: 0, busy: false };

  const users = [...new Set(due.map((p) => p.user_id as string))];
  const [{ data: profiles }, { data: comps }] = await Promise.all([
    db.from("profiles").select("id, product_name, product_pitch, ideal_customer, differentiators").in("id", users),
    db.from("competitors").select("id, user_id, name, domain").in("user_id", users),
  ]);
  const entitiesOf = new Map(
    users.map((u) => [
      u,
      entitiesFor(
        profiles?.find((p) => p.id === u)?.product_name ?? null,
        (comps ?? []).filter((c) => c.user_id === u),
      ),
    ]),
  );

  const started = Date.now();
  let asked = 0;
  let failed = 0;
  let busy = false;
  let reason: string | undefined;
  let search = true; // switched off for the rest of the run once the key turns out to have no search quota
  let next = 0;

  async function handle(p: { id: string; user_id: string; text: string }) {
    try {
      const answer = await groundedAnswer(p.text, { timeoutMs: 45000, search });
      if (!answer.grounded) search = false;
      // One call reads which products the answer names and the reasons it gives for each.
      let reasons: Reason[] = [];
      try {
        const profile = (profiles?.find((x) => x.id === p.user_id) ?? null) as Profile | null;
        reasons = cleanReasons(await generateJson(buildReasonsPrompt(answer.text, profile), REASONS_SCHEMA, { timeoutMs: 25000 }));
      } catch {
        // known competitors are still found by name; reasons can be added later from the saved answer
      }
      const mentions = attachReasons(
        findMentions(answer.text, entitiesOf.get(p.user_id) ?? [], reasons.map((r) => r.name)),
        reasons,
      );
      const you = mentions.find((m) => m.key === "you");
      const { error: saveError } = await db.from("visibility_answers").insert({
        user_id: p.user_id,
        prompt_id: p.id,
        engine: answer.grounded ? "gemini-google-search" : "gemini-no-search",
        answer: answer.text.slice(0, 20000),
        queries: answer.queries.slice(0, 10),
        mentions,
        citations: citationDomains(answer.sources),
        you_mentioned: Boolean(you),
        you_position: you?.position ?? null,
        search_entry: answer.searchEntry,
      });
      if (saveError) throw new Error(`The answer couldn't be saved: ${saveError.message}`);
      asked++;
    } catch (e) {
      reason = (e as Error).message;
      console.error("visibility", reason);
      if (e instanceof RateLimited || e instanceof Overloaded) {
        busy = true;
        return;
      }
      failed++;
    }
  }

  async function worker() {
    while (!busy && next < due.length && Date.now() - started < budgetMs) await handle(due[next++]);
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, due.length) }, worker));
  return { asked, failed, waiting: due.length - asked - failed, busy, reason };
}
