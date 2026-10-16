import { requireUser } from "@/lib/auth";
import { SignalBrowser, SIGNAL_SELECT, type SignalRow } from "@/components/SignalList";
import { Empty, LinkTabs, PageHeader, Pager, pageNum, withParams } from "@/components/ui";
import { ParamSelect } from "@/components/ui-client";

export const metadata = { title: "News & more · Riposte" };

// News about competitors, sorted by what kind of story it is. The same signals also appear in the
// feed; here they're separated from website changes so big moments (a Gartner Leader spot, a funding
// round, an outage) don't get lost between pricing tweaks and blog posts.

const TABS = [
  { key: "all", label: "All", categories: null },
  { key: "launches", label: "Launches", categories: ["product"] },
  { key: "partnerships", label: "Partnerships", categories: ["partnership"] },
  { key: "recognition", label: "Awards & recognition", categories: ["recognition"] },
  { key: "funding", label: "Funding", categories: ["funding"] },
  { key: "leadership", label: "Leadership", categories: ["leadership"] },
  { key: "trouble", label: "Trouble", categories: ["trouble"] },
  { key: "mentions", label: "Mentions", categories: null },
] as const;
type TabKey = (typeof TABS)[number]["key"];
const NAMED = ["product", "partnership", "recognition", "funding", "leadership", "trouble"];

const EMPTY: Record<TabKey, string> = {
  all: "When a competitor is in the news, the story shows up here, explained for your product.",
  launches: "Product launches covered in the news land here.",
  partnerships: "New partners and integrations announced in the news land here.",
  recognition: "Gartner, Forrester and G2 placements, and awards, land here, with a reply ready for sales.",
  funding: "Funding rounds and acquisitions land here.",
  leadership: "New executives and leadership changes land here.",
  trouble: "Outages, layoffs, security issues and lawsuits land here.",
  mentions: "Other news that names a competitor lands here.",
};

// Signals are linked to the change they explain; "!inner" keeps only signals whose change is a news story.
const NEWS_SELECT = SIGNAL_SELECT.replace("changes(", "changes!inner(");
const PER_PAGE = 20;

type Params = { tab?: string; c?: string; s?: string; page?: string };

export default async function NewsPage({ searchParams }: { searchParams: Promise<Params> }) {
  const params = await searchParams;
  const tab = (TABS.find((t) => t.key === params.tab)?.key ?? "all") as TabKey;
  const page = pageNum(params.page);
  const { supabase } = await requireUser();

  // Base query for one tab: news signals, not noise, optionally one competitor.
  const scoped = (key: TabKey, select: string, head = false) => {
    let q = supabase
      .from("signals")
      .select(select, { count: "exact", head })
      .eq("changes.kind", "news")
      .eq("noise", false);
    if (params.c) q = q.eq("competitor_id", params.c);
    const t = TABS.find((x) => x.key === key)!;
    if (t.categories) q = q.in("category", [...t.categories]);
    if (key === "mentions") q = q.not("category", "in", `(${NAMED.join(",")})`);
    return q;
  };

  const [{ data: competitorRows }, { data: rows, count: total }, ...counts] = await Promise.all([
    supabase.from("competitors").select("id, name").order("name"),
    scoped(tab, NEWS_SELECT)
      .order("created_at", { ascending: false })
      .range((page - 1) * PER_PAGE, page * PER_PAGE - 1),
    ...TABS.map((t) => scoped(t.key, "id, changes!inner(kind)", true)),
  ]);
  const competitors = competitorRows ?? [];
  const signals = (rows ?? []) as unknown as SignalRow[];
  const countFor = new Map(TABS.map((t, i) => [t.key, counts[i]?.count ?? 0]));

  const link = (change: Partial<Params>) =>
    withParams("/app/news", { tab: tab === "all" ? undefined : tab, c: params.c, ...change });

  return (
    <div>
      <PageHeader
        kicker="News & more"
        title="Competitors in the news"
        description="Launches, partnerships, awards, funding, leadership changes and trouble, from news sites and press releases. Checked every morning, each story explained for your product."
      />

      <LinkTabs
        className="mt-6"
        active={tab}
        tabs={TABS.map((t) => ({
          key: t.key,
          label: t.label,
          count: countFor.get(t.key) ?? 0,
          href: link({ tab: t.key === "all" ? undefined : t.key, s: undefined, page: undefined }),
        }))}
      />

      <div className="mt-4">
        {competitors.length > 1 && (
          <div className="mb-3">
            <ParamSelect
              param="c"
              label="Competitor"
              options={[{ value: "", label: "All competitors" }, ...competitors.map((c) => ({ value: c.id, label: c.name }))]}
            />
          </div>
        )}
        {signals.length ? (
          <SignalBrowser
            signals={signals}
            selectedId={params.s}
            hrefFor={(id) => link({ s: id, page: page > 1 ? String(page) : undefined })}
            footer={
              (total ?? 0) > PER_PAGE ? (
                <Pager page={page} perPage={PER_PAGE} total={total ?? 0} href={(n) => link({ page: n > 1 ? String(n) : undefined })} />
              ) : undefined
            }
          />
        ) : (
          <Empty title={tab === "all" ? "No news yet." : "Nothing here yet."}>{EMPTY[tab]}</Empty>
        )}
      </div>
    </div>
  );
}
