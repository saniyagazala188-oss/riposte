import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { ActionItemCard, ACTION_FIELDS, type ActionItemRow } from "@/components/ActionItemCard";
import { KIND_LABELS, OWNERS, PRIORITY_LABELS, type Priority } from "@/lib/actions/prompt";
import { card } from "@/components/styles";
import { Empty, LinkTabs, PageHeader, withParams } from "@/components/ui";
import { ParamSelect } from "@/components/ui-client";

export const metadata = { title: "Actions · Riposte" };

type Row = ActionItemRow & {
  signal_id: string;
  competitor_id: string;
  done_at: string | null;
  competitors: { name: string } | null;
  signals: { title: string } | null;
};

type Params = { owner?: string; competitor?: string; tab?: string; a?: string };

const TABS: { key: Priority | "done"; label: string; hint: string }[] = [
  { key: "now", label: PRIORITY_LABELS.now, hint: "Do these first." },
  { key: "this_week", label: PRIORITY_LABELS.this_week, hint: "Plan these into this week." },
  { key: "later", label: PRIORITY_LABELS.later, hint: "When there's time." },
  { key: "done", label: "Done", hint: "Most recent first." },
];

const PRIORITY_DOT: Record<Priority, string> = { now: "bg-signal", this_week: "bg-accent", later: "bg-muted" };

// Every action from every action kit: urgency tabs, a list on the left, the selected action on the right.
export default async function ActionsPage({ searchParams }: { searchParams: Promise<Params> }) {
  const params = await searchParams;
  const owner = OWNERS.find((o) => o === params.owner);
  const { supabase } = await requireUser();

  const { data: competitorRows } = await supabase.from("competitors").select("id, name").order("name");
  const competitors = competitorRows ?? [];
  const competitor = competitors.find((c) => c.id === params.competitor);

  const base = () => {
    let q = supabase
      .from("action_items")
      .select(`${ACTION_FIELDS}, signal_id, done_at, competitor_id, competitors(name), signals(title)`)
      .limit(300);
    if (owner) q = q.eq("owner", owner);
    if (competitor) q = q.eq("competitor_id", competitor.id);
    return q;
  };
  const [{ data: openData }, { data: doneData }] = await Promise.all([
    base().eq("status", "open").order("created_at", { ascending: false }),
    base().eq("status", "done").order("done_at", { ascending: false }).limit(30),
  ]);
  const open = (openData ?? []) as unknown as Row[];
  const done = (doneData ?? []) as unknown as Row[];
  const ctx = (i: Row) => ({
    competitor: i.competitors?.name ?? "",
    competitorId: i.competitor_id,
    signalTitle: i.signals?.title ?? "",
    signalId: i.signal_id,
  });
  const rowsFor = (key: Priority | "done") => (key === "done" ? done : open.filter((i) => i.priority === key));
  const filtered = Boolean(owner || competitor);
  // Open the first tab that has something in it, unless one was chosen.
  const tab =
    TABS.find((t) => t.key === params.tab)?.key ?? TABS.find((t) => t.key !== "done" && rowsFor(t.key).length)?.key ?? "now";
  const rows = rowsFor(tab);
  const selected = rows.find((r) => r.id === params.a) ?? rows[0];
  const link = (change: Partial<Params>) =>
    withParams("/app/actions", { competitor: competitor?.id, owner, tab: params.tab, ...change });

  return (
    <div>
      <PageHeader
        kicker="Actions"
        title="What to do next"
        description="Every response from every action kit, sorted by urgency. Pick one, copy the draft, share it where it says, and mark it done."
      />

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <ParamSelect
          param="competitor"
          label="Competitor"
          options={[{ value: "", label: "All competitors" }, ...competitors.map((c) => ({ value: c.id, label: c.name }))]}
        />
        <ParamSelect param="owner" label="Owner" options={[{ value: "", label: "Every owner" }, ...OWNERS.map((o) => ({ value: o, label: o }))]} />
        {filtered && (
          <Link href="/app/actions" className="px-2 text-sm text-accent hover:underline">
            Clear filters
          </Link>
        )}
        <p className="ml-auto text-sm text-muted">
          <span className="font-semibold text-ink">{open.length} open</span> · {done.length} done
        </p>
      </div>

      {open.length === 0 && done.length === 0 ? (
        <div className="mt-6">
          <Empty title={filtered ? "Nothing matches these filters." : "No actions yet."}>
            {!filtered && (
              <>
                Open a signal in your <Link href="/app" className="text-accent hover:underline">feed</Link>, go to its Action kit
                tab and click &quot;Build action kit&quot;. Its actions appear here.
              </>
            )}
          </Empty>
        </div>
      ) : (
        <>
          <LinkTabs
            className="mt-4"
            active={tab}
            tabs={TABS.map((t) => ({ key: t.key, label: t.label, count: rowsFor(t.key).length, href: link({ tab: t.key, a: undefined }) }))}
          />
          {rows.length === 0 ? (
            <div className="mt-4">
              <Empty title={tab === "done" ? "Nothing done yet." : `Nothing for ${TABS.find((t) => t.key === tab)!.label.toLowerCase()}.`} />
            </div>
          ) : (
            <div className="mt-4 grid items-start gap-4 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
              <div className={`${card} overflow-hidden`}>
                <p className="border-b border-line px-4 py-2 text-xs text-muted">{TABS.find((t) => t.key === tab)!.hint}</p>
                <ul className="max-h-[68vh] divide-y divide-line overflow-y-auto">
                  {rows.map((i) => {
                    const on = i.id === selected?.id;
                    return (
                      <li key={i.id}>
                        <Link
                          href={link({ tab, a: i.id })}
                          scroll={false}
                          aria-current={on ? "true" : undefined}
                          className={`block border-l-4 px-4 py-3 ${on ? "border-accent bg-accent-soft" : "border-transparent hover:bg-bg"}`}
                        >
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs">
                            {i.status === "open" && <span className={`h-2 w-2 rounded-full ${PRIORITY_DOT[i.priority]}`} aria-hidden />}
                            <span className="font-semibold text-ink">{i.competitors?.name}</span>
                            <span className="text-muted">{KIND_LABELS[i.kind]}</span>
                            <span className="ml-auto text-muted">{i.owner}</span>
                          </div>
                          <p className={`mt-1 text-sm font-semibold leading-snug ${i.status === "done" ? "text-muted line-through" : ""}`}>{i.title}</p>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
              <div className="lg:sticky lg:top-6">{selected && <ActionItemCard item={selected} context={ctx(selected)} expanded />}</div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

