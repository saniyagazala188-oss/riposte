"use client";

import { useEffect, useState } from "react";

export type Kind = "launch" | "feature" | "fix" | "decision";
export type Entry = { id: string; time: string | null; iso: string; kind: Kind; phase?: string; title: string; body: string };
export type Day = { label: string; short: string; entries: Entry[] };
export type Week = { id: string; label: string; range: string; days: Day[]; count: number };

export const KIND: Record<Kind, { label: string; badge: string; dot: string }> = {
  launch: { label: "Launch", badge: "bg-accent text-accent-ink", dot: "bg-accent" },
  feature: { label: "Improvement", badge: "bg-accent-soft text-accent", dot: "bg-[#5fb3aa]" },
  fix: { label: "Fix", badge: "bg-signal-soft text-signal", dot: "bg-signal" },
  decision: { label: "Milestone", badge: "bg-[#ece6f6] text-[#4b3a78]", dot: "bg-[#6a54a6]" },
};

// Every update is in the HTML from the start. Older weeks are folded (still readable by search
// engines and AI); the filter buttons only hide updates of other kinds after a click.
export function ChangelogView({ weeks, counts }: { weeks: Week[]; counts: Record<Kind, number> }) {
  const [kind, setKind] = useState<Kind | null>(null);
  const filtered = kind !== null;

  // A link to an update inside a folded week (like the phase links) opens that week first.
  useEffect(() => {
    const open = () => {
      const id = decodeURIComponent(location.hash.slice(1));
      const el = id && document.getElementById(id);
      if (!el) return;
      const d = el.closest("details");
      if (d && !d.open) {
        d.open = true;
        requestAnimationFrame(() => el.scrollIntoView({ block: "start" }));
      }
    };
    open();
    window.addEventListener("hashchange", open);
    return () => window.removeEventListener("hashchange", open);
  }, []);

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filter updates">
        {([null, "launch", "feature", "fix", "decision"] as const).map((k) => {
          const on = kind === k;
          return (
            <button
              key={k ?? "all"}
              type="button"
              aria-pressed={on}
              onClick={() => setKind(k)}
              className={`flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm font-semibold transition ${
                on ? "border-accent bg-accent text-accent-ink" : "border-line bg-surface text-muted hover:border-accent hover:text-accent"
              }`}
            >
              {k && <span className={`h-2 w-2 rounded-full ${on ? "bg-accent-ink" : KIND[k].dot}`} aria-hidden />}
              {k ? KIND[k].label : "Everything"}
              <span className={`text-xs ${on ? "opacity-80" : "opacity-60"}`}>
                {k ? counts[k] : Object.values(counts).reduce((a, b) => a + b, 0)}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-8 flex flex-col gap-6">
        {weeks.map((w, i) => {
          const days = w.days
            .map((d) => ({ ...d, entries: filtered ? d.entries.filter((e) => e.kind === kind) : d.entries }))
            .filter((d) => d.entries.length);
          if (!days.length) return null;
          const n = days.reduce((a, d) => a + d.entries.length, 0);
          const head = (
            <>
              <span className="min-w-0">
                <span className="block font-display text-xl font-bold">{w.label}</span>
                <span className="block text-sm text-muted">{w.range}</span>
              </span>
              <span className="ml-auto flex items-center gap-3">
                <span className="rounded-full bg-bg px-2.5 py-1 text-xs font-semibold text-muted">
                  {n} {n === 1 ? "update" : "updates"}
                </span>
                {!filtered && (
                  <svg aria-hidden viewBox="0 0 20 20" className="h-5 w-5 text-muted transition group-open:rotate-180">
                    <path d="M5 7.5l5 5 5-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </span>
            </>
          );
          const body = (
            <div className="border-t border-line px-4 pb-6 pt-5 sm:px-6">
              {days.map((d) => (
                <div key={d.label} className="mt-6 first:mt-0">
                  <h3 className="inline-flex items-center gap-2 rounded-full border border-line bg-bg px-3 py-1 text-sm font-semibold">
                    <span className="h-2 w-2 rounded-full bg-accent" aria-hidden />
                    {d.label}
                  </h3>
                  <ol className="ml-4 mt-3 border-l-2 border-dashed border-line">
                    {d.entries.map((e) => (
                      <li key={e.id} id={e.id} className="relative scroll-mt-24 pb-4 pl-6 last:pb-0">
                        <span className={`absolute -left-[7px] top-5 h-3 w-3 rounded-full border-2 border-surface ${KIND[e.kind].dot}`} aria-hidden />
                        <article className="rounded-2xl border border-line bg-surface p-4 shadow-[0_14px_30px_-26px_rgba(14,60,58,0.5)] transition hover:border-accent/50 sm:p-5">
                          <div className="flex flex-wrap items-center gap-2 text-xs">
                            <span className={`rounded-full px-2.5 py-0.5 font-semibold ${KIND[e.kind].badge}`}>{KIND[e.kind].label}</span>
                            {e.phase && <span className="rounded-full border border-accent/30 px-2.5 py-0.5 font-semibold text-accent">{e.phase}</span>}
                            {e.time && (
                              <time dateTime={e.iso} className="ml-auto font-mono text-muted">
                                {e.time} IST
                              </time>
                            )}
                          </div>
                          <h4 className="mt-2.5 font-display text-lg font-bold leading-snug">{e.title}</h4>
                          <p className="mt-1.5 text-[0.95rem] leading-relaxed text-muted">{e.body}</p>
                        </article>
                      </li>
                    ))}
                  </ol>
                </div>
              ))}
            </div>
          );
          return (
            <section key={w.id} id={w.id} aria-label={`${w.label}, ${w.range}`} className="scroll-mt-24">
              {filtered ? (
                <div className="overflow-hidden rounded-3xl border border-line bg-surface">
                  <div className="flex items-center gap-4 px-4 py-4 sm:px-6">{head}</div>
                  {body}
                </div>
              ) : (
                <details className="group overflow-hidden rounded-3xl border border-line bg-surface shadow-[0_30px_70px_-55px_rgba(14,60,58,0.5)]" open={i === 0}>
                  <summary className="flex cursor-pointer list-none items-center gap-4 px-4 py-4 hover:bg-bg sm:px-6">{head}</summary>
                  {body}
                </details>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
