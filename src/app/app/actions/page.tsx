import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { card, eyebrow } from "@/components/styles";
import { ActionItemCard, ACTION_FIELDS, type ActionItemRow } from "@/components/ActionItemCard";
import { OWNERS, PRIORITIES, PRIORITY_LABELS } from "@/lib/actions/prompt";
import { ActionFilters } from "./ActionFilters";

export const metadata = { title: "Actions · Riposte" };

type Row = ActionItemRow & {
  competitor_id: string;
  competitors: { name: string } | null;
  signals: { title: string } | null;
};

type Params = { owner?: string; competitor?: string; group?: string; show?: string };

// Every action across all signals. Filter by owner or competitor; group by urgency or competitor.
export default async function ActionsPage({ searchParams }: { searchParams: Promise<Params> }) {
  const params = await searchParams;
  const owner = OWNERS.find((o) => o === params.owner);
  const showDone = params.show === "done";
  const byCompetitor = params.group === "competitor";
  const { supabase } = await requireUser();

  const { data: competitorRows } = await supabase.from("competitors").select("id, name").order("name");
  const competitors = competitorRows ?? [];
  const competitor = competitors.find((c) => c.id === params.competitor);

  let query = supabase
    .from("action_items")
    .select(`${ACTION_FIELDS}, competitor_id, competitors(name), signals(title)`)
    .eq("status", showDone ? "done" : "open")
    .order("created_at", { ascending: false })
    .limit(300);
  if (owner) query = query.eq("owner", owner);
  if (competitor) query = query.eq("competitor_id", competitor.id);
  const [{ data }, { count: doneCount }, { data: openRows }] = await Promise.all([
    query,
    supabase.from("action_items").select("id", { count: "exact", head: true }).eq("status", "done"),
    supabase.from("action_items").select("competitor_id").eq("status", "open"),
  ]);
  const items = (data ?? []) as unknown as Row[];
  const openTotal = (openRows ?? []).length;
  const openPer = new Map<string, number>();
  for (const r of openRows ?? []) openPer.set(r.competitor_id, (openPer.get(r.competitor_id) ?? 0) + 1);

  // Builds a link that keeps the other filters.
  const link = (change: Partial<Params>) => {
    const next: Params = {
      owner,
      competitor: competitor?.id,
      group: byCompetitor ? "competitor" : undefined,
      show: showDone ? "done" : undefined,
      ...change,
    };
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries(next)) if (v) p.set(k, v);
    const q = p.toString();
    return q ? `/app/actions?${q}` : "/app/actions";
  };
  const ctx = (i: Row) => ({ competitor: i.competitors?.name ?? "", competitorId: i.competitor_id, signalTitle: i.signals?.title ?? "" });

  const groups: { key: string; label: string; rows: Row[] }[] = showDone
    ? [{ key: "done", label: "Done", rows: items }]
    : byCompetitor
      ? competitors
          .map((c) => ({ key: c.id, label: c.name, rows: items.filter((i) => i.competitor_id === c.id) }))
          .filter((g) => g.rows.length)
      : PRIORITIES.map((p) => ({ key: p, label: PRIORITY_LABELS[p], rows: items.filter((i) => i.priority === p) })).filter(
          (g) => g.rows.length,
        );

  return (
    <div>
      <p className={eyebrow}>Actions</p>
      <h1 className="mt-1 font-display text-3xl font-bold">What to do next</h1>
      <p className="mt-2 text-muted">
        Every action from every action kit. Copy the draft, share it where it says, and tick it off.
      </p>

      <nav className="mt-6 flex gap-6 border-b border-line" aria-label="Open or done">
        {[
          { label: "Open", count: openTotal, active: !showDone, href: link({ show: undefined }) },
          { label: "Done", count: doneCount ?? 0, active: showDone, href: link({ show: "done", group: undefined }) },
        ].map((t) => (
          <Link
            key={t.label}
            href={t.href}
            aria-current={t.active ? "page" : undefined}
            className={`-mb-px border-b-2 pb-2 text-base font-semibold ${
              t.active ? "border-accent text-ink" : "border-transparent text-muted hover:text-ink"
            }`}
          >
            {t.label} <span className="ml-1 rounded-full bg-bg px-2 py-0.5 text-sm font-medium text-muted">{t.count}</span>
          </Link>
        ))}
      </nav>

      <div className="mt-5">
        <ActionFilters
          competitors={competitors.map((c) => ({
            value: c.id,
            label: openPer.get(c.id) ? `${c.name} (${openPer.get(c.id)} open)` : c.name,
          }))}
          owners={OWNERS.map((o) => ({ value: o, label: o }))}
          showGroup={!showDone}
        />
      </div>

      {items.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-line bg-surface p-8 text-center">
          <p className="font-semibold">{showDone ? "Nothing done yet." : "No open actions."}</p>
          <p className="mx-auto mt-1 max-w-md text-sm text-muted">
            {owner || competitor
              ? "Nothing matches these filters."
              : (
                  <>
                    Open a signal in your <Link href="/app" className="text-accent hover:underline">feed</Link> and click
                    &quot;Build action kit&quot;. Its actions appear here.
                  </>
                )}
          </p>
        </div>
      ) : (
        groups.map((g) => (
          <section key={g.key} className={`${card} mt-6`}>
            <h2 className="border-b border-line px-5 py-4 font-display text-xl font-bold">
              {g.label} ({g.rows.length})
            </h2>
            <div className="flex flex-col gap-3 p-4">
              {g.rows.map((i) => (
                <ActionItemCard key={i.id} item={i} context={ctx(i)} />
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
