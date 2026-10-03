import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { card, eyebrow } from "@/components/styles";
import { ActionItemCard, ACTION_FIELDS, type ActionItemRow } from "@/components/ActionItemCard";
import { OWNERS, PRIORITIES, PRIORITY_LABELS } from "@/lib/actions/prompt";

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
  const pill = (active: boolean) =>
    `rounded-lg px-3 py-1.5 font-medium whitespace-nowrap ${active ? "bg-accent-soft text-ink" : "text-muted hover:text-ink"}`;
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

      <div className="mt-5 flex flex-col gap-2 text-sm">
        <div className="flex flex-wrap items-center gap-1">
          <span className="w-24 shrink-0 text-xs font-semibold uppercase tracking-wider text-muted">Competitor</span>
          <Link href={link({ competitor: undefined })} className={pill(!competitor)}>
            All
          </Link>
          {competitors.map((c) => (
            <Link key={c.id} href={link({ competitor: c.id })} className={pill(competitor?.id === c.id)}>
              {c.name}
              {openPer.get(c.id) ? ` (${openPer.get(c.id)})` : ""}
            </Link>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-1">
          <span className="w-24 shrink-0 text-xs font-semibold uppercase tracking-wider text-muted">Owner</span>
          <Link href={link({ owner: undefined })} className={pill(!owner)}>
            Everyone
          </Link>
          {OWNERS.map((o) => (
            <Link key={o} href={link({ owner: o })} className={pill(owner === o)}>
              {o}
            </Link>
          ))}
        </div>
        {!showDone && (
          <div className="flex flex-wrap items-center gap-1">
            <span className="w-24 shrink-0 text-xs font-semibold uppercase tracking-wider text-muted">Group by</span>
            <Link href={link({ group: undefined })} className={pill(!byCompetitor)}>
              Urgency
            </Link>
            <Link href={link({ group: "competitor" })} className={pill(byCompetitor)}>
              Competitor
            </Link>
          </div>
        )}
      </div>
      <p className="mt-3 text-sm">
        {showDone ? (
          <Link href={link({ show: undefined })} className="text-accent hover:underline">
            ← Back to open actions
          </Link>
        ) : (
          (doneCount ?? 0) > 0 && (
            <Link href={link({ show: "done", group: undefined })} className="text-accent hover:underline">
              See {doneCount} done
            </Link>
          )
        )}
      </p>

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
