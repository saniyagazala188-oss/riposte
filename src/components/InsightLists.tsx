import Link from "next/link";
import { setInsightStatus } from "@/app/app/actions";
import { SubmitButton } from "@/components/FormButtons";
import { timeAgo } from "@/lib/time";

export type StoryRow = {
  id: string;
  created_at: string;
  title: string;
  summary: string;
  so_what: string;
  action: string;
  signal_ids: string[];
  status: string;
  competitor_id: string;
  competitors: { name: string } | null;
};
export const STORY_SELECT = "id, created_at, title, summary, so_what, action, signal_ids, status, competitor_id, competitors(name)";

export type TrendRow = {
  id: string;
  created_at: string;
  topic: string;
  summary: string;
  so_what: string;
  action: string;
  competitors: { id: string; name: string; titles: string[] }[];
  status: string;
};
export const TREND_SELECT = "id, created_at, topic, summary, so_what, action, competitors, status";

function StatusButtons({ id, kind, status }: { id: string; kind: "story" | "trend"; status: string }) {
  const btn = (to: string, label: string) => (
    <form action={setInsightStatus}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="kind" value={kind} />
      <input type="hidden" name="status" value={to} />
      <SubmitButton pendingLabel="Saving…">{label}</SubmitButton>
    </form>
  );
  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {status === "new" ? (
        <>
          {btn("reviewed", "Mark reviewed")}
          {btn("dismissed", "Dismiss")}
        </>
      ) : (
        btn("new", "Move back to new")
      )}
    </div>
  );
}

// Several moves by one competitor, joined into one story.
export function StoryList({
  stories,
  signalTitles,
  showCompetitor = false,
  signalHref = (id: string) => `/app?show=all&s=${id}`,
}: {
  stories: StoryRow[];
  signalTitles: Map<string, string>;
  showCompetitor?: boolean;
  signalHref?: (id: string) => string;
}) {
  return (
    <ul className="divide-y divide-line">
      {stories.map((s) => (
        <li key={s.id} className={`px-5 py-5 ${s.status !== "new" ? "opacity-70" : ""}`}>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
            <span className="rounded-full bg-ink px-2 py-0.5 font-semibold text-surface">Connected move</span>
            {showCompetitor && s.competitors && (
              <Link href={`/app/competitors/${s.competitor_id}`} className="font-semibold text-ink hover:underline">
                {s.competitors.name}
              </Link>
            )}
            <span className="text-muted">{s.signal_ids.length} linked signals</span>
            <span className="font-mono text-muted">{timeAgo(s.created_at)}</span>
          </div>
          <h3 className="mt-2 font-display text-lg font-bold leading-snug">{s.title}</h3>
          {s.summary && <p className="mt-1 text-sm">{s.summary}</p>}
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
          <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-muted">The signals it connects</p>
          <ul className="mt-1 flex flex-col gap-1 text-sm">
            {s.signal_ids.map((id) => (
              <li key={id}>
                <Link href={signalHref(id)} className="text-accent hover:underline">
                  {signalTitles.get(id) ?? "A signal"}
                </Link>
              </li>
            ))}
          </ul>
          <StatusButtons id={s.id} kind="story" status={s.status} />
        </li>
      ))}
    </ul>
  );
}

// A topic that several competitors started publishing about.
export function TrendList({ trends }: { trends: TrendRow[] }) {
  return (
    <ul className="divide-y divide-line">
      {trends.map((t) => (
        <li key={t.id} className={`px-5 py-5 ${t.status !== "new" ? "opacity-70" : ""}`}>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
            <span className="rounded-full bg-signal-soft px-2 py-0.5 font-semibold text-signal">Trend</span>
            <span className="text-muted">{t.competitors.length} competitors</span>
            <span className="font-mono text-muted">{timeAgo(t.created_at)}</span>
          </div>
          <h3 className="mt-2 font-display text-lg font-bold leading-snug">{t.topic}</h3>
          {t.summary && <p className="mt-1 text-sm">{t.summary}</p>}
          <dl className="mt-3 grid gap-3 text-sm md:grid-cols-2">
            <div className="min-w-0 rounded-lg bg-bg p-3">
              <dt className="text-xs font-semibold uppercase tracking-wider text-muted">Why it matters to you</dt>
              <dd className="mt-1">{t.so_what}</dd>
            </div>
            <div className="min-w-0 rounded-lg bg-accent-soft p-3">
              <dt className="text-xs font-semibold uppercase tracking-wider text-muted">What to do</dt>
              <dd className="mt-1">{t.action}</dd>
            </div>
          </dl>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {t.competitors.map((c) => (
              <div key={c.id} className="min-w-0 text-sm">
                <Link href={`/app/competitors/${c.id}?tab=content`} className="font-semibold hover:underline">
                  {c.name}
                </Link>
                <ul className="mt-1 flex flex-col gap-0.5 text-muted">
                  {c.titles.map((title) => (
                    <li key={title} className="break-words">“{title}”</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <StatusButtons id={t.id} kind="trend" status={t.status} />
        </li>
      ))}
    </ul>
  );
}
