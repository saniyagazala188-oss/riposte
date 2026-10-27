"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { track } from "@/lib/analytics";
import { WaitlistForm } from "@/components/WaitlistForm";
import { checkAi, type CheckState } from "./actions";

const initial: CheckState = { status: "idle" };
const input = "w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-base outline-none focus:border-accent";
const label = "text-sm font-semibold";

const ordinal = (n: number) => ["", "1st", "2nd", "3rd"][n] ?? `${n}th`;

export function AiCheckTool() {
  const [state, action, pending] = useActionState(checkAi, initial);
  const [shownAt, setShownAt] = useState("");
  // Controlled fields, so nothing is lost when the form is sent.
  const [product, setProduct] = useState("");
  const [site, setSite] = useState("");
  const [about, setAbout] = useState("");
  const result = useRef<HTMLDivElement>(null);
  useEffect(() => setShownAt(String(Date.now())), []);
  useEffect(() => {
    if (state.status === "done") {
      track("ai_check_run", { named_in: state.namedIn });
      result.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [state]);

  const answered = state.status === "done" ? state.questions.filter((q) => !q.failed).length : 0;

  return (
    <div>
      <form action={action} className="flex flex-col gap-4 rounded-2xl border border-line bg-surface p-5 shadow-sm sm:p-6">
        <input type="hidden" name="t" value={shownAt} />
        <div aria-hidden="true" style={{ position: "absolute", left: "-10000px", width: 1, height: 1, overflow: "hidden" }}>
          <label htmlFor="ai-website">Website</label>
          <input id="ai-website" name="website" type="text" tabIndex={-1} autoComplete="off" defaultValue="" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="ai-product" className={label}>
              Your product&apos;s name
            </label>
            <input id="ai-product" name="product" required maxLength={60} className={input} placeholder="e.g. Acme Insights" value={product} onChange={(e) => setProduct(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="ai-site" className={label}>
              Your website
            </label>
            <input id="ai-site" name="site" required className={input} placeholder="yourproduct.com" inputMode="url" value={site} onChange={(e) => setSite(e.target.value)} />
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="ai-about" className={label}>
            What it does, and who it&apos;s for
          </label>
          <textarea
            id="ai-about"
            name="about"
            required
            rows={2}
            maxLength={300}
            className={input}
            placeholder="e.g. Tracks competitor pricing pages for small SaaS marketing teams and sends a weekly summary"
            value={about}
            onChange={(e) => setAbout(e.target.value)}
          />
          <p className="text-xs text-muted">This shapes the buyer questions. Describe the job, not your brand.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button type="submit" disabled={pending} className="rounded-lg bg-accent px-5 py-3 font-semibold text-accent-ink transition hover:brightness-110 disabled:opacity-60">
            {pending ? "Asking AI your buyers' questions…" : "Check if AI recommends me"}
          </button>
          <span className="text-sm text-muted">{pending ? "About 30 to 50 seconds" : "Free · no sign-up · 2 checks a day"}</span>
        </div>
        {state.status === "error" && <p className="text-sm text-danger">{state.message}</p>}
      </form>

      {state.status === "done" && (
        <div ref={result} className="mt-8 scroll-mt-24 rounded-2xl border-2 border-accent bg-surface p-5 shadow-sm sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-accent">Your result</p>
          <h2 className="mt-1 font-display text-2xl font-bold sm:text-3xl">
            {state.product} was named in {state.namedIn} of {answered} answer{answered === 1 ? "" : "s"}
          </h2>
          <p className="mt-2 text-muted">
            {state.namedIn === 0
              ? "AI doesn't recommend you for these questions yet. That's normal for a newer product, and fixable: the answers below show who it picks and which sites it trusts."
              : state.namedIn === answered
                ? "AI already recommends you for every question. Keep the pages it relies on current, and check again as answers change."
                : "AI recommends you for some questions but not all. The gaps below show where a competitor gets picked instead."}
          </p>

          <ol className="mt-6 flex flex-col gap-3">
            {state.questions.map((q, i) => (
              <li key={q.question} className={`rounded-xl border p-4 ${q.youPosition ? "border-accent bg-accent-soft/50" : "border-line"}`}>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <p className="font-semibold">
                    <span className="text-muted">Q{i + 1}.</span> &ldquo;{q.question}&rdquo;
                  </p>
                  <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${q.failed ? "bg-bg text-muted" : q.youPosition ? "bg-accent text-accent-ink" : "bg-signal-soft text-ink"}`}>
                    {q.failed ? "No answer this time" : q.youPosition ? `You're named ${ordinal(q.youPosition)}` : "You're not named"}
                  </span>
                </div>
                {!q.failed && (
                  <>
                    <p className="mt-3 text-xs font-semibold uppercase tracking-widest text-muted">Brands named, in order</p>
                    {q.named.length ? (
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {q.named.map((n) => (
                          <span key={n.name} className={`rounded-full border px-2.5 py-1 text-sm ${n.you ? "border-accent bg-accent font-semibold text-accent-ink" : "border-line bg-surface"}`}>
                            {n.name}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-1.5 text-sm text-muted">The answer gave general advice and didn&apos;t name any brand.</p>
                    )}
                    {q.sites.length > 0 && (
                      <p className="mt-3 text-sm text-muted">
                        <span className="font-semibold text-ink">Leaned on:</span> {q.sites.join(", ")}
                      </p>
                    )}
                    {!q.searched && <p className="mt-2 text-xs text-muted">Answered without a live web search, from what the AI already knew.</p>}
                  </>
                )}
              </li>
            ))}
          </ol>

          <div className="mt-6 grid gap-3 md:grid-cols-2">
            <div className="rounded-xl border border-line p-4">
              <h3 className="text-xs font-semibold uppercase tracking-widest text-muted">Recommended most</h3>
              {state.leaders.length ? (
                <ul className="mt-2 flex flex-col gap-1.5">
                  {state.leaders.map((l) => (
                    <li key={l.name} className="flex justify-between gap-2">
                      <span>{l.name}</span>
                      <span className="text-muted">
                        {l.count} of {answered}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-sm text-muted">No other brand was named.</p>
              )}
            </div>
            <div className="rounded-xl border border-line p-4">
              <h3 className="text-xs font-semibold uppercase tracking-widest text-muted">Sites the answers trusted</h3>
              {state.topSites.length ? (
                <ul className="mt-2 flex flex-col gap-1.5">
                  {state.topSites.map((s) => (
                    <li key={s.domain} className="flex justify-between gap-2">
                      <span className="break-all">{s.domain}</span>
                      <span className="shrink-0 text-muted">
                        {s.count} answer{s.count === 1 ? "" : "s"}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-sm text-muted">The answers didn&apos;t show their sources.</p>
              )}
            </div>
          </div>

          <div className="mt-6 rounded-xl bg-bg p-4">
            <h3 className="font-display text-lg font-bold">What to do next</h3>
            <ol className="mt-2 flex list-decimal flex-col gap-2 pl-5">
              <li>
                <span className="font-semibold">Get onto the sites AI trusts.</span> Look at the list above. If it&apos;s a review site, directory or &ldquo;best tools&rdquo; list, ask to be added.
              </li>
              <li>
                <span className="font-semibold">Publish a page that answers the question in its first line.</span> AI quotes pages that give a clear, direct answer, then back it up.
              </li>
              <li>
                <span className="font-semibold">Check again every week.</span> AI answers change often. One check is a snapshot, not a trend.
              </li>
            </ol>
            <p className="mt-3 text-xs text-muted">One run of Gemini with Google Search. Other AI tools, and the same tool on another day, can answer differently.</p>
          </div>

          <div className="mt-6 flex flex-col gap-3 rounded-xl bg-accent px-5 py-5 text-accent-ink">
            <p className="font-display text-xl font-bold">Track this every week, with the brief to close each gap.</p>
            <p className="text-accent-ink/90">
              Riposte asks your buyers&apos; questions in AI search every week, shows who gets picked and why, and writes the content brief to get you named. Free during the beta.
            </p>
            <div className="rounded-lg bg-surface p-3 text-ink">
              <WaitlistForm id="ai-join" />
            </div>
          </div>
          {state.left > 0 && <p className="mt-3 text-center text-sm text-muted">You can run {state.left} more check today.</p>}
        </div>
      )}
    </div>
  );
}
