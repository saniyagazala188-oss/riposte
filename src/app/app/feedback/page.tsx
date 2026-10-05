import { requireUser } from "@/lib/auth";
import { card, inputClass, primaryButton } from "@/components/styles";
import { PageHeader } from "@/components/ui";
import { SubmitButton } from "@/components/FormButtons";
import { sendFeedback } from "./actions";

export const metadata = { title: "Give feedback · Riposte" };

const label = "text-sm font-semibold";

export default async function FeedbackPage({ searchParams }: { searchParams: Promise<{ thanks?: string; error?: string; empty?: string }> }) {
  const params = await searchParams;
  await requireUser();

  return (
    <div>
      <PageHeader
        kicker="Free beta"
        title="Give feedback"
        description="Riposte is free while it's in beta. Your answers decide what gets built next and what it should cost. Two minutes, and every answer is read."
      />
      {params.thanks ? (
        <div className={`${card} mt-6 p-6`}>
          <p className="font-display text-xl font-bold">Thank you.</p>
          <p className="mt-2 text-muted">I read every answer. Send more any time, the form is always here.</p>
        </div>
      ) : (
        <form action={sendFeedback} className={`${card} mt-6 flex max-w-2xl flex-col gap-5 p-6`}>
          {params.error && <p className="text-sm text-danger">Couldn&apos;t save your feedback. Please try again.</p>}
          {params.empty && <p className="text-sm text-danger">Answer at least one question.</p>}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="uses_for" className={label}>
              What do you use Riposte for?
            </label>
            <textarea id="uses_for" name="uses_for" rows={2} className={inputClass} placeholder="For example: pricing changes, competitor blogs, AI visibility" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="miss_most" className={label}>
              If Riposte disappeared tomorrow, which part would you miss most?
            </label>
            <textarea id="miss_most" name="miss_most" rows={2} className={inputClass} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="missing" className={label}>
              What&apos;s missing or confusing?
            </label>
            <textarea id="missing" name="missing" rows={3} className={inputClass} />
          </div>
          <fieldset className="flex flex-col gap-2">
            <legend className={label}>Would you pay for Riposte after the beta?</legend>
            <div className="mt-1 flex flex-wrap gap-4 text-sm">
              {[
                ["yes", "Yes"],
                ["maybe", "Maybe"],
                ["no", "No"],
              ].map(([v, t]) => (
                <label key={v} className="flex items-center gap-2">
                  <input type="radio" name="would_pay" value={v} className="accent-[var(--color-accent)]" />
                  {t}
                </label>
              ))}
            </div>
          </fieldset>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="pay_amount" className={label}>
              If yes or maybe: what would feel fair per month?
            </label>
            <input id="pay_amount" name="pay_amount" className={inputClass} placeholder="For example: $29, ₹2,000, depends on seats" />
          </div>
          <div>
            <SubmitButton pendingLabel="Sending…" className={primaryButton}>
              Send feedback
            </SubmitButton>
          </div>
        </form>
      )}
    </div>
  );
}
