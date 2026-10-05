import Link from "next/link";
import { setActionStatus } from "@/app/app/actions";
import { SubmitButton } from "@/components/FormButtons";
import { DraftToggle } from "@/components/DraftToggle";
import { KIND_LABELS, PRIORITY_LABELS, type Kind, type Priority } from "@/lib/actions/prompt";

export type ActionItemRow = {
  id: string;
  position: number;
  kind: Kind;
  title: string;
  why: string;
  channel: string;
  owner: string;
  priority: Priority;
  draft: string;
  status: "open" | "done";
};

export const ACTION_FIELDS = "id, position, kind, title, why, channel, owner, priority, draft, status";

const PRIORITY_STYLE: Record<Priority, string> = {
  now: "bg-signal-soft text-signal",
  this_week: "bg-accent-soft text-ink",
  later: "border border-line text-muted",
};

// One action: what to create, who owns it, where it goes, and the first draft.
// `compact` is the board version: the column already says the urgency.
export function ActionItemCard({
  item,
  context,
  compact = false,
}: {
  item: ActionItemRow;
  context?: { competitor: string; competitorId: string; signalTitle: string; signalId?: string };
  compact?: boolean;
}) {
  const done = item.status === "done";
  return (
    <div className={`rounded-xl border border-line bg-surface ${compact ? "p-3" : "p-4"} ${done ? "opacity-70" : ""}`}>
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
        {context && (
          <Link
            href={`/app/competitors/${context.competitorId}`}
            className="rounded-full border border-line px-2 py-0.5 font-semibold text-ink hover:border-muted"
          >
            {context.competitor}
          </Link>
        )}
        {!compact && (
          <span className={`rounded-full px-2 py-0.5 font-semibold ${PRIORITY_STYLE[item.priority]}`}>{PRIORITY_LABELS[item.priority]}</span>
        )}
        <span className="font-semibold text-ink">{KIND_LABELS[item.kind]}</span>
      </div>
      <p className={`mt-1.5 font-semibold leading-snug ${compact ? "text-sm" : ""} ${done ? "line-through" : ""}`}>{item.title}</p>
      <p className="mt-1 text-xs text-muted">
        <span className="font-medium text-ink">{item.owner}</span>
        {item.channel && ` · share in ${item.channel}`}
      </p>
      {context && (
        <p className="mt-1 text-xs text-muted">
          Responds to:{" "}
          {context.signalId ? (
            <Link href={`/app?show=all&s=${context.signalId}`} className="hover:text-ink hover:underline">
              {context.signalTitle}
            </Link>
          ) : (
            context.signalTitle
          )}
        </p>
      )}
      {item.why && !compact && <p className="mt-1.5 text-sm text-muted">{item.why}</p>}
      <DraftToggle draft={item.draft} compact={compact}>
        <form action={setActionStatus}>
          <input type="hidden" name="action_id" value={item.id} />
          <input type="hidden" name="status" value={done ? "open" : "done"} />
          <SubmitButton
            pendingLabel="Saving…"
            className={
              done
                ? undefined
                : "inline-flex items-center justify-center rounded-lg bg-accent px-3 py-2 text-sm font-semibold text-accent-ink hover:brightness-110 disabled:opacity-60"
            }
          >
            {done ? "Reopen" : compact ? "Done ✓" : "Mark done ✓"}
          </SubmitButton>
        </form>
      </DraftToggle>
    </div>
  );
}
