import { requireUser } from "@/lib/auth";
import { mockEnabled } from "@/lib/supabase/mock";
import { card } from "@/components/styles";
import { PageHeader } from "@/components/ui";
import { ReportForm } from "./ReportForm";

export const metadata = { title: "Report a problem · Riposte" };

// Something broken or wrong? Reports land in Admin → Problems, and the admin gets an email.
// (What people think of Riposte is the 6-question survey at /app/survey.)
export default async function ReportPage({ searchParams }: { searchParams: Promise<{ thanks?: string; error?: string; empty?: string }> }) {
  const params = await searchParams;
  const { user } = await requireUser();

  return (
    <div>
      <PageHeader
        kicker="Free beta"
        title="Report a problem"
        description="Something broken, wrong or not loading? Tell me what happened, add a screenshot if you can, and I'll fix it. I read every report."
      />
      <div className={`${card} mt-6 max-w-2xl p-6`}>
        {params.thanks ? (
          <>
            <p className="font-display text-xl font-bold">Thanks, got it.</p>
            <p className="mt-2 text-muted">I&apos;ll look into it. If it keeps happening, send another report any time.</p>
          </>
        ) : (
          <ReportForm userId={user.id} direct={mockEnabled()} error={Boolean(params.error)} empty={Boolean(params.empty)} />
        )}
      </div>
    </div>
  );
}
