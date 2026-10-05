import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { card, secondaryButton } from "@/components/styles";
import { PageHeader, withParams } from "@/components/ui";
import { SearchBox } from "@/components/ui-client";
import { TopicCard } from "./TopicCard";
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

export default async function PromptsPage({ searchParams }: { searchParams: Promise<{ q?: string; show?: string }> }) {
  const params = await searchParams;
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

  const q = (params.q ?? "").trim().toLowerCase();
  const onlyTracked = params.show === "tracked";
  const visible = (g: (typeof groups)[number]) =>
    g.prompts.filter((p) => (!onlyTracked || p.tracked) && (!q || p.text.toLowerCase().includes(q) || g.topic.toLowerCase().includes(q)));
  const column = (kind: "shield" | "spear") =>
    groups
      .filter((g) => g.kind === kind)
      .map((g) => ({ ...g, rows: visible(g) }))
      .filter((g) => g.rows.length);

  const promptRow = (p: PromptRow) => (
    <li key={p.id} className="flex items-start gap-3 px-4 py-2.5">
      <div className="min-w-0 flex-1">
        <p className="text-sm leading-snug">{p.text}</p>
        <p className="mt-0.5 text-xs text-muted">
          {DIMENSION_LABELS[p.dimension as Dimension] ?? p.dimension}
          {p.source === "manual" && " · added by you"}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <form action={toggleTracked}>
          <input type="hidden" name="prompt_id" value={p.id} />
          <input type="hidden" name="track" value={p.tracked ? "0" : "1"} />
          {p.tracked ? (
            <SubmitButton pendingLabel="…" className="rounded-lg border border-accent bg-accent-soft px-2.5 py-1 text-xs font-semibold text-ink">
              ✓ Tracked
            </SubmitButton>
          ) : tracked < MAX_TRACKED ? (
            <SubmitButton pendingLabel="…" className="rounded-lg border border-line px-2.5 py-1 text-xs font-semibold hover:border-muted">
              Track
            </SubmitButton>
          ) : null}
        </form>
        <form action={deletePrompt}>
          <input type="hidden" name="prompt_id" value={p.id} />
          <SubmitButton pendingLabel="…" className="rounded-lg px-2 py-1 text-muted hover:text-danger">
            <span aria-label="Delete prompt">×</span>
          </SubmitButton>
        </form>
      </div>
    </li>
  );

  const topicColumn = (kind: "shield" | "spear") => {
    const list = column(kind);
    return (
      <div className="flex min-w-0 flex-col gap-3">
        <div>
          <h2 className="font-display text-lg font-bold">{kind === "shield" ? "Shield topics" : "Spear topics"}</h2>
          <p className="text-sm text-muted">
            {kind === "shield" ? "Broad category questions: your general presence." : "Niches you want to win: one product + situation each."}
          </p>
        </div>
        {list.length ? (
          list.map((g) => {
            const covered = new Set(g.prompts.map((p) => p.dimension));
            return (
              <TopicCard
                key={g.topic}
                initial={q || onlyTracked ? 50 : 4}
                header={
                  <div className="border-b border-line px-4 py-3">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="font-semibold leading-snug">{g.topic}</h3>
                      <span className="shrink-0 text-xs text-muted">
                        {g.prompts.length} prompts · {g.prompts.filter((p) => p.tracked).length} tracked
                      </span>
                    </div>
                    <p className="mt-1.5 flex flex-wrap gap-1 text-[11px]" aria-label="Angles covered">
                      {DIMENSIONS.map((d) => (
                        <span key={d} className={`rounded px-1.5 py-0.5 ${covered.has(d) ? "bg-bg text-ink" : "text-muted line-through opacity-60"}`}>
                          {DIMENSION_LABELS[d]}
                        </span>
                      ))}
                    </p>
                  </div>
                }
                rows={g.rows.map(promptRow)}
              />
            );
          })
        ) : (
          <p className="rounded-2xl border border-dashed border-line p-5 text-sm text-muted">Nothing here{q || onlyTracked ? " for this filter" : " yet"}.</p>
        )}
      </div>
    );
  };

  return (
    <div>
      <PageHeader
        kicker="Prompt Studio"
        title="What buyers ask AI"
        description={`Your keywords turned into the questions buyers type into ChatGPT, Gemini and Perplexity. Every prompt asks for a recommendation and never names a brand. Track up to ${MAX_TRACKED} to see who AI recommends.`}
        actions={
          prompts.length > 0 ? (
            <a href="/app/prompts/export" className={secondaryButton} download>
              Download CSV (Profound-ready)
            </a>
          ) : undefined
        }
      />

      {!profile?.product_pitch && (
        <p className="mt-5 rounded-xl border border-line bg-signal-soft px-4 py-3 text-sm">
          Fill in <Link href="/app/product" className="font-semibold underline">Your product</Link> first, so the prompts
          match your category and buyers.
        </p>
      )}

      <div className="mt-5 grid items-start gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <section className={`${card} p-5`}>
          <h2 className="mb-3 font-display text-lg font-bold">{prompts.length ? "Write new prompts" : "Write prompts"}</h2>
          <GenerateForm keywords={profile?.aeo_keywords ?? ""} priorities={profile?.aeo_priorities ?? ""} hasPrompts={prompts.length > 0} />
        </section>
        <div className="flex flex-col gap-4">
          {prompts.length > 0 && (
            <section className={`${card} grid grid-cols-3 divide-x divide-line text-center`}>
              <div className="p-3">
                <p className="font-display text-2xl font-bold">{prompts.length}</p>
                <p className="text-xs text-muted">prompts</p>
              </div>
              <div className="p-3">
                <p className="font-display text-2xl font-bold">{groups.length}</p>
                <p className="text-xs text-muted">topics</p>
              </div>
              <Link href="/app/visibility" className="p-3 hover:bg-bg">
                <p className={`font-display text-2xl font-bold ${tracked ? "text-accent" : ""}`}>
                  {tracked}/{MAX_TRACKED}
                </p>
                <p className="text-xs text-muted">tracked · see results →</p>
              </Link>
            </section>
          )}
          <section className={`${card} p-5`}>
            <h2 className="font-display text-lg font-bold">Add your own prompt</h2>
            <p className="mb-3 mt-0.5 text-sm text-muted">Checked against the same rules: a buying question, no brand names.</p>
            <AddPromptForm topics={groups.map((g) => g.topic)} />
          </section>
        </div>
      </div>

      {prompts.length > 0 && (
        <>
          <div className="mt-6 flex flex-wrap items-center gap-2">
            <div className="w-full sm:w-80">
              <SearchBox placeholder="Search prompts or topics" />
            </div>
            <nav className="inline-flex rounded-lg border border-line bg-surface p-1 text-sm" aria-label="Show">
              {[
                { key: "", label: "All prompts" },
                { key: "tracked", label: `Tracked (${tracked})` },
              ].map((f) => (
                <Link
                  key={f.key}
                  href={withParams("/app/prompts", { q: params.q, show: f.key || undefined })}
                  scroll={false}
                  className={`rounded-md px-3 py-1.5 font-medium ${(params.show ?? "") === f.key ? "bg-accent-soft text-ink" : "text-muted hover:text-ink"}`}
                >
                  {f.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="mt-4 grid items-start gap-5 lg:grid-cols-2">
            {topicColumn("shield")}
            {topicColumn("spear")}
          </div>
        </>
      )}
    </div>
  );
}
