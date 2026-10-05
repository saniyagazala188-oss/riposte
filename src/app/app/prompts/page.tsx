import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { card, eyebrow, secondaryButton } from "@/components/styles";
import { SubmitButton } from "@/components/FormButtons";
import { DIMENSION_LABELS, DIMENSIONS, MAX_TRACKED, type Dimension } from "@/lib/aeo/prompts";
import { deletePrompt, toggleTracked } from "./actions";
import { AddPromptForm, GenerateForm } from "./PromptForms";

export const metadata = { title: "Prompt Studio · Riposte" };
export const maxDuration = 90;

type PromptRow = {
  id: string;
  topic: string;
  kind: "shield" | "spear";
  dimension: string;
  text: string;
  source: "ai" | "manual";
  tracked: boolean;
};

export default async function PromptsPage() {
  const { supabase, user } = await requireUser();
  const [{ data: profile }, { data }] = await Promise.all([
    supabase.from("profiles").select("product_pitch, aeo_keywords, aeo_priorities").eq("id", user.id).maybeSingle(),
    supabase.from("ai_prompts").select("id, topic, kind, dimension, text, source, tracked").order("position"),
  ]);
  const prompts = (data ?? []) as PromptRow[];
  const tracked = prompts.filter((p) => p.tracked).length;

  const groups: { topic: string; kind: "shield" | "spear"; prompts: PromptRow[] }[] = [];
  for (const p of prompts) {
    let g = groups.find((x) => x.topic === p.topic);
    if (!g) groups.push((g = { topic: p.topic, kind: p.kind, prompts: [] }));
    g.prompts.push(p);
  }
  groups.sort((a, b) => (a.kind === b.kind ? 0 : a.kind === "shield" ? -1 : 1));

  return (
    <div>
      <p className={eyebrow}>Prompt Studio</p>
      <h1 className="mt-1 font-display text-3xl font-bold">What buyers ask AI</h1>
      <p className="mt-2 max-w-2xl text-muted">
        Turns your keywords into the questions buyers type into ChatGPT, Gemini and Perplexity. Every prompt asks for a
        recommendation, never names a brand, and covers a different angle: who is asking, for what, with which limits.
        Track up to {MAX_TRACKED} to see who AI recommends.
      </p>

      {!profile?.product_pitch && (
        <p className="mt-5 rounded-xl border border-line bg-signal-soft px-4 py-3 text-sm">
          Fill in <Link href="/app/product" className="font-semibold underline">Your product</Link> first, so the prompts
          match your category and buyers.
        </p>
      )}

      <section className={`${card} mt-6 p-5`}>
        <GenerateForm keywords={profile?.aeo_keywords ?? ""} priorities={profile?.aeo_priorities ?? ""} hasPrompts={prompts.length > 0} />
      </section>

      {prompts.length > 0 && (
        <>
          <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm">
              <span className="font-semibold">{prompts.length} prompts</span> in {groups.length} topics ·{" "}
              <span className={tracked ? "font-semibold text-accent" : "text-muted"}>
                {tracked} of {MAX_TRACKED} tracked
              </span>
              {tracked > 0 && (
                <>
                  {" · "}
                  <Link href="/app/visibility" className="text-accent hover:underline">
                    See AI visibility →
                  </Link>
                </>
              )}
            </p>
            <a href="/app/prompts/export" className={secondaryButton} download>
              Download CSV (Profound-ready)
            </a>
          </div>

          <div className="mt-4 flex flex-col gap-5">
            {groups.map((g) => {
              const covered = new Set(g.prompts.map((p) => p.dimension));
              return (
                <section key={g.topic} className={card}>
                  <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line px-5 py-4">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                            g.kind === "spear" ? "bg-signal-soft text-signal" : "bg-accent-soft text-ink"
                          }`}
                        >
                          {g.kind === "spear" ? "Spear · niche to win" : "Shield · category"}
                        </span>
                        <h2 className="font-display text-lg font-bold">{g.topic}</h2>
                      </div>
                      <p className="mt-1.5 flex flex-wrap gap-1.5 text-xs" aria-label="Angles covered">
                        {DIMENSIONS.map((d) => (
                          <span
                            key={d}
                            className={`rounded px-1.5 py-0.5 ${covered.has(d) ? "bg-bg text-ink" : "text-muted line-through opacity-60"}`}
                          >
                            {DIMENSION_LABELS[d]}
                          </span>
                        ))}
                      </p>
                    </div>
                    <span className="text-sm text-muted">{g.prompts.length} prompts</span>
                  </div>
                  <ul className="divide-y divide-line">
                    {g.prompts.map((p) => (
                      <li key={p.id} className="flex flex-col gap-2 px-5 py-3 sm:flex-row sm:items-center">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm">{p.text}</p>
                          <p className="mt-0.5 text-xs text-muted">
                            {DIMENSION_LABELS[p.dimension as Dimension] ?? p.dimension}
                            {p.source === "manual" && " · added by you"}
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          <form action={toggleTracked}>
                            <input type="hidden" name="prompt_id" value={p.id} />
                            <input type="hidden" name="track" value={p.tracked ? "0" : "1"} />
                            {p.tracked ? (
                              <SubmitButton pendingLabel="…" className={`${secondaryButton} border-accent text-accent`}>
                                ✓ Tracked
                              </SubmitButton>
                            ) : tracked < MAX_TRACKED ? (
                              <SubmitButton pendingLabel="…">Track</SubmitButton>
                            ) : (
                              <span className="text-xs text-muted">{MAX_TRACKED} tracked</span>
                            )}
                          </form>
                          <form action={deletePrompt}>
                            <input type="hidden" name="prompt_id" value={p.id} />
                            <SubmitButton pendingLabel="…" className="px-2 text-muted hover:text-danger">
                              <span aria-label="Delete prompt">×</span>
                            </SubmitButton>
                          </form>
                        </div>
                      </li>
                    ))}
                  </ul>
                </section>
              );
            })}
          </div>

          <section className={`${card} mt-5 p-5`}>
            <h2 className="font-semibold">Add your own prompt</h2>
            <p className="mb-3 mt-0.5 text-sm text-muted">Checked against the same rules: a buying question, no brand names.</p>
            <AddPromptForm topics={groups.map((g) => g.topic)} />
          </section>
        </>
      )}
    </div>
  );
}
