import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { card, inputClass, primaryButton } from "@/components/styles";
import { PageHeader } from "@/components/ui";
import { SubmitButton } from "@/components/FormButtons";
import { SURVEY, MISSING_Q, CALL_Q, type SurveyKey } from "@/lib/survey";
import { sendSurvey } from "./actions";

export const metadata = { title: "Quick survey · Riposte" };

const label = "text-sm font-semibold";

function Choice({ name, value }: { name: SurveyKey; value?: string | null }) {
  const { q, options } = SURVEY[name];
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className={label}>{q}</legend>
      <div className="mt-1 flex flex-col gap-2 text-sm">
        {(options as readonly (readonly [string, string])[]).map(([v, t]) => (
          <label key={v} className="flex items-center gap-2.5">
            <input type="radio" name={name} value={v} defaultChecked={value === v} className="accent-[var(--color-accent)]" />
            {t}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export default async function SurveyPage({ searchParams }: { searchParams: Promise<{ thanks?: string; error?: string; empty?: string }> }) {
  const params = await searchParams;
  const { supabase, user } = await requireUser();
  const { data: prev } = await supabase
    .from("beta_survey")
    .select("before_tool, most_useful, disappointment, fair_price, missing, call_ok, answered_at")
    .eq("user_id", user.id)
    .maybeSingle();

  return (
    <div>
      <PageHeader
        kicker="Free beta"
        title="Help shape Riposte"
        description="6 quick questions, about 2 minutes. Your answers decide what gets built next and what Riposte should cost. I read every one."
      />
      {params.thanks ? (
        <div className={`${card} mt-6 max-w-2xl p-6`}>
          <p className="font-display text-xl font-bold">Thank you 🙏</p>
          <p className="mt-2 text-muted">
            Your answers are saved. Anything else on your mind? The{" "}
            <Link href="/app/feedback" className="font-semibold text-accent hover:underline">
              feedback form
            </Link>{" "}
            is always open.
          </p>
        </div>
      ) : (
        <form action={sendSurvey} className={`${card} mt-6 flex max-w-2xl flex-col gap-6 p-6`}>
          {params.error && <p className="text-sm text-danger">Couldn&apos;t save your answers. Please try again.</p>}
          {params.empty && <p className="text-sm text-danger">Answer at least one question.</p>}
          {prev?.answered_at && <p className="text-sm text-muted">You answered before. Change anything and send again.</p>}
          <Choice name="before_tool" value={prev?.before_tool} />
          <Choice name="most_useful" value={prev?.most_useful} />
          <Choice name="disappointment" value={prev?.disappointment} />
          <div className="flex flex-col gap-1.5">
            <label htmlFor="missing" className={label}>
              {MISSING_Q}
            </label>
            <textarea id="missing" name="missing" rows={3} className={inputClass} defaultValue={prev?.missing ?? ""} placeholder="One or two lines is plenty" />
          </div>
          <Choice name="fair_price" value={prev?.fair_price} />
          <fieldset className="flex flex-col gap-2">
            <legend className={label}>{CALL_Q}</legend>
            <div className="mt-1 flex gap-5 text-sm">
              {[
                ["yes", "Yes, happy to"],
                ["no", "No thanks"],
              ].map(([v, t]) => (
                <label key={v} className="flex items-center gap-2.5">
                  <input
                    type="radio"
                    name="call_ok"
                    value={v}
                    defaultChecked={prev?.call_ok != null && prev.call_ok === (v === "yes")}
                    className="accent-[var(--color-accent)]"
                  />
                  {t}
                </label>
              ))}
            </div>
          </fieldset>
          <div>
            <SubmitButton pendingLabel="Sending…" className={primaryButton}>
              Send answers
            </SubmitButton>
          </div>
        </form>
      )}
    </div>
  );
}
