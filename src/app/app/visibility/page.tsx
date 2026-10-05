import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { card, eyebrow } from "@/components/styles";
import { timeAgo } from "@/lib/time";
import { entitiesFor, shareOfVoice, topCitations, type AnswerRow, type Citation, type Mention } from "@/lib/visibility/analyse";
import { RunButton } from "./RunButton";

export const metadata = { title: "AI visibility · Riposte" };
export const maxDuration = 90;

type Answer = AnswerRow & {
  id: string;
  engine: string;
  run_at: string;
  answer: string;
  queries: string[];
  you_mentioned: boolean;
  you_position: number | null;
  search_entry: string | null;
};

const pct = (n: number) => `${Math.round(n * 100)}%`;

// Light clean-up of the AI's markdown so it reads as plain text.
const plain = (s: string) =>
  s
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/^#+\s*/gm, "")
    .replace(/^\s*[*-]\s+/gm, "• ");

export default async function VisibilityPage() {
  const { supabase, user } = await requireUser();
  const [{ data: profile }, { data: comps }, { data: promptRows }] = await Promise.all([
    supabase.from("profiles").select("product_name").eq("id", user.id).maybeSingle(),
    supabase.from("competitors").select("id, name, domain").order("name"),
    supabase.from("ai_prompts").select("id, topic, kind, text").eq("tracked", true).order("position"),
  ]);
  const prompts = promptRows ?? [];
  const entities = entitiesFor(profile?.product_name ?? null, comps ?? []);
  const { data: answerRows } = prompts.length
    ? await supabase
        .from("visibility_answers")
        .select("id, prompt_id, run_at, engine, answer, queries, mentions, citations, you_mentioned, you_position, search_entry")
        .in("prompt_id", prompts.map((p) => p.id))
        .order("run_at", { ascending: false })
        .limit(300)
    : { data: [] };
  const answers = (answerRows ?? []) as Answer[];

  // Latest and previous answer per prompt.
  const latest = new Map<string, Answer>();
  const previous = new Map<string, Answer>();
  for (const a of answers) {
    if (!latest.has(a.prompt_id)) latest.set(a.prompt_id, a);
    else if (!previous.has(a.prompt_id)) previous.set(a.prompt_id, a);
  }
  const now = [...latest.values()];
  const before = [...previous.values()];
  const shares = shareOfVoice(now, entities);
  const beforeShares = new Map(shareOfVoice(before, entities).map((s) => [`${s.key}:${s.name}`, s.share]));
  const cited = topCitations(now);
  const compDomains = new Map((comps ?? []).map((c) => [c.domain.replace(/^www\./, ""), c.name]));
  const lastRun = answers[0]?.run_at;
  const noSearch = now.filter((a) => a.engine === "gemini-no-search").length;
  const gaps = prompts
    .map((p) => ({ p, a: latest.get(p.id) }))
    .filter((x): x is { p: typeof x.p; a: Answer } => Boolean(x.a && !x.a.you_mentioned && x.a.mentions.some((m) => m.key !== "you" && m.key !== "other")));

  return (
    <div>
      <p className={eyebrow}>AI visibility</p>
      <h1 className="mt-1 font-display text-3xl font-bold">Who AI recommends</h1>
      <p className="mt-2 max-w-2xl text-muted">
        Your tracked prompts, asked in Gemini with Google Search the way a buyer would. Riposte records which products
        each answer names, in what order, and which sites it used. Asked again every week, or now.
      </p>

      {!prompts.length ? (
        <section className={`${card} mt-6 p-6`}>
          <h2 className="font-display text-xl font-bold">No prompts tracked yet</h2>
          <p className="mt-1 text-sm text-muted">
            Open <Link href="/app/prompts" className="font-semibold text-accent hover:underline">Prompt Studio</Link>, write
            prompts from your keywords, and click Track on up to 10.
          </p>
        </section>
      ) : (
        <>
          <section className={`${card} mt-6 flex flex-wrap items-center justify-between gap-4 p-5`}>
            <div>
              <p className="text-sm">
                <span className="font-semibold">{prompts.length} tracked prompts</span>
                {lastRun ? <span className="text-muted"> · last asked {timeAgo(lastRun)}</span> : <span className="text-muted"> · not asked yet</span>}
              </p>
              <p className="mt-0.5 text-xs text-muted">Engine: Gemini with Google Search. Answers vary run to run, so watch the trend.</p>
              {noSearch > 0 && (
                <p className="mt-2 max-w-xl rounded-lg bg-signal-soft px-3 py-2 text-xs">
                  {noSearch} of {now.length} answers came from Gemini&apos;s own knowledge, without live Google Search, because
                  this Gemini key has no search quota. They show what the model already believes about the category, but have
                  no sources. Turning on billing for the key in Google AI Studio enables search (the first 5,000 searches a
                  month are free).
                </p>
              )}
            </div>
            <RunButton first={!lastRun} count={prompts.length} />
          </section>

          {now.length > 0 && (
            <div className="mt-6 grid gap-5 lg:grid-cols-[3fr_2fr]">
              <section className={card}>
                <div className="border-b border-line px-5 py-4">
                  <h2 className="font-display text-xl font-bold">Share of AI answers</h2>
                  <p className="mt-0.5 text-sm text-muted">How many of the {now.length} answers name each product.</p>
                </div>
                <ul className="flex flex-col gap-3 px-5 py-4">
                  {shares.map((s) => {
                    const prev = beforeShares.get(`${s.key}:${s.name}`);
                    const delta = before.length && prev !== undefined ? Math.round((s.share - prev) * 100) : null;
                    const you = s.key === "you";
                    return (
                      <li key={`${s.key}:${s.name}`}>
                        <div className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
                          <span className={you ? "font-bold" : s.key === "other" ? "text-muted" : "font-semibold"}>
                            {s.name}
                            {you && " (you)"}
                            {s.key === "other" && <span className="ml-1.5 text-xs">not tracked</span>}
                          </span>
                          <span className="font-mono text-xs text-muted">
                            {s.prompts}/{now.length} · {pct(s.share)}
                            {s.avgPosition !== null && ` · avg #${s.avgPosition.toFixed(1)}`}
                            {delta !== null && delta !== 0 && (
                              <span className={delta > 0 ? "text-accent" : "text-danger"}> {delta > 0 ? `▲${delta}` : `▼${-delta}`}</span>
                            )}
                          </span>
                        </div>
                        <div className="mt-1 h-2 rounded-full bg-bg">
                          <div
                            className={`h-2 rounded-full ${you ? "bg-accent" : s.key === "other" ? "bg-line" : "bg-signal"}`}
                            style={{ width: `${Math.max(s.share * 100, s.prompts ? 2 : 0)}%` }}
                          />
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </section>

              <section className={card}>
                <div className="border-b border-line px-5 py-4">
                  <h2 className="font-display text-xl font-bold">Sites AI relies on</h2>
                  <p className="mt-0.5 text-sm text-muted">Sources behind the answers. Being listed here is how you get named.</p>
                </div>
                <ul className="divide-y divide-line text-sm">
                  {cited.map((c) => (
                    <li key={c.domain} className="flex items-center justify-between gap-3 px-5 py-2">
                      <span className="min-w-0 truncate">
                        {c.domain}
                        {compDomains.has(c.domain) && <span className="ml-1.5 text-xs font-semibold text-signal">{compDomains.get(c.domain)}</span>}
                      </span>
                      <span className="font-mono text-xs text-muted">{c.count}×</span>
                    </li>
                  ))}
                  {!cited.length && <li className="px-5 py-3 text-muted">No sources returned yet.</li>}
                </ul>
              </section>
            </div>
          )}

          {gaps.length > 0 && (
            <section className={`${card} mt-6`}>
              <div className="border-b border-line px-5 py-4">
                <h2 className="font-display text-xl font-bold">Where competitors are named and you aren&apos;t</h2>
                <p className="mt-0.5 text-sm text-muted">
                  {gaps.length} of {now.length} answers. Each is a page to create or a site to get listed on.
                </p>
              </div>
              <ul className="divide-y divide-line">
                {gaps.map(({ p, a }) => (
                  <li key={p.id} className="px-5 py-3 text-sm">
                    <p className="font-semibold">{p.text}</p>
                    <p className="mt-1 text-muted">
                      Named:{" "}
                      {a.mentions
                        .filter((m) => m.key !== "you")
                        .slice(0, 5)
                        .map((m) => `#${m.position} ${m.name}`)
                        .join(", ")}
                      {a.citations.length > 0 && (
                        <>
                          {" · "}Sources: {a.citations.slice(0, 3).map((c) => c.domain).join(", ")}
                        </>
                      )}
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className={`${card} mt-6`}>
            <div className="border-b border-line px-5 py-4">
              <h2 className="font-display text-xl font-bold">Every prompt</h2>
              <p className="mt-0.5 text-sm text-muted">Open one to read the full answer, the searches it ran and its sources.</p>
            </div>
            <ul className="divide-y divide-line">
              {prompts.map((p) => {
                const a = latest.get(p.id);
                return (
                  <li key={p.id} className="px-5 py-4">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className={`rounded-full px-2 py-0.5 font-semibold ${p.kind === "spear" ? "bg-signal-soft text-signal" : "bg-accent-soft text-ink"}`}>
                        {p.topic}
                      </span>
                      {a ? (
                        a.you_mentioned ? (
                          <span className="font-semibold text-accent">✓ You&apos;re named #{a.you_position}</span>
                        ) : (
                          <span className="font-semibold text-danger">You&apos;re not named</span>
                        )
                      ) : (
                        <span className="text-muted">Not asked yet</span>
                      )}
                      {a && <span className="font-mono text-muted">{timeAgo(a.run_at)}</span>}
                      {a?.engine === "gemini-no-search" && <span className="text-muted">· no web search</span>}
                    </div>
                    <p className="mt-1.5 font-semibold">{p.text}</p>
                    {a && (
                      <>
                        <MentionChips mentions={a.mentions} />
                        <details className="mt-2 text-sm">
                          <summary className="cursor-pointer select-none text-muted hover:text-ink">Read the answer</summary>
                          <AnswerDetail a={a} />
                        </details>
                      </>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        </>
      )}
    </div>
  );
}

function MentionChips({ mentions }: { mentions: Mention[] }) {
  if (!mentions.length) return <p className="mt-1.5 text-sm text-muted">No products named.</p>;
  return (
    <p className="mt-1.5 flex flex-wrap gap-1.5 text-xs">
      {mentions.map((m) => (
        <span
          key={`${m.key}:${m.name}`}
          className={`rounded px-1.5 py-0.5 ${
            m.key === "you" ? "bg-accent text-accent-ink font-semibold" : m.key === "other" ? "bg-bg text-muted" : "bg-signal-soft text-signal font-semibold"
          }`}
        >
          #{m.position} {m.name}
        </span>
      ))}
    </p>
  );
}

function AnswerDetail({ a }: { a: Answer & { citations: Citation[] } }) {
  return (
    <div className="mt-2 flex flex-col gap-3">
      <div className="max-h-96 overflow-y-auto whitespace-pre-wrap rounded-lg bg-bg p-3 text-sm leading-relaxed">{plain(a.answer)}</div>
      {a.queries.length > 0 && (
        <p className="text-xs text-muted">
          <span className="font-semibold text-ink">Searches it ran: </span>
          {a.queries.map((q) => `"${q}"`).join(" · ")}
        </p>
      )}
      {a.citations.length > 0 && (
        <p className="text-xs text-muted">
          <span className="font-semibold text-ink">Sources: </span>
          {a.citations.map((c) => c.domain).join(" · ")}
        </p>
      )}
      {a.search_entry && (
        <iframe
          title="Google search suggestions"
          srcDoc={a.search_entry}
          sandbox="allow-popups allow-popups-to-escape-sandbox"
          className="h-16 w-full rounded-lg border-0"
        />
      )}
    </div>
  );
}
