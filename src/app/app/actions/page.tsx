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

// Every open action across all signals, grouped by how soon it's needed.
export default async function ActionsPage({ searchParams }: { searchParams: Promise<{ owner?: string; show?: string }> }) {
  const { owner: ownerParam, show } = await searchParams;
  const owner = OWNERS.find((o) => o === ownerParam);
  const showDone = show === "done";
  const { supabase } = await requireUser();

  let query = supabase
    .from("action_items")
    .select(`${ACTION_FIELDS}, competitor_id, competitors(name), signals(title)`)
    .eq("status", showDone ? "done" : "open")
    .order("created_at", { ascending: false })
    .limit(200);
  if (owner) query = query.eq("owner", owner);
  const [{ data }, { count: doneCount }] = await Promise.all([
    query,
    supabase.from("action_items").select("id", { count: "exact", head: true }).eq("status", "done"),
  ]);
  const items = (data ?? []) as unknown as Row[];

  const link = (o?: string, done?: boolean) => {
    const p = new URLSearchParams();
    if (o) p.set("owner", o);
    if (done) p.set("show", "done");
    const q = p.toString();
    return q ? `/app/actions?${q}` : "/app/actions";
  };
  const pill = (active: boolean) =>
    `rounded-lg px-3 py-1.5 font-medium whitespace-nowrap ${active ? "bg-accent-soft text-ink" : "text-muted hover:text-ink"}`;

  return (
    <div>
      <p className={eyebrow}>Actions</p>
      <h1 className="mt-1 font-display text-3xl font-bold">What to do next</h1>
      <p className="mt-2 text-muted">
        Every action from every action kit, most urgent first. Copy the draft, share it where it says, and tick it off.
      </p>

      <nav className="mt-5 flex flex-wrap gap-1 text-sm" aria-label="Filter by owner">
        <Link href={link(undefined, showDone)} className={pill(!owner)}>
          Everyone
        </Link>
        {OWNERS.map((o) => (
          <Link key={o} href={link(o, showDone)} className={pill(owner === o)}>
            {o}
          </Link>
        ))}
      </nav>
      <p className="mt-2 text-sm">
        {showDone ? (
          <Link href={link(owner)} className="text-accent hover:underline">
            ← Back to open actions
          </Link>
        ) : (
          (doneCount ?? 0) > 0 && (
            <Link href={link(owner, true)} className="text-accent hover:underline">
              See {doneCount} done
            </Link>
          )
        )}
      </p>

      {items.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-line bg-surface p-8 text-center">
          <p className="font-semibold">{showDone ? "Nothing done yet." : "No open actions."}</p>
          <p className="mx-auto mt-1 max-w-md text-sm text-muted">
            Open a signal in your <Link href="/app" className="text-accent hover:underline">feed</Link> and click
            &quot;Build action kit&quot;. Its actions appear here.
          </p>
        </div>
      ) : showDone ? (
        <div className="mt-6 flex flex-col gap-3">
          {items.map((i) => (
            <ActionItemCard key={i.id} item={i} context={{ competitor: i.competitors?.name ?? "", competitorId: i.competitor_id, signalTitle: i.signals?.title ?? "" }} />
          ))}
        </div>
      ) : (
        PRIORITIES.map((p) => {
          const group = items.filter((i) => i.priority === p);
          if (!group.length) return null;
          return (
            <section key={p} className={`${card} mt-6`}>
              <h2 className="border-b border-line px-5 py-4 font-display text-xl font-bold">
                {PRIORITY_LABELS[p]} ({group.length})
              </h2>
              <div className="flex flex-col gap-3 p-4">
                {group.map((i) => (
                  <ActionItemCard key={i.id} item={i} context={{ competitor: i.competitors?.name ?? "", competitorId: i.competitor_id, signalTitle: i.signals?.title ?? "" }} />
                ))}
              </div>
            </section>
          );
        })
      )}
    </div>
  );
}
