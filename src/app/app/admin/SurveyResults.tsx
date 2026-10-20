import { PanelHead } from "@/components/ui";
import { timeAgo } from "@/lib/time";
import { SURVEY, labelFor, splitAnswers, isMulti, type SurveyKey } from "@/lib/survey";

export type SurveyRow = {
  user_id: string;
  email: string | null;
  answered_at: string | null;
  dismissed_at: string | null;
  emailed_at: string | null;
  before_tool: string | null;
  most_useful: string | null;
  disappointment: string | null;
  fair_price: string | null;
  missing: string | null;
  call_ok: boolean | null;
};

const DIS = { very: "Very", somewhat: "Somewhat", not: "Not" } as Record<string, string>;

// The beta survey, summed up so it reads the same with 3 answers or 300:
// the "very disappointed" score, a bar per answer, who's happy to talk,
// then one compact row per person that opens to show everything they said.
export function SurveyResults({ rows }: { rows: SurveyRow[] }) {
  const answered = rows.filter((r) => r.answered_at);
  const scored = answered.filter((r) => r.disappointment);
  const very = scored.filter((r) => r.disappointment === "very").length;
  const pct = scored.length ? Math.round((very / scored.length) * 100) : 0;
  const calls = answered.filter((r) => r.call_ok);

  // Share of people who picked each option (checkbox questions can add up to more than 100%).
  const tally = (key: SurveyKey) => {
    const n = answered.filter((r) => r[key]).length;
    return (SURVEY[key].options as readonly (readonly [string, string])[]).map(([v, t]) => {
      const c = answered.filter((r) => splitAnswers(r[key]).some((a) => a === v || (v === "other" && a.startsWith("other")))).length;
      return { t, c, w: n ? Math.round((c / n) * 100) : 0 };
    });
  };
  const ownWords = (key: SurveyKey) =>
    answered.flatMap((r) => splitAnswers(r[key]).filter((a) => a.startsWith("other:")).map((a) => ({ who: r.email, text: a.slice(6) })));

  return (
    <>
      <PanelHead
        title="Beta survey"
        description={`${answered.length} answered · ${rows.filter((r) => r.dismissed_at && !r.answered_at).length} said not now · ${rows.filter((r) => r.emailed_at).length} reminder ${rows.filter((r) => r.emailed_at).length === 1 ? "email" : "emails"} sent`}
      />
      <div className="grid gap-4 px-4 pb-4 lg:grid-cols-2">
        <div className="rounded-xl border border-line p-4 lg:col-span-2">
          <p className="text-sm font-semibold">Would be very disappointed without Riposte</p>
          <p className="mt-1 flex items-baseline gap-2">
            <span className={`font-display text-4xl font-bold ${pct >= 40 ? "text-accent" : ""}`}>{scored.length ? `${pct}%` : "–"}</span>
            <span className="text-sm text-muted">
              {very} of {scored.length} · the goal is 40% or more
            </span>
          </p>
          <p className="mt-2 text-xs text-muted">
            The most important number here. If 40% or more would be very disappointed to lose Riposte, it solves a real problem and is ready to launch.
            Below that, look at what those who said &quot;very&quot; have in common.
          </p>
        </div>
        {(["before_tool", "most_useful", "fair_price"] as SurveyKey[]).map((key) => (
          <div key={key} className="rounded-xl border border-line p-4">
            <p className="text-sm font-semibold">
              {SURVEY[key].q} {isMulti(key) && <span className="font-normal text-muted">(several allowed)</span>}
            </p>
            <ul className="mt-3 flex flex-col gap-2 text-sm">
              {tally(key).map((o) => (
                <li key={o.t}>
                  <div className="flex justify-between gap-3">
                    <span>{o.t}</span>
                    <span className="text-muted">{o.c}</span>
                  </div>
                  <div className="mt-1 h-2 rounded-full bg-line">
                    <div className="h-2 rounded-full bg-accent" style={{ width: `${o.w}%` }} />
                  </div>
                </li>
              ))}
            </ul>
            {isMulti(key) && ownWords(key).length > 0 && (
              <details className="mt-3 text-sm">
                <summary className="cursor-pointer text-muted">&quot;Something else&quot; answers ({ownWords(key).length})</summary>
                <ul className="mt-2 flex flex-col gap-1">
                  {ownWords(key).map((o, i) => (
                    <li key={i}>
                      &quot;{o.text}&quot; <span className="text-xs text-muted">· {o.who}</span>
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </div>
        ))}
        <div className="rounded-xl border border-line p-4">
          <p className="text-sm font-semibold">Happy to do a call ({calls.length})</p>
          <ul className="mt-3 flex max-h-56 flex-col gap-1.5 overflow-auto text-sm">
            {calls.map((r) => (
              <li key={r.user_id} className="truncate">
                {r.email}
              </li>
            ))}
            {!calls.length && <li className="text-muted">Nobody yet.</li>}
          </ul>
        </div>
      </div>

      <div className="border-t border-line">
        <p className="px-4 pt-4 text-sm font-semibold">Answers by person ({answered.length})</p>
        <div className="hidden grid-cols-[1.6fr_0.7fr_0.8fr_0.8fr_1.6fr] gap-3 px-4 pt-3 pb-2 text-xs font-semibold uppercase tracking-wider text-muted md:grid">
          <span>Who</span>
          <span>When</span>
          <span>Disappointed</span>
          <span>Fair price</span>
          <span>Confusing or missing</span>
        </div>
        <ul className="divide-y divide-line">
          {answered.map((r) => (
            <li key={r.user_id}>
              <details className="group px-4 py-2.5 text-sm">
                <summary className="grid cursor-pointer list-none grid-cols-2 gap-x-3 gap-y-1 marker:hidden md:grid-cols-[1.6fr_0.7fr_0.8fr_0.8fr_1.6fr] md:items-center">
                  <span className="truncate font-semibold">
                    <span className="mr-1 inline-block text-muted transition group-open:rotate-90">›</span>
                    {r.email}
                  </span>
                  <span className="text-muted">{timeAgo(r.answered_at!)}</span>
                  <span>{r.disappointment ? DIS[r.disappointment] : "–"}</span>
                  <span>{r.fair_price ? labelFor("fair_price", r.fair_price) : "–"}</span>
                  <span className="col-span-2 truncate text-muted md:col-span-1">{r.missing ?? "–"}</span>
                </summary>
                <dl className="mt-2 grid gap-1.5 rounded-lg bg-bg p-3 md:grid-cols-[12rem_1fr]">
                  <dt className="font-semibold">Before Riposte</dt>
                  <dd>{labelFor("before_tool", r.before_tool) || "–"}</dd>
                  <dt className="font-semibold">Helps most</dt>
                  <dd>{labelFor("most_useful", r.most_useful) || "–"}</dd>
                  <dt className="font-semibold">Confusing or missing</dt>
                  <dd>{r.missing ?? "–"}</dd>
                  <dt className="font-semibold">Happy to talk</dt>
                  <dd>{r.call_ok == null ? "–" : r.call_ok ? "Yes" : "No"}</dd>
                </dl>
              </details>
            </li>
          ))}
          {!answered.length && <li className="px-4 py-6 text-center text-sm text-muted">No answers yet. The survey shows to people 7 days after you approve them.</li>}
        </ul>
      </div>
    </>
  );
}
