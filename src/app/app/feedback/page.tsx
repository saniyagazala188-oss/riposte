import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { card, inputClass, primaryButton } from "@/components/styles";
import { PageHeader } from "@/components/ui";
import { SubmitButton } from "@/components/FormButtons";
import { sendFeedback } from "./actions";

export const metadata = { title: "Report a problem · Riposte" };

const label = "text-sm font-semibold";

// Something broken or wrong? Reports land in Admin → Problems.
// (Feedback about the product itself is the 6-question survey at /app/survey.)
export default async function ReportPage({ searchParams }: { searchParams: Promise<{ thanks?: string; error?: string; empty?: string }> }) {
  const params = await searchParams;
  await requireUser();

  return (
    <div>
      <PageHeader
        kicker="Free beta"
        title="Report a problem"
        description="Something broken, wrong or not loading? Tell me what happened and I'll fix it. I read every report."
      />
      {params.thanks ? (
        <div className={`${card} mt-6 max-w-2xl p-6`}>
          <p className="font-display text-xl font-bold">Thanks, got it.</p>
          <p className="mt-2 text-muted">I&apos;ll look into it. If it keeps happening, send another report any time.</p>
        </div>
      ) : (
        <form action={sendFeedback} className={`${card} mt-6 flex max-w-2xl flex-col gap-5 p-6`}>
          {params.error && <p className="text-sm text-danger">Couldn&apos;t send your report. Please try again.</p>}
          {params.empty && <p className="text-sm text-danger">Tell me what went wrong first.</p>}
          <input type="hidden" name="kind" value="problem" />
          <div className="flex flex-col gap-1.5">
            <label htmlFor="missing" className={label}>
              What went wrong?
            </label>
            <textarea
              id="missing"
              name="missing"
              rows={4}
              required
              className={inputClass}
              placeholder="For example: I clicked Build action kit and nothing happened"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="uses_for" className={label}>
              Where did it happen? <span className="font-normal text-muted">(optional)</span>
            </label>
            <input id="uses_for" name="uses_for" className={inputClass} placeholder="For example: the Feed, Comparisons, Slack alerts" />
          </div>
          <div>
            <SubmitButton pendingLabel="Sending…" className={primaryButton}>
              Send report
            </SubmitButton>
          </div>
          <p className="text-sm text-muted">
            Want to share what you think of Riposte instead?{" "}
            <Link href="/app/survey" className="font-semibold text-accent hover:underline">
              Give feedback
            </Link>
            .
          </p>
        </form>
      )}
    </div>
  );
}
