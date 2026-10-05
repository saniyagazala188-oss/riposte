import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { card } from "@/components/styles";
import { timeAgo } from "@/lib/time";
import { Empty, PageHeader, Pager, pageNum, withParams } from "@/components/ui";
import { SearchBox } from "@/components/ui-client";
import { AddCompetitorForm } from "./AddCompetitorForm";

export const metadata = { title: "Competitors · Riposte" };
export const maxDuration = 30;

const PER_PAGE = 10;
const PROBLEMS = ["blocked", "not_found", "robots", "empty", "error"];

type Competitor = { id: string; name: string; domain: string; check_frequency: string; sources: { count: number }[] };

export default async function CompetitorsPage({ searchParams }: { searchParams: Promise<{ q?: string; page?: string }> }) {
  const params = await searchParams;
  const q = (params.q ?? "").trim().toLowerCase();
  const { supabase } = await requireUser();
  const [{ data: competitors }, { data: sourceRows }, { data: newSignals }] = await Promise.all([
    supabase.from("competitors").select("id, name, domain, check_frequency, sources(count)").order("created_at", { ascending: true }).limit(500),
    supabase.from("sources").select("competitor_id, last_checked_at, last_status").limit(5000),
    supabase.from("signals").select("competitor_id").eq("status", "new").eq("noise", false).limit(5000),
  ]);

  const all = (competitors ?? []) as Competitor[];
  const lastChecked = new Map<string, string>();
  const problems = new Map<string, number>();
  for (const s of sourceRows ?? []) {
    if (s.last_checked_at && (!lastChecked.get(s.competitor_id) || s.last_checked_at > lastChecked.get(s.competitor_id)!))
      lastChecked.set(s.competitor_id, s.last_checked_at);
    if (PROBLEMS.includes(s.last_status ?? "")) problems.set(s.competitor_id, (problems.get(s.competitor_id) ?? 0) + 1);
  }
  const toReview = new Map<string, number>();
  for (const s of newSignals ?? []) toReview.set(s.competitor_id, (toReview.get(s.competitor_id) ?? 0) + 1);

  const filtered = q ? all.filter((c) => c.name.toLowerCase().includes(q) || c.domain.includes(q)) : all;
  const pages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const page = Math.min(pageNum(params.page), pages);
  const shown = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  return (
    <div>
      <PageHeader
        kicker="Competitors"
        title="Who you're watching"
        description="Add a competitor by its website. Riposte finds their release notes, blog, blog feed and pricing page for you."
      />

      <div className={`${card} mt-5 p-4 sm:p-5`}>
        <AddCompetitorForm />
      </div>

      {all.length === 0 ? (
        <div className="mt-6">
          <Empty title="No competitors yet.">Add your first one above, for example the company you lose the most deals to.</Empty>
        </div>
      ) : (
        <section className={`${card} mt-5 overflow-hidden`}>
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3">
            <h2 className="font-display text-lg font-bold">
              {all.length} {all.length === 1 ? "competitor" : "competitors"}
            </h2>
            <div className="w-full sm:w-72">
              <SearchBox placeholder="Search by name or website" />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs uppercase tracking-wider text-muted">
                  <th className="px-4 py-2.5 font-semibold">Competitor</th>
                  <th className="px-4 py-2.5 font-semibold">To review</th>
                  <th className="px-4 py-2.5 font-semibold">Pages watched</th>
                  <th className="px-4 py-2.5 font-semibold">Last checked</th>
                  <th className="px-4 py-2.5 font-semibold">Checks</th>
                  <th className="px-4 py-2.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {shown.map((c) => {
                  const count = c.sources?.[0]?.count ?? 0;
                  const review = toReview.get(c.id) ?? 0;
                  const bad = problems.get(c.id) ?? 0;
                  return (
                    <tr key={c.id} className="hover:bg-bg">
                      <td className="px-4 py-3">
                        <Link href={`/app/competitors/${c.id}`} className="font-semibold hover:underline">
                          {c.name}
                        </Link>
                        <p className="font-mono text-xs text-muted">{c.domain}</p>
                      </td>
                      <td className="px-4 py-3">
                        {review ? (
                          <Link href={withParams("/app", { c: c.id })} className="rounded-full bg-signal-soft px-2 py-0.5 text-xs font-semibold text-signal">
                            {review} new
                          </Link>
                        ) : (
                          <span className="text-muted">–</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {count}
                        {bad > 0 && <span className="ml-2 text-xs text-signal">{bad} can&apos;t be read</span>}
                      </td>
                      <td className="px-4 py-3 text-muted">{timeAgo(lastChecked.get(c.id))}</td>
                      <td className="px-4 py-3">
                        <span className="rounded-full border border-line px-2 py-0.5 text-xs">{c.check_frequency}</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link href={`/app/competitors/${c.id}`} className="text-sm font-semibold text-accent hover:underline">
                          Open →
                        </Link>
                      </td>
                    </tr>
                  );
                })}
                {!shown.length && (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-center text-muted">
                      No competitor matches &quot;{params.q}&quot;.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {filtered.length > PER_PAGE && (
            <div className="border-t border-line px-4 py-3">
              <Pager page={page} perPage={PER_PAGE} total={filtered.length} href={(n) => withParams("/app/competitors", { q: params.q, page: n > 1 ? n : undefined })} />
            </div>
          )}
        </section>
      )}
    </div>
  );
}
