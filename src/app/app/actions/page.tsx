import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { ActionItemCard, ACTION_FIELDS, type ActionItemRow } from "@/components/ActionItemCard";
import { OWNERS, PRIORITY_LABELS, type Priority } from "@/lib/actions/prompt";
import { Empty, PageHeader } from "@/components/ui";
import { ParamSelect } from "@/components/ui-client";

export const metadata = { title: "Actions · Riposte" };

type Row = ActionItemRow & {
  signal_id: string;
  competitor_id: string;
  done_at: string | null;
  competitors: { name: string } | null;
  signals: { title: string } | null;
};

type Params = { owner?: string; competitor?: string };

const COLUMNS: { key: Priority | "done"; label: string; hint: string; tone: string }[] = [
  { key: "now", label: PRIORITY_LABELS.now, hint: "Do these first", tone: "bg-signal" },
  { key: "this_week", label: PRIORITY_LABELS.this_week, hint: "Plan into this week", tone: "bg-accent" },
  { key: "later", label: PRIORITY_LABELS.later, hint: "When there's time", tone: "bg-muted" },
  { key: "done", label: "Done", hint: "Most recent first", tone: "bg-accent" },
];

// Every action from every action kit, as a board: Today → This week → Later → Done.
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

  return (
    <div>
      <PageHeader
        kicker="Actions"
        title="What to do next"
        description="Every response from every action kit, sorted by urgency. Open the draft, copy it, share it where it says, and mark it done."
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
        <div className="mt-4 grid items-start gap-4 md:grid-cols-2 xl:grid-cols-4">
          {COLUMNS.map((col) => {
            const rows = rowsFor(col.key);
            return (
              <section key={col.key} className="flex max-h-[78vh] flex-col rounded-2xl border border-line bg-bg">
                <header className="flex items-center gap-2 border-b border-line px-3 py-2.5">
                  <span className={`h-2 w-2 rounded-full ${col.tone}`} aria-hidden />
                  <h2 className="font-display text-base font-bold">{col.label}</h2>
                  <span className="rounded-full bg-surface px-2 py-0.5 text-xs font-semibold text-muted">{rows.length}</span>
                  <span className="ml-auto hidden text-xs text-muted 2xl:inline">{col.hint}</span>
                </header>
                <div className="flex flex-col gap-2.5 overflow-y-auto p-2.5">
                  {rows.length ? (
                    rows.map((i) => <ActionItemCard key={i.id} item={i} context={ctx(i)} compact />)
                  ) : (
                    <p className="px-1 py-4 text-center text-sm text-muted">{col.key === "done" ? "Nothing done yet." : "Nothing here."}</p>
                  )}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}

