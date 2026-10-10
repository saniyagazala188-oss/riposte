import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { card } from "@/components/styles";
import { loadContent } from "@/lib/content/load";
import { pageMix, paceFromFeed } from "@/lib/content/stats";
import type { Topic } from "@/lib/content/topics";
import { timeAgo } from "@/lib/time";
import { TrendList, TREND_SELECT, type TrendRow } from "@/components/InsightLists";
import { FindTrendsButton } from "@/components/InsightButtons";
import { Empty, PageHeader, Pager, PanelHead, pageNum, withParams } from "@/components/ui";

export const metadata = { title: "Content · Riposte" };
export const maxDuration = 90;

const PER_PAGE = 10;

// What every competitor publishes: a stats table first, then trends and the latest posts side by side.
export default async function ContentPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const params = await searchParams;
  const { supabase } = await requireUser();
  const [{ data: competitors }, { data: topicRows }, { data: trendRows }] = await Promise.all([
    supabase.from("competitors").select("id, name, domain").order("name"),
    supabase.from("content_topics").select("competitor_id, topics, generated_at"),
    supabase.from("trends").select(TREND_SELECT).neq("status", "dismissed").order("created_at", { ascending: false }).limit(8),
  ]);
  const { data: briefRows } = await supabase
    .from("content_briefs")
    .select("id, created_at, source, topic, content, status")
    .order("created_at", { ascending: false })
    .limit(30);
  const briefs = (briefRows ?? []) as { id: string; created_at: string; source: string; topic: string; content: { title: string; target_keyword: string }; status: string }[];
  const trends = (trendRows ?? []) as unknown as TrendRow[];
  const list = competitors ?? [];
  const content = await loadContent(
    supabase,
    list.map((c) => c.id),
  );
  const topicsOf = new Map((topicRows ?? []).map((t) => [t.competitor_id as string, t.topics as Topic[]]));

  const rows = list
    .map((c) => {
      const data = content.get(c.id)!;
      const pace = paceFromFeed(data.feed);
      const mix = pageMix(data.urls);
      const count = (k: string) => mix.groups.find((g) => g.key === k)?.count ?? 0;
      return { ...c, data, pace, mix, compare: count("compare"), answers: count("answers"), topic: topicsOf.get(c.id)?.[0]?.name };
    })
    .sort((a, b) => b.pace.last90 - a.pace.last90 || b.mix.total - a.mix.total);

  const pages = Math.max(1, Math.ceil(rows.length / PER_PAGE));
  const page = Math.min(pageNum(params.page), pages);
  const shown = rows.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  // Newest posts across every competitor.
  const latest = rows
    .flatMap((r) => r.pace.latest.map((p) => ({ ...p, competitor: r.name, competitorId: r.id })))
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .slice(0, 25);

  const dash = <span className="text-muted">–</span>;

  return (
    <div>
      <PageHeader
        kicker="Content intelligence"
        title="What your competitors publish"
        description="Publishing pace, page types and topics for every competitor, from the blog feeds and sitemaps Riposte reads every morning."
      />

      {rows.length === 0 ? (
        <div className="mt-6">
          <Empty title="No competitors yet.">
            <Link href="/app/competitors" className="text-accent hover:underline">
              Add a competitor
            </Link>{" "}
            to see what they publish.
          </Empty>
        </div>
      ) : (
        <>
          <section className={`${card} mt-5 overflow-hidden`}>
            <PanelHead title="At a glance" description="Most active publishers first. Click a competitor for its full content report." />
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-sm">
                <thead>
                  <tr className="border-b border-line text-left text-xs uppercase tracking-wider text-muted">
                    <th className="px-4 py-2.5 font-semibold">Competitor</th>
                    <th className="px-3 py-2.5 text-right font-semibold">Posts · 30d</th>
                    <th className="px-3 py-2.5 text-right font-semibold">Posts · 90d</th>
                    <th className="px-3 py-2.5 font-semibold">Last post</th>
                    <th className="px-3 py-2.5 text-right font-semibold">Pages</th>
                    <th className="px-3 py-2.5 text-right font-semibold">Comparison</th>
                    <th className="px-3 py-2.5 text-right font-semibold">AI answer</th>
                    <th className="px-4 py-2.5 font-semibold">Top topic</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {shown.map((r) => (
                    <tr key={r.id} className="hover:bg-bg">
                      <td className="px-4 py-2.5">
                        <Link href={`/app/competitors/${r.id}?tab=content`} className="font-semibold hover:underline">
                          {r.name}
                        </Link>
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono">{r.data.hasFeed ? r.pace.last30 : dash}</td>
                      <td className="px-3 py-2.5 text-right font-mono">{r.data.hasFeed ? r.pace.last90 : dash}</td>
                      <td className="px-3 py-2.5 text-muted">
                        {r.pace.newest ? timeAgo(r.pace.newest) : <span title={r.data.feedNote ?? "No blog feed"}>{r.data.feedNote ?? "No feed"}</span>}
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono">{r.data.hasSitemap ? r.mix.total : dash}</td>
                      <td className="px-3 py-2.5 text-right font-mono">{r.data.hasSitemap ? r.compare : dash}</td>
                      <td className="px-3 py-2.5 text-right font-mono">{r.data.hasSitemap ? r.answers : dash}</td>
                      <td className="px-4 py-2.5">
                        {r.topic ? (
                          <span className="rounded-full bg-accent-soft px-2 py-0.5 text-xs">{r.topic}</span>
                        ) : (
                          <Link href={`/app/competitors/${r.id}?tab=content`} className="text-xs text-muted hover:text-ink">
                            Not analysed
                          </Link>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {rows.length > PER_PAGE && (
              <div className="border-t border-line px-4 py-3">
                <Pager page={page} perPage={PER_PAGE} total={rows.length} href={(n) => withParams("/app/content", { page: n > 1 ? n : undefined })} />
              </div>
            )}
          </section>

          <div className="mt-5 grid items-start gap-5 lg:grid-cols-2">
            <section className={`${card} overflow-hidden`}>
              <PanelHead
                title="Trending across competitors"
                description="Topics two or more competitors published about in the last 45 days. Refreshed every Monday."
                actions={<FindTrendsButton />}
              />
              <div className="max-h-[640px] overflow-y-auto">
                {trends.length ? (
                  <TrendList trends={trends} withBrief />
                ) : (
                  <p className="px-5 py-6 text-sm text-muted">No trends yet. Click “Find trends” to compare what your competitors publish.</p>
                )}
              </div>
            </section>

            <section className={`${card} overflow-hidden`}>
              <PanelHead title="Recently published" description="The newest posts from every competitor's blog feed." />
              <ul className="max-h-[640px] divide-y divide-line overflow-y-auto">
                {latest.map((p) => (
                  <li key={`${p.competitorId}-${p.link || p.title}`} className="px-5 py-2.5 text-sm">
                    <a href={p.link} target="_blank" rel="noopener noreferrer" className="font-medium hover:text-accent hover:underline">
                      {p.title}
                    </a>
                    <p className="mt-0.5 text-xs text-muted">
                      <Link href={`/app/competitors/${p.competitorId}?tab=content`} className="font-semibold text-ink hover:underline">
                        {p.competitor}
                      </Link>{" "}
                      · {timeAgo(p.date)}
                    </p>
                  </li>
                ))}
                {!latest.length && <li className="px-5 py-6 text-sm text-muted">No dated posts yet. Riposte reads blog feeds every morning.</li>}
              </ul>
            </section>
          </div>

          <section className={`${card} mt-5 overflow-hidden`}>
            <PanelHead
              title="Content briefs"
              description="Ready-to-write briefs from trends and from AI answers where competitors are named and you aren't."
            />
            {briefs.length ? (
              <ul className="divide-y divide-line">
                {briefs.map((b) => (
                  <li key={b.id}>
                    <Link href={`/app/content/briefs/${b.id}`} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-5 py-3 hover:bg-bg">
                      <span className="min-w-0 flex-1">
                        <span className="block font-semibold leading-snug">{b.content.title}</span>
                        <span className="block text-xs text-muted">
                          {b.source === "trend" ? "From a trend" : "To win an AI answer"} · keyword: {b.content.target_keyword}
                        </span>
                      </span>
                      <span className="rounded-full bg-bg px-2 py-0.5 text-xs capitalize">{b.status}</span>
                      <span className="font-mono text-xs text-muted">{timeAgo(b.created_at)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="px-5 py-6 text-sm text-muted">
                No briefs yet. Click &quot;Write a content brief&quot; on a trend above, or on a gap in AI visibility.
              </p>
            )}
          </section>
        </>
      )}
    </div>
  );
}
