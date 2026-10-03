import Link from "next/link";
import { SOURCE_LABELS, type SourceType } from "@/lib/discovery/parse";
import { timeAgo } from "@/lib/time";

export type ChangeRow = {
  id: string;
  kind: "content" | "new_posts" | "new_pages";
  detected_at: string;
  added: unknown[];
  removed: unknown[];
  competitor_id: string;
  competitors: { name: string } | null;
  sources: { type: SourceType; url: string } | null;
};

const SHOW = 8;

function More({ total }: { total: number }) {
  return total > SHOW ? <li className="text-muted">and {total - SHOW} more</li> : null;
}

// The evidence for one change: new posts, new pages, or Before / Now lines.
export function ChangeBody({ change: c }: { change: Pick<ChangeRow, "kind" | "added" | "removed"> }) {
  const added = c.added ?? [];
  const removed = c.removed ?? [];
  return (
    <>
      {c.kind === "new_posts" && (
        <div className="mt-2 text-sm">
          <p className="font-medium">
            {added.length} new {added.length === 1 ? "post" : "posts"}
          </p>
          <ul className="mt-1 flex flex-col gap-1">
            {(added as { title: string; link: string }[]).slice(0, SHOW).map((p) => (
              <li key={p.link || p.title} className="min-w-0">
                {p.link ? (
                  <a href={p.link} target="_blank" rel="noopener noreferrer" className="break-words text-accent hover:underline">
                    {p.title}
                  </a>
                ) : (
                  p.title
                )}
              </li>
            ))}
            <More total={added.length} />
          </ul>
        </div>
      )}

      {c.kind === "new_pages" && (
        <div className="mt-2 text-sm">
          <p className="font-medium">
            {added.length} new {added.length === 1 ? "page" : "pages"} on their site
          </p>
          <ul className="mt-1 flex flex-col gap-1 font-mono text-xs">
            {(added as string[]).slice(0, SHOW).map((u) => (
              <li key={u} className="min-w-0 break-all">
                <a href={u} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
                  {u}
                </a>
              </li>
            ))}
            <More total={added.length} />
          </ul>
        </div>
      )}

      {c.kind === "content" && (
        <div className="mt-2 grid gap-2 text-sm md:grid-cols-2">
          {removed.length > 0 && (
            <div className="min-w-0 rounded-lg bg-bg p-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted">Before</p>
              <ul className="mt-1 flex flex-col gap-1">
                {(removed as string[]).slice(0, SHOW).map((l) => (
                  <li key={l} className="break-words text-danger line-through decoration-1">
                    {l}
                  </li>
                ))}
                <More total={removed.length} />
              </ul>
            </div>
          )}
          {added.length > 0 && (
            <div className="min-w-0 rounded-lg bg-accent-soft p-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted">Now</p>
              <ul className="mt-1 flex flex-col gap-1">
                {(added as string[]).slice(0, SHOW).map((l) => (
                  <li key={l} className="break-words">
                    {l}
                  </li>
                ))}
                <More total={added.length} />
              </ul>
            </div>
          )}
        </div>
      )}
    </>
  );
}

// A list of detected changes that haven't been explained by AI (yet).
export function ChangeList({ changes, showCompetitor = false }: { changes: ChangeRow[]; showCompetitor?: boolean }) {
  return (
    <ul className="divide-y divide-line">
      {changes.map((c) => {
        const label = c.sources ? SOURCE_LABELS[c.sources.type] : "Page";
        return (
          <li key={c.id} className="px-5 py-4">
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1 text-sm">
              {showCompetitor && c.competitors && (
                <Link href={`/app/competitors/${c.competitor_id}`} className="font-semibold hover:underline">
                  {c.competitors.name}
                </Link>
              )}
              <span className={showCompetitor ? "text-muted" : "font-semibold"}>{label}</span>
              <span className="font-mono text-xs text-muted">{timeAgo(c.detected_at)}</span>
              {c.sources && (
                <a href={c.sources.url} target="_blank" rel="noopener noreferrer" className="text-xs text-accent hover:underline">
                  open page ↗
                </a>
              )}
            </div>

            <ChangeBody change={c} />
          </li>
        );
      })}
    </ul>
  );
}

export const CHANGE_SELECT =
  "id, kind, detected_at, added, removed, competitor_id, competitors(name), sources(type, url)";
