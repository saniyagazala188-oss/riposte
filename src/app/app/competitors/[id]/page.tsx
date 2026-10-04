import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { SOURCE_LABELS, type SourceType } from "@/lib/discovery/parse";
import { deleteCompetitor, rediscover, removeSource, updateFrequency } from "@/app/app/actions";
import { ConfirmSubmit, SubmitButton } from "@/components/FormButtons";
import { card, eyebrow, secondaryButton } from "@/components/styles";
import { CheckNowButton } from "@/components/CheckNowButton";
import { ChangeList, CHANGE_SELECT, type ChangeRow } from "@/components/ChangeList";
import { SignalList, SIGNAL_SELECT, type SignalRow } from "@/components/SignalList";
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
  searchParams: Promise<{ added?: string }>;
}) {
  const { id } = await params;
  const { added } = await searchParams;
  const { supabase } = await requireUser();

  const { data: competitor } = await supabase
    .from("competitors")
    .select("id, name, domain, check_frequency, discovery_note")
    .eq("id", id)
    .maybeSingle();
  if (!competitor) notFound();

  const { data: sourceRows } = await supabase
    .from("sources")
    .select("id, type, url, discovered, last_checked_at, last_status, last_error, last_changed_at")
    .eq("competitor_id", id);
  const [{ data: changeRows }, { data: signalRows }] = await Promise.all([
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
      .limit(15),
  ]);
  const changes = (changeRows ?? []) as unknown as ChangeRow[];
  const [content, { data: topicsRow }] = await Promise.all([
    loadContent(supabase, [id]).then((m) => m.get(id)!),
    supabase.from("content_topics").select("generated_at, source_count, summary, topics").eq("competitor_id", id).maybeSingle(),
  ]);
  const signals = (signalRows ?? []) as unknown as SignalRow[];
  const { data: storyRows } = await supabase
    .from("stories")
    .select(STORY_SELECT)
    .eq("competitor_id", id)
    .neq("status", "dismissed")
    .order("created_at", { ascending: false })
    .limit(10);
  const stories = (storyRows ?? []) as unknown as StoryRow[];
  const signalTitles = new Map(signals.map((s) => [s.id, s.title]));
  const sources = ((sourceRows ?? []) as Source[]).sort((a, b) => ORDER.indexOf(a.type) - ORDER.indexOf(b.type));
  const foundCount = sources.filter((s) => s.discovered).length;
  const neverChecked = sources.length > 0 && sources.every((s) => !s.last_checked_at);
  const missing = ORDER.filter((t) => t !== "other" && !sources.some((s) => s.type === t));

  return (
    <div>
      <Link href="/app/competitors" className="text-sm text-muted hover:text-ink">
        ← All competitors
      </Link>
      <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <p className={eyebrow}>Competitor</p>
          <h1 className="mt-1 font-display text-3xl font-bold">{competitor.name}</h1>
          <a href={`https://${competitor.domain}`} target="_blank" rel="noopener noreferrer" className="font-mono text-sm text-muted hover:text-ink">
            {competitor.domain} ↗
          </a>
        </div>
        <div className="flex flex-wrap items-start gap-3">
          <form action={rediscover}>
            <input type="hidden" name="competitor_id" value={competitor.id} />
            <SubmitButton pendingLabel="Looking…">Find pages again</SubmitButton>
          </form>
          <CheckNowButton competitorId={competitor.id} />
        </div>
      </div>

      {added && (
        <p className="mt-5 rounded-xl border border-line bg-accent-soft px-4 py-3 text-sm">
          <span className="font-semibold">{competitor.name} added.</span>{" "}
          {foundCount > 0
            ? `Riposte found ${foundCount} ${foundCount === 1 ? "page" : "pages"} on its own and is running the first check now. Check the list below, and add any it missed.`
            : "Add the pages you want watched below."}
        </p>
      )}
      {competitor.discovery_note && <p className="mt-3 text-sm text-signal">{competitor.discovery_note}</p>}

      <section className={`${card} mt-6`}>
        <div className="border-b border-line px-5 py-4">
          <h2 className="font-display text-xl font-bold">Pages Riposte watches ({sources.length})</h2>
          {sources.length > 0 && (
            <p className="mt-0.5 text-sm text-muted">
              {foundCount} found automatically · {sources.length - foundCount} added by you
            </p>
          )}
        </div>
        {sources.length === 0 ? (
          <p className="px-5 py-6 text-sm text-muted">No pages yet. Add one below.</p>
        ) : (
          <ul className="divide-y divide-line">
            {sources.map((s) => (
              <li key={s.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">{SOURCE_LABELS[s.type]}</p>
                  <a href={s.url} target="_blank" rel="noopener noreferrer" className="block truncate font-mono text-sm text-accent hover:underline">
                    {s.url}
                  </a>
                  <p className="mt-0.5 text-xs text-muted">{s.discovered ? "Found automatically" : "Added by you"}</p>
                  <SourceStatus s={s} />
                </div>
                <form action={removeSource}>
                  <input type="hidden" name="source_id" value={s.id} />
                  <input type="hidden" name="competitor_id" value={competitor.id} />
                  <SubmitButton pendingLabel="Removing…">Remove</SubmitButton>
                </form>
              </li>
            ))}
          </ul>
        )}

        {missing.length > 0 && (
          <div className="border-t border-line bg-bg px-5 py-4 text-sm">
            <p className="font-semibold">Not found yet</p>
            <ul className="mt-2 flex flex-col gap-1 text-muted">
              {missing.map((t) => (
                <li key={t}>
                  <span className="text-ink">{SOURCE_LABELS[t]}:</span> {HINTS[t]}
                </li>
              ))}
            </ul>
            <p className="mt-2 text-muted">If they have one, add it below.</p>
          </div>
        )}

        <div className="border-t border-line px-5 py-5">
          <AddSourceForm competitorId={competitor.id} />
        </div>
      </section>

      <section className={`${card} mt-6`}>
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line px-5 py-4">
          <div className="min-w-0">
            <h2 className="font-display text-xl font-bold">Connected moves</h2>
            <p className="mt-0.5 text-sm text-muted">
              Related signals from {competitor.name} joined into one story. Checked automatically after new signals.
            </p>
          </div>
          <FindStoriesButton competitorId={competitor.id} />
        </div>
        {stories.length ? (
          <StoryList stories={stories} signalTitles={signalTitles} />
        ) : (
          <p className="px-5 py-6 text-sm text-muted">
            {signals.length >= 2
              ? "No connected moves found yet."
              : "Connected moves appear once there are at least 2 signals from this competitor."}
          </p>
        )}
      </section>

      <section className={`${card} mt-6`}>
        <div className="border-b border-line px-5 py-4">
          <h2 className="font-display text-xl font-bold">Recent signals</h2>
          <p className="mt-0.5 text-sm text-muted">
            Real changes only (dates, view counts, cookie banners and menus are ignored), each explained for your product.
          </p>
        </div>
        {signals.length > 0 && <SignalList signals={signals} />}
        {changes.length > 0 && (
          <div className={signals.length ? "border-t border-line" : ""}>
            <p className="px-5 pt-4 text-sm font-semibold">Waiting to be explained</p>
            <ChangeList changes={changes} />
          </div>
        )}
        {!signals.length && !changes.length && (
          <p className="px-5 py-6 text-sm text-muted">
            {neverChecked
              ? "The first check saves each page as a starting point. Changes appear here from the next check onwards."
              : "No changes yet. The first check saves each page as a starting point, and every later check is compared with it."}
          </p>
        )}
      </section>

      <section id="content" className={`${card} mt-6 scroll-mt-6`}>
        <div className="border-b border-line px-5 py-4">
          <h2 className="font-display text-xl font-bold">Their content</h2>
          <p className="mt-0.5 text-sm text-muted">How often they publish, what kind of pages they have, and the topics they build.</p>
        </div>
        <div className="p-5">
          <ContentPanel
            competitorId={competitor.id}
            feed={content.feed}
            urls={content.urls}
            hasFeed={content.hasFeed}
            hasSitemap={content.hasSitemap}
            feedNote={content.feedNote}
            sitemapNote={content.sitemapNote}
            topics={(topicsRow as TopicsRow) ?? null}
          />
        </div>
      </section>

      <section className={`${card} mt-6 p-5`}>
        <h2 className="font-display text-xl font-bold">How often to check</h2>
        <p className="mt-1 text-sm text-muted">
          Riposte checks automatically every morning (around 7am India time). Daily suits close rivals; weekly suits the
          rest.
        </p>
        <form action={updateFrequency} className="mt-4 flex flex-wrap items-center gap-3">
          <input type="hidden" name="competitor_id" value={competitor.id} />
          <label htmlFor="check_frequency" className="sr-only">
            Check frequency
          </label>
          <select id="check_frequency" name="check_frequency" defaultValue={competitor.check_frequency} className="rounded-lg border border-line bg-bg px-3 py-2.5 text-base outline-none focus:border-accent">
            <option value="daily">Every day</option>
            <option value="weekly">Every week</option>
          </select>
          <SubmitButton pendingLabel="Saving…" className={secondaryButton}>
            Save
          </SubmitButton>
        </form>
      </section>

      <section className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line p-5">
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
  );
}
