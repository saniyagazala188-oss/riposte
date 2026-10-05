import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { SOURCE_LABELS, type SourceType } from "@/lib/discovery/parse";
import { clearHistory, deleteCompetitor, rediscover, removeSource, updateFrequency } from "@/app/app/actions";
import { ConfirmSubmit, SubmitButton } from "@/components/FormButtons";
import { card, eyebrow, secondaryButton } from "@/components/styles";
import { CheckNowButton } from "@/components/CheckNowButton";
import { ChangeList, CHANGE_SELECT, type ChangeRow } from "@/components/ChangeList";
import { SignalBrowser, SIGNAL_SELECT, type SignalRow } from "@/components/SignalList";
import { Empty, LinkTabs, withParams } from "@/components/ui";
import { timeAgo } from "@/lib/time";
import { ContentPanel, type TopicsRow } from "@/components/ContentPanel";
import { loadContent } from "@/lib/content/load";
import { StoryList, STORY_SELECT, type StoryRow } from "@/components/InsightLists";
import { FindStoriesButton } from "@/components/InsightButtons";
import { AddSourceForm } from "./AddSourceForm";

export const maxDuration = 90;

const ORDER: SourceType[] = ["changelog", "blog", "feed", "pricing", "sitemap", "other"];
const HINTS: Partial<Record<SourceType, string>> = {
  changelog: "Catches feature launches and product updates.",
  blog: "Shows what they publish and which topics they're building.",
  feed: "Lists every new post with its date, the most reliable way to catch new content.",
  pricing: "Catches price, plan and limit changes.",
  sitemap: "Lists all their pages, used for content intelligence later.",
};

type Source = {
  id: string;
  type: SourceType;
  url: string;
  discovered: boolean;
  last_checked_at: string | null;
  last_status: string | null;
  last_error: string | null;
  last_changed_at: string | null;
};

const PROBLEM_STATUSES = ["blocked", "not_found", "robots", "empty", "error"];

function SourceStatus({ s }: { s: Source }) {
  if (!s.last_checked_at) return <p className="mt-0.5 text-xs text-muted">Waiting for the first check</p>;
  if (s.last_status && PROBLEM_STATUSES.includes(s.last_status)) {
    return (
      <p className="mt-0.5 text-xs text-signal">
        Couldn&apos;t read this page {timeAgo(s.last_checked_at)}. {s.last_error}
      </p>
    );
  }
  return (
    <p className="mt-0.5 text-xs text-muted">
      Checked {timeAgo(s.last_checked_at)}
      {s.last_changed_at ? ` · last changed ${timeAgo(s.last_changed_at)}` : " · no changes yet"}
    </p>
  );
}

export default async function CompetitorPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ added?: string; tab?: string; s?: string }>;
}) {
  const { id } = await params;
  const { added, tab: tabParam, s: selected } = await searchParams;
  const tab = ["moves", "pages", "content", "settings"].includes(tabParam ?? "") ? (tabParam as string) : "signals";
  const { supabase } = await requireUser();

  const { data: competitor } = await supabase
    .from("competitors")
    .select("id, name, domain, check_frequency, discovery_note")
    .eq("id", id)
    .maybeSingle();
  if (!competitor) notFound();

  const [{ data: sourceRows }, { data: changeRows }, { data: signalRows }, { data: storyRows }] = await Promise.all([
    supabase
      .from("sources")
      .select("id, type, url, discovered, last_checked_at, last_status, last_error, last_changed_at")
      .eq("competitor_id", id),
    supabase
      .from("changes")
      .select(CHANGE_SELECT)
      .eq("competitor_id", id)
      .eq("processed", false)
      .order("detected_at", { ascending: false })
      .limit(15),
    supabase
      .from("signals")
      .select(SIGNAL_SELECT)
      .eq("competitor_id", id)
      .eq("noise", false)
      .order("created_at", { ascending: false })
      .limit(30),
    supabase
      .from("stories")
      .select(STORY_SELECT)
      .eq("competitor_id", id)
      .neq("status", "dismissed")
      .order("created_at", { ascending: false })
      .limit(10),
  ]);
  const changes = (changeRows ?? []) as unknown as ChangeRow[];
  const signals = (signalRows ?? []) as unknown as SignalRow[];
  const stories = (storyRows ?? []) as unknown as StoryRow[];
  const signalTitles = new Map(signals.map((x) => [x.id, x.title]));
  const sources = ((sourceRows ?? []) as Source[]).sort((a, b) => ORDER.indexOf(a.type) - ORDER.indexOf(b.type));
  const foundCount = sources.filter((x) => x.discovered).length;
  const neverChecked = sources.length > 0 && sources.every((x) => !x.last_checked_at);
  const missing = ORDER.filter((t) => t !== "other" && !sources.some((x) => x.type === t));
  const broken = sources.filter((x) => x.last_status && PROBLEM_STATUSES.includes(x.last_status)).length;

  const base = `/app/competitors/${competitor.id}`;
  const tabHref = (t: string) => withParams(base, { tab: t === "signals" ? undefined : t });

  return (
    <div>
      <Link href="/app/competitors" className="text-sm text-muted hover:text-ink">
        ← All competitors
      </Link>
      <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <p className={eyebrow}>Competitor</p>
          <h1 className="mt-1 font-display text-2xl font-bold sm:text-3xl">{competitor.name}</h1>
          <a href={`https://${competitor.domain}`} target="_blank" rel="noopener noreferrer" className="font-mono text-sm text-muted hover:text-ink">
            {competitor.domain} ↗
          </a>
        </div>
        <CheckNowButton competitorId={competitor.id} />
      </div>

      {added && (
        <p className="mt-4 rounded-xl border border-line bg-accent-soft px-4 py-3 text-sm">
          <span className="font-semibold">{competitor.name} added.</span>{" "}
          {foundCount > 0
            ? `Riposte found ${foundCount} ${foundCount === 1 ? "page" : "pages"} on its own and is running the first check now. Check the Pages tab, and add any it missed.`
            : "Add the pages you want watched in the Pages tab."}
        </p>
      )}
      {competitor.discovery_note && <p className="mt-3 text-sm text-signal">{competitor.discovery_note}</p>}

      <LinkTabs
        className="mt-5"
        active={tab}
        tabs={[
          { key: "signals", label: "Signals", count: signals.filter((x) => x.status === "new").length, href: tabHref("signals") },
          { key: "moves", label: "Connected moves", count: stories.length, href: tabHref("moves") },
          { key: "pages", label: "Pages watched", count: sources.length, href: tabHref("pages") },
          { key: "content", label: "Their content", href: tabHref("content") },
          { key: "settings", label: "Settings", href: tabHref("settings") },
        ]}
      />

      <div className="mt-4">
        {tab === "signals" && (
          <div className="flex flex-col gap-4">
            {signals.length > 0 ? (
              <SignalBrowser
                signals={signals}
                selectedId={selected}
                showCompetitor={false}
                hrefFor={(sid) => withParams(base, { s: sid })}
              />
            ) : (
              !changes.length && (
                <Empty title="No signals yet.">
                  {neverChecked
                    ? "The first check saves each page as a starting point. Changes appear here from the next check onwards."
                    : "No changes yet. Every check is compared with the last one, and real changes show up here, explained."}
                </Empty>
              )
            )}
            {changes.length > 0 && (
              <section className={card}>
                <p className="border-b border-line px-5 py-3 text-sm font-semibold">Waiting to be explained ({changes.length})</p>
                <ChangeList changes={changes} />
              </section>
            )}
          </div>
        )}

        {tab === "moves" && (
          <section className={card}>
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-3">
              <p className="text-sm text-muted">Related signals from {competitor.name} joined into one story. Checked automatically after new signals.</p>
              <FindStoriesButton competitorId={competitor.id} />
            </div>
            {stories.length ? (
              <StoryList stories={stories} signalTitles={signalTitles} signalHref={(sid) => withParams(base, { s: sid })} />
            ) : (
              <p className="px-5 py-6 text-sm text-muted">
                {signals.length >= 2 ? "No connected moves found yet." : "Connected moves appear once there are at least 2 signals from this competitor."}
              </p>
            )}
          </section>
        )}

        {tab === "pages" && (
          <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
            <section className={card}>
              <div className="border-b border-line px-5 py-3">
                <h2 className="font-display text-lg font-bold">Pages Riposte watches ({sources.length})</h2>
                {sources.length > 0 && (
                  <p className="mt-0.5 text-sm text-muted">
                    {foundCount} found automatically · {sources.length - foundCount} added by you
                    {broken > 0 && <span className="text-signal"> · {broken} can&apos;t be read</span>}
                  </p>
                )}
              </div>
              {sources.length === 0 ? (
                <p className="px-5 py-6 text-sm text-muted">No pages yet. Add one on the right.</p>
              ) : (
                <ul className="divide-y divide-line">
                  {sources.map((x) => (
                    <li key={x.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold">
                          {SOURCE_LABELS[x.type]}
                          <span className="ml-2 text-xs font-normal text-muted">{x.discovered ? "found automatically" : "added by you"}</span>
                        </p>
                        <a href={x.url} target="_blank" rel="noopener noreferrer" className="block truncate font-mono text-xs text-accent hover:underline">
                          {x.url}
                        </a>
                        <SourceStatus s={x} />
                      </div>
                      <form action={removeSource}>
                        <input type="hidden" name="source_id" value={x.id} />
                        <input type="hidden" name="competitor_id" value={competitor.id} />
                        <SubmitButton pendingLabel="Removing…">Remove</SubmitButton>
                      </form>
                    </li>
                  ))}
                </ul>
              )}
            </section>
            <div className="flex flex-col gap-4">
              <section className={`${card} p-5`}>
                <h2 className="font-display text-lg font-bold">Add a page</h2>
                <div className="mt-3">
                  <AddSourceForm competitorId={competitor.id} />
                </div>
              </section>
              {missing.length > 0 && (
                <section className="rounded-2xl border border-line bg-bg p-5 text-sm">
                  <p className="font-semibold">Not found yet</p>
                  <ul className="mt-2 flex flex-col gap-1.5 text-muted">
                    {missing.map((t) => (
                      <li key={t}>
                        <span className="text-ink">{SOURCE_LABELS[t]}:</span> {HINTS[t]}
                      </li>
                    ))}
                  </ul>
                  <form action={rediscover} className="mt-3">
                    <input type="hidden" name="competitor_id" value={competitor.id} />
                    <SubmitButton pendingLabel="Looking…">Find pages again</SubmitButton>
                  </form>
                </section>
              )}
            </div>
          </div>
        )}

        {tab === "content" && <ContentTab competitorId={competitor.id} />}

        {tab === "settings" && (
          <div className="grid items-start gap-4 lg:grid-cols-2">
            <section className={`${card} p-5`}>
              <h2 className="font-display text-lg font-bold">How often to check</h2>
              <p className="mt-1 text-sm text-muted">
                Riposte checks automatically every morning (around 7am India time). Daily suits close rivals; weekly suits the rest.
              </p>
              <form action={updateFrequency} className="mt-4 flex flex-wrap items-center gap-3">
                <input type="hidden" name="competitor_id" value={competitor.id} />
                <label htmlFor="check_frequency" className="sr-only">
                  Check frequency
                </label>
                <select
                  id="check_frequency"
                  name="check_frequency"
                  defaultValue={competitor.check_frequency}
                  className="rounded-lg border border-line bg-bg px-3 py-2.5 text-base outline-none focus:border-accent"
                >
                  <option value="daily">Every day</option>
                  <option value="weekly">Every week</option>
                </select>
                <SubmitButton pendingLabel="Saving…" className={secondaryButton}>
                  Save
                </SubmitButton>
              </form>
            </section>
            <div className="flex flex-col gap-3">
              <section className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line p-5">
                <div>
                  <h2 className="font-semibold">Clear {competitor.name}&apos;s history</h2>
                  <p className="text-sm text-muted">Deletes its signals, action items and connected moves. Tracking carries on from today.</p>
                </div>
                <form action={clearHistory}>
                  <input type="hidden" name="competitor_id" value={competitor.id} />
                  <ConfirmSubmit label="Clear history" confirmLabel="Yes, clear it" pendingLabel="Clearing…" />
                </form>
              </section>
              <section className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line p-5">
                <div>
                  <h2 className="font-semibold">Stop tracking {competitor.name}</h2>
                  <p className="text-sm text-muted">Removes this competitor and all its pages.</p>
                </div>
                <form action={deleteCompetitor}>
                  <input type="hidden" name="competitor_id" value={competitor.id} />
                  <ConfirmSubmit label="Remove competitor" confirmLabel={`Yes, remove ${competitor.name}`} />
                </form>
              </section>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

async function ContentTab({ competitorId }: { competitorId: string }) {
  const { supabase } = await requireUser();
  const [content, { data: topicsRow }] = await Promise.all([
    loadContent(supabase, [competitorId]).then((m) => m.get(competitorId)!),
    supabase.from("content_topics").select("generated_at, source_count, summary, topics").eq("competitor_id", competitorId).maybeSingle(),
  ]);
  return (
    <section className={`${card} p-5`}>
      <ContentPanel
        competitorId={competitorId}
        feed={content.feed}
        urls={content.urls}
        hasFeed={content.hasFeed}
        hasSitemap={content.hasSitemap}
        feedNote={content.feedNote}
        sitemapNote={content.sitemapNote}
        topics={(topicsRow as TopicsRow) ?? null}
      />
    </section>
  );
}
