import Link from "next/link";
import { setActionStatus } from "@/app/app/actions";
import { SubmitButton } from "@/components/FormButtons";
import { CopyButton } from "@/components/KitButtons";
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
export function ActionItemCard({
  item,
  context,
}: {
  item: ActionItemRow;
  context?: { competitor: string; competitorId: string; signalTitle: string };
}) {
  const done = item.status === "done";
  return (
    <div className={`rounded-xl border border-line bg-surface p-4 ${done ? "opacity-60" : ""}`}>
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
        {context && (
          <Link
            href={`/app/competitors/${context.competitorId}`}
            className="rounded-full border border-line px-2 py-0.5 font-semibold text-ink hover:border-muted"
          >
            {context.competitor}
          </Link>
        )}
        <span className={`rounded-full px-2 py-0.5 font-semibold ${PRIORITY_STYLE[item.priority]}`}>
          {PRIORITY_LABELS[item.priority]}
        </span>
        <span className="font-semibold text-ink">{KIND_LABELS[item.kind]}</span>
        <span className="text-muted">Owner: {item.owner}</span>
        {item.channel && <span className="text-muted">Share in: {item.channel}</span>}
      </div>
      <p className={`mt-2 font-semibold ${done ? "line-through" : ""}`}>{item.title}</p>
      {context && <p className="mt-0.5 text-xs text-muted">Responds to: {context.signalTitle}</p>}
      {item.why && <p className="mt-1 text-sm text-muted">{item.why}</p>}
      <details className="mt-3">
        <summary className="cursor-pointer select-none text-sm text-accent hover:underline">See the first draft</summary>
        <pre className="mt-2 max-h-96 overflow-auto rounded-lg bg-bg p-3 font-sans text-sm whitespace-pre-wrap break-words">{item.draft}</pre>
      </details>
      <div className="mt-3 flex flex-wrap gap-2">
        <CopyButton text={item.draft} />
        <form action={setActionStatus}>
          <input type="hidden" name="action_id" value={item.id} />
          <input type="hidden" name="status" value={done ? "open" : "done"} />
          <SubmitButton pendingLabel="Saving…">{done ? "Reopen" : "Mark done"}</SubmitButton>
        </form>
      </div>
    </div>
  );
}
