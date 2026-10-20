import Link from "next/link";
import { primaryButton } from "@/components/styles";
import { dismissSurvey } from "@/app/app/survey/actions";

// Shown at the top of the app 7 days after someone is approved, until they answer or press "Not now".
export function SurveyCard() {
  return (
    <div className="mb-6 flex flex-col gap-3 rounded-xl border border-accent bg-accent-soft p-4 text-sm sm:flex-row sm:items-center sm:justify-between sm:p-5">
      <div>
        <p className="font-display text-lg font-bold">Got 2 minutes? Help shape Riposte 🙏</p>
        <p className="mt-1 text-muted">6 quick questions about how it&apos;s going. Your answers decide what gets built next.</p>
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <Link href="/app/survey" className={primaryButton}>
          Answer 6 questions
        </Link>
        <form action={dismissSurvey}>
          <button type="submit" className="font-medium text-muted hover:text-ink">
            Not now
          </button>
        </form>
      </div>
    </div>
  );
}
