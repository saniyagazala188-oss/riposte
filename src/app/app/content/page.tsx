import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { card, eyebrow } from "@/components/styles";
import { loadContent } from "@/lib/content/load";
import { pageMix, paceFromFeed } from "@/lib/content/stats";
import type { Topic } from "@/lib/content/topics";
import { timeAgo } from "@/lib/time";

export const metadata = { title: "Content · Riposte" };
export const maxDuration = 60;

// Side-by-side view of what every competitor publishes.
export default async function ContentPage() {
  const { supabase } = await requireUser();
  const [{ data: competitors }, { data: topicRows }] = await Promise.all([
    supabase.from("competitors").select("id, name, domain").order("name"),
    supabase.from("content_topics").select("competitor_id, topics, generated_at"),
  ]);
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
      return {
        ...c,
        data,
        pace,
        mix,
        compare: mix.groups.find((g) => g.key === "compare")?.count ?? 0,
        topics: (topicsOf.get(c.id) ?? []).slice(0, 3),
      };
    })
    .sort((a, b) => b.pace.last90 - a.pace.last90 || b.mix.total - a.mix.total);

  return (
    <div>
      <p className={eyebrow}>Content intelligence</p>
      <h1 className="mt-1 font-display text-3xl font-bold">What your competitors publish</h1>
      <p className="mt-2 max-w-2xl text-muted">
        How often each competitor publishes, what kind of pages they have, and which topics they keep writing about.
        Worked out from the blog feeds and sitemaps Riposte reads every morning.
      </p>

      {rows.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-line bg-surface p-8 text-center">
          <p className="font-semibold">No competitors yet.</p>
          <p className="mt-1 text-sm text-muted">
            <Link href="/app/competitors" className="text-accent hover:underline">Add a competitor</Link> to see what they publish.
          </p>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {rows.map((r) => (
            <section key={r.id} className={`${card} flex flex-col p-5`}>
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="font-display text-xl font-bold">{r.name}</h2>
                <span className="font-mono text-xs text-muted">{r.domain}</span>
              </div>
              <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
                <div className="rounded-lg bg-bg p-2">
                  <dt className="text-xs text-muted">Posts, 90 days</dt>
                  <dd className="font-display text-xl font-bold">{r.data.hasFeed ? r.pace.last90 : "–"}</dd>
                </div>
                <div className="rounded-lg bg-bg p-2">
                  <dt className="text-xs text-muted">Pages</dt>
                  <dd className="font-display text-xl font-bold">{r.data.hasSitemap ? r.mix.total : "–"}</dd>
                </div>
                <div className="rounded-lg bg-bg p-2">
                  <dt className="text-xs text-muted">Comparison pages</dt>
                  <dd className="font-display text-xl font-bold">{r.data.hasSitemap ? r.compare : "–"}</dd>
                </div>
              </dl>
              <p className="mt-3 text-sm text-muted">
                {r.pace.newest ? `Last post ${timeAgo(r.pace.newest)}.` : r.data.hasFeed ? "No dated posts in their feed." : "No blog feed, so publishing pace is unknown."}
              </p>
              <div className="mt-3 flex-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted">Top topics</p>
                {r.topics.length ? (
                  <ul className="mt-2 flex flex-wrap gap-2">
                    {r.topics.map((t) => (
                      <li key={t.name} className="rounded-full bg-accent-soft px-3 py-1 text-sm">
                        {t.name}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-1 text-sm text-muted">Not analysed yet.</p>
                )}
              </div>
              <Link href={`/app/competitors/${r.id}#content`} className="mt-4 text-sm font-semibold text-accent hover:underline">
                See {r.name}&apos;s content →
              </Link>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
