import { PanelHead } from "@/components/ui";
import { timeAgo } from "@/lib/time";
import { SURVEY, labelFor, type SurveyKey } from "@/lib/survey";

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

// The beta survey, summed up: the "very disappointed" score first (40% or more is the goal),
// then a bar per answer for each question, then every written answer.
export function SurveyResults({ rows }: { rows: SurveyRow[] }) {
  const answered = rows.filter((r) => r.answered_at);
  const scored = answered.filter((r) => r.disappointment);
  const very = scored.filter((r) => r.disappointment === "very").length;
  const pct = scored.length ? Math.round((very / scored.length) * 100) : 0;
  const calls = answered.filter((r) => r.call_ok);

  const tally = (key: SurveyKey) => {
    const n = answered.filter((r) => r[key]).length;
    return (SURVEY[key].options as readonly (readonly [string, string])[]).map(([v, t]) => {
      const c = answered.filter((r) => r[key] === v).length;
      return { t, c, w: n ? Math.round((c / n) * 100) : 0 };
    });
  };

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
        </div>
        {(["before_tool", "most_useful", "fair_price"] as SurveyKey[]).map((key) => (
          <div key={key} className="rounded-xl border border-line p-4">
            <p className="text-sm font-semibold">{SURVEY[key].q}</p>
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
          </div>
        ))}
        <div className="rounded-xl border border-line p-4">
          <p className="text-sm font-semibold">Happy to do a call ({calls.length})</p>
          <ul className="mt-3 flex flex-col gap-1.5 text-sm">
            {calls.map((r) => (
              <li key={r.user_id} className="truncate">
                {r.email}
              </li>
            ))}
            {!calls.length && <li className="text-muted">Nobody yet.</li>}
          </ul>
        </div>
      </div>
      <ul className="divide-y divide-line border-t border-line">
        {answered.map((r) => (
          <li key={r.user_id} className="px-4 py-4 text-sm">
            <p className="text-xs text-muted">
              <span className="font-semibold text-ink">{r.email}</span> · {timeAgo(r.answered_at!)}
              {r.disappointment && ` · ${labelFor("disappointment", r.disappointment).toLowerCase()}`}
              {r.fair_price && ` · fair price: ${labelFor("fair_price", r.fair_price)}`}
            </p>
            {r.missing && (
              <p className="mt-1.5">
                <span className="font-semibold">Confusing or missing: </span>
                {r.missing}
              </p>
            )}
          </li>
        ))}
        {!answered.length && <li className="px-4 py-6 text-center text-sm text-muted">No answers yet. The survey shows to people 7 days after you approve them.</li>}
      </ul>
    </>
  );
}
