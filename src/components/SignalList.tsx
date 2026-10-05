import Link from "next/link";
import { SOURCE_LABELS, type SourceType } from "@/lib/discovery/parse";
import { setSignalStatus } from "@/app/app/actions";
import { SubmitButton } from "@/components/FormButtons";
import { ChangeBody, type ChangeRow } from "@/components/ChangeList";
import { timeAgo } from "@/lib/time";
import { ActionItemCard, ACTION_FIELDS, type ActionItemRow } from "@/components/ActionItemCard";
import { BuildKitButton } from "@/components/KitButtons";
import { Tabs } from "@/components/ui-client";
import { card } from "@/components/styles";

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
    | (Pick<ChangeRow, "kind" | "added" | "removed" | "detected_at" | "page_url"> & { sources: { type: SourceType; url: string } | null })
    | null;
};

export const SIGNAL_SELECT = `id, created_at, title, what_changed, so_what, action, impact, category, noise, status, competitor_id, competitors(name), changes(kind, added, removed, detected_at, page_url, sources(type, url)), action_items(${ACTION_FIELDS})`;

const IMPACT = {
  high: { label: "High impact", short: "High", className: "bg-signal-soft text-signal", dot: "bg-signal" },
  medium: { label: "Worth knowing", short: "Medium", className: "bg-accent-soft text-ink", dot: "bg-accent" },
  low: { label: "Low impact", short: "Low", className: "border border-line text-muted", dot: "bg-line" },
};
const NOISE = { label: "Noise", short: "Noise", className: "border border-line text-muted", dot: "bg-line" };

const CATEGORY: Record<string, string> = {
  pricing: "Pricing",
  product: "Product",
  content: "Content",
  positioning: "Positioning",
  other: "Other",
};

function StatusButton({ id, status, label, pending, primary }: { id: string; status: string; label: string; pending: string; primary?: boolean }) {
  return (
    <form action={setSignalStatus}>
      <input type="hidden" name="signal_id" value={id} />
      <input type="hidden" name="status" value={status} />
      <SubmitButton
        pendingLabel={pending}
        className={
          primary
            ? "inline-flex items-center justify-center rounded-lg bg-accent px-3 py-2 text-sm font-semibold text-accent-ink hover:brightness-110 disabled:opacity-60"
            : undefined
        }
      >
        {label}
      </SubmitButton>
    </form>
  );
}

const kitOpen = (s: SignalRow) => (s.action_items ?? []).filter((i) => i.status === "open").length;

// Compact, clickable rows: impact, title, competitor, time.
export function SignalRows({
  signals,
  selectedId,
  hrefFor,
  showCompetitor = true,
}: {
  signals: SignalRow[];
  selectedId?: string;
  hrefFor: (id: string) => string;
  showCompetitor?: boolean;
}) {
  return (
    <ul className="divide-y divide-line">
      {signals.map((s) => {
        const impact = s.noise ? NOISE : IMPACT[s.impact];
        const on = s.id === selectedId;
        const kit = s.action_items?.length ?? 0;
        return (
          <li key={s.id}>
            <Link
              href={hrefFor(s.id)}
              scroll={false}
              aria-current={on ? "true" : undefined}
              className={`block border-l-4 px-4 py-3 transition ${
                on ? "border-accent bg-accent-soft" : "border-transparent hover:bg-bg"
              } ${s.status !== "new" && !on ? "opacity-65" : ""}`}
            >
              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs">
                <span className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 font-semibold ${impact.className}`}>
                  {impact.short}
                </span>
                <span className="text-muted">{CATEGORY[s.category] ?? "Other"}</span>
                {showCompetitor && s.competitors && <span className="font-semibold text-ink">{s.competitors.name}</span>}
                <span className="ml-auto font-mono text-muted">{timeAgo(s.changes?.detected_at ?? s.created_at)}</span>
              </div>
              <p className="mt-1 text-sm font-semibold leading-snug">{s.title}</p>
              <p className="mt-0.5 text-xs text-muted">
                {s.status === "reviewed" ? "✓ Reviewed" : s.status === "dismissed" ? "Dismissed" : "To review"}
                {kit > 0 && ` · Action kit: ${kitOpen(s) ? `${kitOpen(s)} open` : "done ✓"}`}
                {s.changes?.kind === "rewrite" && " · Page rewritten"}
              </p>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

// One signal in full: what changed, why it matters, the evidence and the action kit, in tabs.
export function SignalDetail({ s }: { s: SignalRow }) {
  const impact = s.noise ? NOISE : IMPACT[s.impact];
  const source = s.changes?.sources;
  const items = [...(s.action_items ?? [])].sort((a, b) => a.position - b.position);
  const open = items.filter((i) => i.status === "open").length;

  const summary = s.noise ? (
    <p className="text-sm text-muted">The AI judged this a non-business change (wording, dates, layout). No action needed.</p>
  ) : (
    <dl className="grid gap-3 text-sm">
      <div className="rounded-xl bg-bg p-4">
        <dt className="text-xs font-semibold uppercase tracking-wider text-muted">Why it matters to you</dt>
        <dd className="mt-1">{s.so_what}</dd>
      </div>
      <div className="rounded-xl bg-accent-soft p-4">
        <dt className="text-xs font-semibold uppercase tracking-wider text-muted">What to do</dt>
        <dd className="mt-1">{s.action}</dd>
      </div>
    </dl>
  );

  const evidence = s.changes ? (
    <div className="rounded-xl border border-line p-4">
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <span className="font-semibold">
          {s.changes.kind === "rewrite" ? "Page rewritten" : source ? SOURCE_LABELS[source.type] : "Page"}
          <span className="ml-2 font-mono text-xs font-normal text-muted">detected {timeAgo(s.changes.detected_at)}</span>
        </span>
        {source && (
          <a href={source.url} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-accent hover:underline">
            Open their page ↗
          </a>
        )}
      </div>
      <ChangeBody change={s.changes} />
    </div>
  ) : (
    <p className="text-sm text-muted">No evidence saved for this signal.</p>
  );

  const kit = !items.length ? (
    <div className="rounded-xl border border-dashed border-line p-4">
      <p className="text-sm font-semibold">No action kit yet</p>
      <p className="mb-3 mt-0.5 text-sm text-muted">
        What to create in response, who owns it, where to share it, with first drafts ready to edit.
      </p>
      <BuildKitButton signalId={s.id} />
    </div>
  ) : (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-muted">{open ? `${open} of ${items.length} open` : "All done ✓"} · also on the Actions board</p>
      {items.map((item) => (
        <ActionItemCard key={item.id} item={item} />
      ))}
      {open > 0 && <BuildKitButton signalId={s.id} redo />}
    </div>
  );

  return (
    <article className={`${card} p-4 sm:p-5`}>
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
        <span className={`rounded-full px-2 py-0.5 font-semibold ${impact.className}`}>{impact.label}</span>
        <span className="text-muted">{CATEGORY[s.category] ?? "Other"}</span>
        {s.competitors && (
          <Link href={`/app/competitors/${s.competitor_id}`} className="font-semibold text-ink hover:underline">
            {s.competitors.name}
          </Link>
        )}
        {s.changes?.kind === "rewrite" ? (
          <span className="font-semibold text-signal">Page rewritten</span>
        ) : (
          source && <span className="text-muted">{SOURCE_LABELS[source.type]}</span>
        )}
        <span className="font-mono text-muted">{timeAgo(s.changes?.detected_at ?? s.created_at)}</span>
        {s.status === "reviewed" && <span className="text-accent">✓ Reviewed</span>}
        {s.status === "dismissed" && <span className="text-muted">Dismissed</span>}
      </div>
      <h2 className="mt-2 font-display text-xl font-bold leading-snug">{s.title}</h2>
      <p className="mt-1.5 text-sm">{s.what_changed}</p>

      <div className="mt-4">
        <Tabs
          key={s.id}
          tabs={[
            { key: "summary", label: "Why it matters", content: summary },
            { key: "evidence", label: "What changed", content: evidence },
            ...(s.noise ? [] : [{ key: "kit", label: "Action kit", count: items.length || undefined, content: kit }]),
          ]}
        />
      </div>

      <div className="mt-5 flex flex-wrap gap-2 border-t border-line pt-4">
        {s.status === "new" ? (
          <>
            <StatusButton id={s.id} status="reviewed" label="Mark reviewed" pending="Saving…" primary />
            <StatusButton id={s.id} status="dismissed" label="Dismiss" pending="Saving…" />
          </>
        ) : (
          <StatusButton id={s.id} status="new" label="Move back to review" pending="Saving…" />
        )}
      </div>
    </article>
  );
}

// List on the left, the selected signal on the right. Stacks on small screens.
export function SignalBrowser({
  signals,
  selectedId,
  hrefFor,
  showCompetitor = true,
  footer,
}: {
  signals: SignalRow[];
  selectedId?: string;
  hrefFor: (id: string) => string;
  showCompetitor?: boolean;
  footer?: React.ReactNode;
}) {
  const selected = signals.find((s) => s.id === selectedId) ?? signals[0];
  return (
    <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
      <div className={`${card} overflow-hidden`}>
        <div className="max-h-[70vh] overflow-y-auto">
          <SignalRows signals={signals} selectedId={selected?.id} hrefFor={hrefFor} showCompetitor={showCompetitor} />
        </div>
        {footer && <div className="border-t border-line px-3 py-2.5">{footer}</div>}
      </div>
      <div className="lg:sticky lg:top-6">{selected && <SignalDetail s={selected} />}</div>
    </div>
  );
}
