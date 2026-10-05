import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { generateJson, geminiConfigured, groundedAnswer, Overloaded, RateLimited } from "@/lib/ai/gemini";
import { BRAND_SCHEMA, buildBrandPrompt, citationDomains, cleanBrands, entitiesFor, findMentions } from "./analyse";

const HOUR = 60 * 60 * 1000;

export type VisibilityResult = { asked: number; failed: number; waiting: number; busy: boolean };

// Asks each tracked prompt in Gemini with Google Search and records who the answer names
// and which sites it used. Prompts answered within `freshHours` are skipped.
export async function runVisibility(
  db: SupabaseClient,
  { userId, freshHours = 156, budgetMs = 60000, concurrency = 3 }: { userId?: string; freshHours?: number; budgetMs?: number; concurrency?: number } = {},
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
    db.from("profiles").select("id, product_name").in("id", users),
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
  let next = 0;

  async function handle(p: { id: string; user_id: string; text: string }) {
    try {
      const answer = await groundedAnswer(p.text, { timeoutMs: 45000 });
      let others: string[] = [];
      try {
        others = cleanBrands(await generateJson(buildBrandPrompt(answer.text), BRAND_SCHEMA, { timeoutMs: 20000 }));
      } catch {
        // known competitors are still found by name
      }
      const mentions = findMentions(answer.text, entitiesOf.get(p.user_id) ?? [], others);
      const you = mentions.find((m) => m.key === "you");
      await db.from("visibility_answers").insert({
        user_id: p.user_id,
        prompt_id: p.id,
        answer: answer.text.slice(0, 20000),
        queries: answer.queries.slice(0, 10),
        mentions,
        citations: citationDomains(answer.sources),
        you_mentioned: Boolean(you),
        you_position: you?.position ?? null,
        search_entry: answer.searchEntry,
      });
      asked++;
    } catch (e) {
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
  return { asked, failed, waiting: due.length - asked - failed, busy };
}
