import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { card, primaryButton } from "@/components/styles";
import { ChangeList, CHANGE_SELECT, type ChangeRow } from "@/components/ChangeList";
import { SignalBrowser, SIGNAL_SELECT, type SignalRow } from "@/components/SignalList";
import { ExplainPendingButton } from "@/components/ActionButtons";
import { StoryList, STORY_SELECT, type StoryRow } from "@/components/InsightLists";
import { loadComparisons } from "@/lib/compare/stale";
import { Empty, LinkTabs, PageHeader, Pager, pageNum, withParams } from "@/components/ui";
import { ParamSelect } from "@/components/ui-client";

export const metadata = { title: "Feed · Riposte" };
export const maxDuration = 90;

const FILTERS = [
  { key: "new", label: "To review" },
  { key: "all", label: "All" },
  { key: "noise", label: "Noise" },
] as const;
const PER_PAGE = 20;

type Params = { show?: string; view?: string; s?: string; page?: string; c?: string };

// The signed-in home: setup progress, then the feed in three views
// (signals, connected moves, changes waiting to be explained).
export default async function AppHome({ searchParams }: { searchParams: Promise<Params> }) {
  const params = await searchParams;
  const show = FILTERS.some((f) => f.key === params.show) ? (params.show as (typeof FILTERS)[number]["key"]) : "new";
  const view = params.view === "moves" || params.view === "waiting" ? params.view : "signals";
  const page = pageNum(params.page);
  const { supabase, user } = await requireUser();

  let signalQuery = supabase
    .from("signals")
    .select(SIGNAL_SELECT, { count: "exact" })
    .order("created_at", { ascending: false })
    .range((page - 1) * PER_PAGE, page * PER_PAGE - 1);
  if (show === "new") signalQuery = signalQuery.eq("status", "new").eq("noise", false);
  if (show === "all") signalQuery = signalQuery.eq("noise", false);
  if (show === "noise") signalQuery = signalQuery.eq("noise", true);
  if (params.c) signalQuery = signalQuery.eq("competitor_id", params.c);

  const [
    { data: profile },
    { data: competitorRows },
    { count: sourceCount },
    { count: checkedCount },
    { data: pendingRows },
    { data: signalRows, count: shownTotal },
    { count: signalTotal },
    { count: toReview },
    { data: storyRows },
  ] = await Promise.all([
    supabase.from("profiles").select("product_name").eq("id", user.id).maybeSingle(),
    supabase.from("competitors").select("id, name").order("name"),
    supabase.from("sources").select("id", { count: "exact", head: true }),
    supabase.from("sources").select("id", { count: "exact", head: true }).not("last_checked_at", "is", null),
    supabase.from("changes").select(CHANGE_SELECT).eq("processed", false).order("detected_at", { ascending: false }).limit(30),
    signalQuery,
    supabase.from("signals").select("id", { count: "exact", head: true }),
    supabase.from("signals").select("id", { count: "exact", head: true }).eq("status", "new").eq("noise", false),
    supabase.from("stories").select(STORY_SELECT).eq("status", "new").order("created_at", { ascending: false }).limit(20),
  ]);
  const competitors = competitorRows ?? [];
  const competitorCount = competitors.length;
  const pending = (pendingRows ?? []) as unknown as ChangeRow[];
  const stories = (storyRows ?? []) as unknown as StoryRow[];
  const signals = (signalRows ?? []) as unknown as SignalRow[];
  const linkedIds = [...new Set(stories.flatMap((s) => s.signal_ids))];
  const { data: linkedRows } =
    view === "moves" && linkedIds.length
      ? await supabase.from("signals").select("id, title").in("id", linkedIds)
      : { data: [] as { id: string; title: string }[] };
  const signalTitles = new Map((linkedRows ?? []).map((r) => [r.id as string, r.title as string]));
  const { stale } = await loadComparisons(supabase);

  const steps = [
    { done: Boolean(profile?.product_name), title: "Tell Riposte about your product", href: "/app/product", cta: "Add your product" },
    { done: competitorCount > 0, title: "Add your competitors", href: "/app/competitors", cta: "Add competitors" },
    { done: (checkedCount ?? 0) > 0, title: "First check (runs on its own)", href: null, cta: null },
  ];
  const next = steps.find((s) => !s.done && s.href);

  const link = (change: Partial<Params>) =>
    withParams("/app", {
      view: view === "signals" ? undefined : view,
      show: show === "new" ? undefined : show,
      c: params.c,
      ...change,
    });

  return (
    <div>
      <PageHeader
        kicker="Your workspace"
        title={profile?.product_name ? `${profile.product_name}'s feed` : "Welcome to Riposte"}
        description={
          competitorCount
            ? `Watching ${sourceCount ?? 0} pages across ${competitorCount} ${competitorCount === 1 ? "competitor" : "competitors"}. Checked every morning.`
            : "Set up your workspace in two steps."
        }
      />

      {steps.some((s) => !s.done) && (
        <ol className={`${card} mt-5 grid divide-y divide-line sm:grid-cols-3 sm:divide-x sm:divide-y-0`}>
          {steps.map((s, i) => (
            <li key={s.title} className="flex items-center gap-3 px-4 py-3">
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
                  s.done ? "bg-accent text-accent-ink" : "border border-line text-muted"
                }`}
              >
                {s.done ? "✓" : i + 1}
              </span>
              <p className={`min-w-0 flex-1 text-sm font-semibold ${s.done ? "text-muted line-through" : ""}`}>{s.title}</p>
              {s.href && !s.done && s === next && (
                <Link href={s.href} className={`${primaryButton} px-3 py-1.5 text-sm`}>
                  {s.cta}
                </Link>
              )}
            </li>
          ))}
        </ol>
      )}

      {stale.size > 0 && (
        <Link
          href={`/app/compare?c=${[...stale.keys()][0]}`}
          className="mt-5 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-signal bg-signal-soft px-4 py-2.5 text-sm hover:brightness-95"
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

      <LinkTabs
        className="mt-6"
        active={view}
        tabs={[
          { key: "signals", label: "Signals", count: toReview ?? 0, href: link({ view: undefined, s: undefined, page: undefined }) },
          { key: "moves", label: "Connected moves", count: stories.length, href: link({ view: "moves", s: undefined, page: undefined }) },
          { key: "waiting", label: "Waiting to be explained", count: pending.length, href: link({ view: "waiting", s: undefined, page: undefined }) },
        ]}
      />

      <div className="mt-4">
        {view === "signals" &&
          ((signalTotal ?? 0) > 0 ? (
            <>
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <nav className="inline-flex rounded-lg border border-line bg-surface p-1" aria-label="Filter signals">
                  {FILTERS.map((f) => (
                    <Link
                      key={f.key}
                      href={link({ show: f.key === "new" ? undefined : f.key, s: undefined, page: undefined })}
                      scroll={false}
                      aria-current={show === f.key ? "page" : undefined}
                      className={`rounded-md px-3 py-1.5 text-sm font-medium ${show === f.key ? "bg-accent-soft text-ink" : "text-muted hover:text-ink"}`}
                    >
                      {f.label}
                    </Link>
                  ))}
                </nav>
                {competitors.length > 1 && (
                  <ParamSelect
                    param="c"
                    label="Competitor"
                    options={[{ value: "", label: "All competitors" }, ...competitors.map((c) => ({ value: c.id, label: c.name }))]}
                  />
                )}
              </div>
              {signals.length ? (
                <SignalBrowser
                  signals={signals}
                  selectedId={params.s}
                  hrefFor={(id) => link({ s: id, page: page > 1 ? String(page) : undefined })}
                  footer={
                    (shownTotal ?? 0) > PER_PAGE ? (
                      <Pager page={page} perPage={PER_PAGE} total={shownTotal ?? 0} href={(n) => link({ page: n > 1 ? String(n) : undefined })} />
                    ) : undefined
                  }
                />
              ) : (
                <Empty title={show === "new" ? "You're up to date." : "Nothing here."}>
                  {show === "new"
                    ? "Nothing new to review. Check All to see earlier signals."
                    : show === "noise"
                      ? "Changes the AI judges meaningless (typos, dates, reshuffles) land here."
                      : "No signals match this filter."}
                </Empty>
              )}
            </>
          ) : (
            <Empty title="Your feed will appear here.">
              {(checkedCount ?? 0) > 0
                ? "Riposte has saved a starting point for each page. When a competitor changes something, it shows up here, explained."
                : "Once the first check runs, every real change from your competitors shows up here, explained."}
            </Empty>
          ))}

        {view === "moves" &&
          (stories.length ? (
            <div className={card}>
              <p className="border-b border-line px-5 py-3 text-sm text-muted">
                Related changes by one competitor, joined into one story, so a campaign reads as one move, not three alerts.
              </p>
              <StoryList stories={stories} signalTitles={signalTitles} showCompetitor />
            </div>
          ) : (
            <Empty title="No connected moves yet.">
              When a competitor makes several related changes (a price change, a launch post and a changelog entry), Riposte joins them
              here.
            </Empty>
          ))}

        {view === "waiting" &&
          (pending.length ? (
            <div className={card}>
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-3">
                <p className="text-sm text-muted">Riposte spotted these. The AI explains them on the next check, or now.</p>
                <ExplainPendingButton />
              </div>
              <ChangeList changes={pending} showCompetitor />
            </div>
          ) : (
            <Empty title="Nothing waiting.">Every change Riposte found has been explained.</Empty>
          ))}
      </div>
    </div>
  );
}
