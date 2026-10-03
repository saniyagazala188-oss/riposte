import { pageMix, paceFromFeed, type FeedItem } from "@/lib/content/stats";
import type { Topic } from "@/lib/content/topics";
import { TopicsButton } from "@/components/TopicsButton";
import { timeAgo } from "@/lib/time";

export type TopicsRow = { generated_at: string; source_count: number; summary: string; topics: Topic[] } | null;

function Stat({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="min-w-0 rounded-xl bg-bg p-3">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted">{label}</p>
      <p className="mt-1 font-display text-2xl font-bold">{value}</p>
      {hint && <p className="text-xs text-muted">{hint}</p>}
    </div>
  );
}

// What a competitor publishes: pace, page mix, latest posts and topics.
export function ContentPanel({
  competitorId,
  feed,
  urls,
  hasFeed,
  hasSitemap,
  sitemapNote = "No sitemap",
  feedNote = "No blog feed",
  topics,
}: {
  sitemapNote?: string | null;
  feedNote?: string | null;
  competitorId: string;
  feed: FeedItem[];
  urls: string[];
  hasFeed: boolean;
  hasSitemap: boolean;
  topics: TopicsRow;
}) {
  const pace = paceFromFeed(feed);
  const mix = pageMix(urls);
  const compare = mix.groups.find((g) => g.key === "compare")?.count ?? 0;

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Posts, last 30 days" value={hasFeed ? pace.last30 : "–"} hint={hasFeed ? `${pace.last90} in 90 days` : feedNote ?? "No blog feed"} />
        <Stat label="Last post" value={pace.newest ? timeAgo(pace.newest) : "–"} hint={hasFeed ? undefined : feedNote ?? "No blog feed"} />
        <Stat label="Pages on their site" value={hasSitemap ? mix.total : "–"} hint={hasSitemap ? "from their sitemap" : sitemapNote ?? "No sitemap"} />
        <Stat label="Comparison pages" value={hasSitemap ? compare : "–"} hint={hasSitemap ? "vs, alternatives, compare" : sitemapNote ?? "No sitemap"} />
      </div>

      {hasFeed && pace.dated > 0 && (
        <div>
          <p className="text-sm font-semibold">Posts per month</p>
          <ul className="mt-2 grid grid-cols-6 gap-2 text-center text-sm">
            {pace.perMonth.map((m) => (
              <li key={m.month} className="rounded-lg border border-line py-2">
                <p className="font-display text-lg font-bold">{m.count}</p>
                <p className="text-xs text-muted">{m.month}</p>
              </li>
            ))}
          </ul>
          <p className="mt-1 text-xs text-muted">Counted from the posts in their blog feed, which usually lists the most recent 10–50.</p>
        </div>
      )}

      <div className="grid gap-5 md:grid-cols-2">
        {hasFeed && pace.latest.length > 0 && (
          <div className="min-w-0">
            <p className="text-sm font-semibold">Latest posts</p>
            <ul className="mt-2 flex flex-col gap-1.5 text-sm">
              {pace.latest.map((p) => (
                <li key={p.link || p.title} className="min-w-0">
                  <a href={p.link} target="_blank" rel="noopener noreferrer" className="break-words text-accent hover:underline">
                    {p.title}
                  </a>
                  <span className="ml-2 font-mono text-xs text-muted">{timeAgo(p.date)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        {hasSitemap && mix.groups.length > 0 && (
          <div className="min-w-0">
            <p className="text-sm font-semibold">What kind of pages they have</p>
            <ul className="mt-2 flex flex-col divide-y divide-line text-sm">
              {mix.groups.map((g) => (
                <li key={g.key} className="flex items-baseline justify-between gap-3 py-1.5">
                  <span>{g.label}</span>
                  <span className="font-mono text-muted">{g.count}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="rounded-xl border border-line p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-semibold">Topics they&apos;re building</p>
            <p className="text-sm text-muted">
              {topics
                ? `From ${topics.source_count} titles · updated ${timeAgo(topics.generated_at)}`
                : "AI groups their posts and blog pages into the topics they keep writing about."}
            </p>
          </div>
          {(hasFeed || hasSitemap) && <TopicsButton competitorId={competitorId} refresh={Boolean(topics)} />}
        </div>
        {topics && (
          <>
            {topics.summary && <p className="mt-3 text-sm">{topics.summary}</p>}
            <ul className="mt-3 flex flex-col gap-3">
              {topics.topics.map((t) => (
                <li key={t.name} className="min-w-0">
                  <div className="flex items-baseline justify-between gap-3 text-sm">
                    <span className="font-semibold">{t.name}</span>
                    <span className="font-mono text-xs text-muted">
                      {t.count} titles · {t.share}%
                    </span>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-bg" aria-hidden>
                    <div className="h-full rounded-full bg-accent" style={{ width: `${Math.max(3, t.share)}%` }} />
                  </div>
                  {t.summary && <p className="mt-1 text-sm text-muted">{t.summary}</p>}
                  {t.examples.length > 0 && (
                    <p className="mt-0.5 text-xs text-muted">e.g. {t.examples.map((e) => `“${e}”`).join(", ")}</p>
                  )}
                </li>
              ))}
            </ul>
            {(() => {
              const rest = topics.source_count - topics.topics.reduce((n, t) => n + t.count, 0);
              return rest > 0 ? (
                <p className="mt-3 text-xs text-muted">
                  {rest} of {topics.source_count} titles didn&apos;t fit one of these main topics.
                </p>
              ) : null;
            })()}
          </>
        )}
        {!hasFeed && !hasSitemap && (
          <p className="mt-3 text-sm text-muted">
            Add their blog feed or sitemap on the competitor page so Riposte can see what they publish.
          </p>
        )}
      </div>
    </div>
  );
}
