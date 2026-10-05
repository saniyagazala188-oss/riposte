import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { card, eyebrow, primaryButton } from "@/components/styles";
import { ChangeList, CHANGE_SELECT, type ChangeRow } from "@/components/ChangeList";
import { SignalList, SIGNAL_SELECT, type SignalRow } from "@/components/SignalList";
import { ExplainPendingButton } from "@/components/ActionButtons";
import { StoryList, STORY_SELECT, type StoryRow } from "@/components/InsightLists";
import { loadComparisons } from "@/lib/compare/stale";

export const metadata = { title: "Feed · Riposte" };
export const maxDuration = 90;

const FILTERS = [
  { key: "new", label: "To review" },
  { key: "all", label: "All" },
  { key: "noise", label: "Noise" },
] as const;

// The signed-in home: setup progress, then the signal feed.
export default async function AppHome({ searchParams }: { searchParams: Promise<{ show?: string }> }) {
  const { show: showParam } = await searchParams;
  const show = FILTERS.some((f) => f.key === showParam) ? (showParam as (typeof FILTERS)[number]["key"]) : "new";
  const { supabase, user } = await requireUser();

  let signalQuery = supabase.from("signals").select(SIGNAL_SELECT).order("created_at", { ascending: false }).limit(40);
  if (show === "new") signalQuery = signalQuery.eq("status", "new").eq("noise", false);
  if (show === "all") signalQuery = signalQuery.eq("noise", false);
  if (show === "noise") signalQuery = signalQuery.eq("noise", true);

  const [
    { data: profile },
    { count: competitorCount },
    { count: sourceCount },
    { count: checkedCount },
    { data: pendingRows },
    { data: signalRows },
    { count: signalTotal },
    { count: toReview },
  ] = await Promise.all([
    supabase.from("profiles").select("product_name").eq("id", user.id).maybeSingle(),
    supabase.from("competitors").select("id", { count: "exact", head: true }),
    supabase.from("sources").select("id", { count: "exact", head: true }),
    supabase.from("sources").select("id", { count: "exact", head: true }).not("last_checked_at", "is", null),
    supabase.from("changes").select(CHANGE_SELECT).eq("processed", false).order("detected_at", { ascending: false }).limit(20),
    signalQuery,
    supabase.from("signals").select("id", { count: "exact", head: true }),
    supabase.from("signals").select("id", { count: "exact", head: true }).eq("status", "new").eq("noise", false),
  ]);
  const pending = (pendingRows ?? []) as unknown as ChangeRow[];
  const { data: storyRows } = await supabase
    .from("stories")
    .select(STORY_SELECT)
    .eq("status", "new")
    .order("created_at", { ascending: false })
    .limit(10);
  const stories = (storyRows ?? []) as unknown as StoryRow[];
  const linkedIds = [...new Set(stories.flatMap((s) => s.signal_ids))];
  const { data: linkedRows } = linkedIds.length
    ? await supabase.from("signals").select("id, title").in("id", linkedIds)
    : { data: [] as { id: string; title: string }[] };
  const signalTitles = new Map((linkedRows ?? []).map((r) => [r.id as string, r.title as string]));
  const signals = (signalRows ?? []) as unknown as SignalRow[];

  const steps = [
    {
      done: Boolean(profile?.product_name),
      title: "Tell Riposte about your product",
      body: "Your product, what it does and who you sell to. Every signal is judged against this.",
      href: "/app/product",
      cta: "Add your product",
    },
    {
      done: (competitorCount ?? 0) > 0,
      title: "Add your competitors",
      body: "Type their website. Riposte finds their release notes, blog, feed and pricing page.",
      href: "/app/competitors",
      cta: "Add competitors",
    },
    {
      done: (checkedCount ?? 0) > 0,
      title: "First check",
      body: "Riposte reads every page once and saves it as a starting point. After that, it checks every morning.",
      href: null,
      cta: null,
    },
  ];
  const next = steps.find((s) => !s.done && s.href);
  const { stale } = await loadComparisons(supabase);

  return (
    <div>
      <p className={eyebrow}>Your workspace</p>
      <h1 className="mt-1 font-display text-3xl font-bold">
        {profile?.product_name ? `${profile.product_name}'s feed` : "Welcome to Riposte"}
      </h1>
      <p className="mt-2 text-muted">
        {competitorCount
          ? `Watching ${sourceCount ?? 0} pages across ${competitorCount} ${competitorCount === 1 ? "competitor" : "competitors"}.`
          : "Set up your workspace in two steps."}
      </p>

      {steps.some((s) => !s.done) && (
      <ol className={`${card} mt-6 divide-y divide-line`}>
        {steps.map((s, i) => (
          <li key={s.title} className="flex flex-wrap items-start gap-4 px-5 py-4">
            <span
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
                s.done ? "bg-accent text-accent-ink" : "border border-line text-muted"
              }`}
              aria-label={s.done ? "Done" : "Not done yet"}
            >
              {s.done ? "✓" : i + 1}
            </span>
            <div className="min-w-0 flex-1">
              <p className={`font-semibold ${s.done ? "text-muted line-through" : ""}`}>{s.title}</p>
              <p className="text-sm text-muted">{s.body}</p>
            </div>
            {s.href && !s.done && s === next && (
              <Link href={s.href} className={primaryButton}>
                {s.cta}
              </Link>
            )}
            {s.href && s.done && (
              <Link href={s.href} className="text-sm text-muted hover:text-ink">
                Edit
              </Link>
            )}
          </li>
        ))}
      </ol>
      )}

      {stale.size > 0 && (
        <Link
          href={`/app/compare?c=${[...stale.keys()][0]}`}
          className="mt-6 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-signal bg-signal-soft px-5 py-3 text-sm hover:brightness-95"
        >
          <span>
            <span className="font-semibold">
              {stale.size === 1 ? "A comparison page is" : `${stale.size} comparison pages are`} out of date.
            </span>{" "}
            A competitor changed pricing, product or positioning since it was written.
          </span>
          <span className="font-semibold">Update →</span>
        </Link>
      )}

      {pending.length > 0 && (
        <section className={`${card} mt-6`}>
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line px-5 py-4">
            <div className="min-w-0">
              <h2 className="font-display text-xl font-bold">
                {pending.length} {pending.length === 1 ? "change" : "changes"} waiting to be explained
              </h2>
              <p className="mt-0.5 text-sm text-muted">
                Riposte spotted these. The AI explains them on the next check, or now.
              </p>
            </div>
            <ExplainPendingButton />
          </div>
          <ChangeList changes={pending} showCompetitor />
        </section>
      )}

      {stories.length > 0 && (
        <section className={`${card} mt-6`}>
          <div className="border-b border-line px-5 py-4">
            <h2 className="font-display text-xl font-bold">Connected moves</h2>
            <p className="mt-0.5 text-sm text-muted">
              Related changes by one competitor, joined into one story, so a campaign reads as one move, not three alerts.
            </p>
          </div>
          <StoryList stories={stories} signalTitles={signalTitles} showCompetitor />
        </section>
      )}

      {(signalTotal ?? 0) > 0 ? (
        <section className={`${card} mt-6`}>
          <div className="border-b border-line px-5 py-4">
            <h2 className="font-display text-xl font-bold">Signals</h2>
            <p className="mt-0.5 text-sm text-muted">
              Each competitor change, explained for your product: what changed, why it matters, and what to do.
            </p>
            <nav className="mt-3 flex flex-wrap gap-1 text-sm" aria-label="Filter signals">
              {FILTERS.map((f) => (
                <Link
                  key={f.key}
                  href={f.key === "new" ? "/app" : `/app?show=${f.key}`}
                  aria-current={show === f.key ? "page" : undefined}
                  className={`rounded-lg px-3 py-1.5 font-medium ${show === f.key ? "bg-accent-soft text-ink" : "text-muted hover:text-ink"}`}
                >
                  {f.label}
                  {f.key === "new" && toReview ? ` (${toReview})` : ""}
                </Link>
              ))}
            </nav>
          </div>
          {signals.length ? (
            <SignalList signals={signals} showCompetitor />
          ) : (
            <p className="px-5 py-6 text-sm text-muted">
              {show === "new"
                ? "You're up to date. Nothing new to review."
                : show === "noise"
                  ? "Nothing filed as noise. Changes the AI judges meaningless (typos, dates, reshuffles) land here."
                  : "No signals yet."}
            </p>
          )}
        </section>
      ) : (
        pending.length === 0 && (
          <div className="mt-6 rounded-2xl border border-dashed border-line bg-surface p-8 text-center">
            <p className="font-semibold">Your feed will appear here.</p>
            <p className="mx-auto mt-1 max-w-md text-sm text-muted">
              {(checkedCount ?? 0) > 0
                ? "Riposte has saved a starting point for each page. When a competitor changes something, it shows up here, explained."
                : "Once the first check runs, every real change from your competitors shows up here, explained."}
            </p>
          </div>
        )
      )}
    </div>
  );
}
