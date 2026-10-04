import Link from "next/link";
import { SOURCE_LABELS, type SourceType } from "@/lib/discovery/parse";
import { setSignalStatus } from "@/app/app/actions";
import { SubmitButton } from "@/components/FormButtons";
import { ChangeBody, type ChangeRow } from "@/components/ChangeList";
import { timeAgo } from "@/lib/time";
import { ActionItemCard, ACTION_FIELDS, type ActionItemRow } from "@/components/ActionItemCard";
import { BuildKitButton } from "@/components/KitButtons";

export type SignalRow = {
  id: string;
  created_at: string;
  title: string;
  what_changed: string;
  so_what: string;
  action: string;
  impact: "high" | "medium" | "low";
  category: string;
  noise: boolean;
  status: "new" | "reviewed" | "dismissed";
  competitor_id: string;
  competitors: { name: string } | null;
  action_items?: ActionItemRow[];
  changes:
    | (Pick<ChangeRow, "kind" | "added" | "removed" | "detected_at"> & { sources: { type: SourceType; url: string } | null })
    | null;
};

export const SIGNAL_SELECT = `id, created_at, title, what_changed, so_what, action, impact, category, noise, status, competitor_id, competitors(name), changes(kind, added, removed, detected_at, sources(type, url)), action_items(${ACTION_FIELDS})`;

const IMPACT = {
  high: { label: "High impact", className: "bg-signal-soft text-signal" },
  medium: { label: "Worth knowing", className: "bg-accent-soft text-ink" },
  low: { label: "Low impact", className: "border border-line text-muted" },
};

const CATEGORY: Record<string, string> = {
  pricing: "Pricing",
  product: "Product",
  content: "Content",
  positioning: "Positioning",
  other: "Other",
};

function StatusButton({ id, status, label, pending }: { id: string; status: string; label: string; pending: string }) {
  return (
    <form action={setSignalStatus}>
      <input type="hidden" name="signal_id" value={id} />
      <input type="hidden" name="status" value={status} />
      <SubmitButton pendingLabel={pending}>{label}</SubmitButton>
    </form>
  );
}

// AI-explained signals: what changed, why it matters, what to do, with the evidence one click away.
export function SignalList({ signals, showCompetitor = false }: { signals: SignalRow[]; showCompetitor?: boolean }) {
  return (
    <ul className="divide-y divide-line">
      {signals.map((s) => {
        const impact = s.noise ? { label: "Noise", className: "border border-line text-muted" } : IMPACT[s.impact];
        const source = s.changes?.sources;
        const done = s.status !== "new";
        return (
          <li key={s.id} id={`signal-${s.id}`} className={`scroll-mt-6 px-5 py-5 ${done ? "opacity-70" : ""}`}>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
              <span className={`rounded-full px-2 py-0.5 font-semibold ${impact.className}`}>{impact.label}</span>
              <span className="text-muted">{CATEGORY[s.category] ?? "Other"}</span>
              {showCompetitor && s.competitors && (
                <Link href={`/app/competitors/${s.competitor_id}`} className="font-semibold text-ink hover:underline">
                  {s.competitors.name}
                </Link>
              )}
              {source && <span className="text-muted">{SOURCE_LABELS[source.type]}</span>}
              <span className="font-mono text-muted">{timeAgo(s.changes?.detected_at ?? s.created_at)}</span>
              {s.status === "reviewed" && <span className="text-accent">✓ Reviewed</span>}
              {s.status === "dismissed" && <span className="text-muted">Dismissed</span>}
            </div>

            <h3 className="mt-2 font-display text-lg font-bold leading-snug">{s.title}</h3>
            <p className="mt-1 text-sm">{s.what_changed}</p>

            {!s.noise && (
              <dl className="mt-3 grid gap-3 text-sm md:grid-cols-2">
                <div className="min-w-0 rounded-lg bg-bg p-3">
                  <dt className="text-xs font-semibold uppercase tracking-wider text-muted">Why it matters to you</dt>
                  <dd className="mt-1">{s.so_what}</dd>
                </div>
                <div className="min-w-0 rounded-lg bg-accent-soft p-3">
                  <dt className="text-xs font-semibold uppercase tracking-wider text-muted">What to do</dt>
                  <dd className="mt-1">{s.action}</dd>
                </div>
              </dl>
            )}

            {s.changes && (
              <details className="group mt-3 text-sm">
                <summary className="cursor-pointer select-none text-muted hover:text-ink">
                  See exactly what changed
                  {source && (
                    <>
                      {" · "}
                      <a href={source.url} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
                        open page ↗
                      </a>
                    </>
                  )}
                </summary>
                <ChangeBody change={s.changes} />
              </details>
            )}

            {!s.noise && <ActionKit signalId={s.id} items={s.action_items ?? []} />}

            <div className="mt-3 flex flex-wrap gap-2">
              {s.status === "new" ? (
                <>
                  <StatusButton id={s.id} status="reviewed" label="Mark reviewed" pending="Saving…" />
                  <StatusButton id={s.id} status="dismissed" label="Dismiss" pending="Saving…" />
                </>
              ) : (
                <StatusButton id={s.id} status="new" label="Move back to new" pending="Saving…" />
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function ActionKit({ signalId, items }: { signalId: string; items: ActionItemRow[] }) {
  if (!items.length) {
    return (
      <div className="mt-4 rounded-xl border border-dashed border-line p-4">
        <p className="text-sm font-semibold">Action kit</p>
        <p className="mb-3 mt-0.5 text-sm text-muted">
          What to create in response, who owns it, where to share it, with first drafts ready to edit.
        </p>
        <BuildKitButton signalId={signalId} />
      </div>
    );
  }
  const sorted = [...items].sort((a, b) => a.position - b.position);
  const open = sorted.filter((i) => i.status === "open").length;
  return (
    <div className="mt-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-sm font-semibold">
          Action kit · {open ? `${open} open` : "all done ✓"}
        </p>
      </div>
      <div className="mt-2 flex flex-col gap-3">
        {sorted.map((item) => (
          <ActionItemCard key={item.id} item={item} />
        ))}
      </div>
      {open > 0 && (
        <div className="mt-3">
          <BuildKitButton signalId={signalId} redo />
        </div>
      )}
    </div>
  );
}
