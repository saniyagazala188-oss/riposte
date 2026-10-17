import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { SignalBrowser, SIGNAL_SELECT, type SignalRow } from "@/components/SignalList";
import { Empty, PageHeader, Pager, pageNum, withParams } from "@/components/ui";
import { ParamSelect } from "@/components/ui-client";
import { NewsSwitch } from "@/components/NewsSwitch";

export const metadata = { title: "Social media · Riposte" };

// Competitors on social media. YouTube is live; X and LinkedIn are planned
// (X's API is paid, and LinkedIn doesn't let apps read other companies' pages).

const VIDEO_SELECT = SIGNAL_SELECT.replace("changes(", "changes!inner(");
const PER_PAGE = 20;

type Params = { c?: string; s?: string; page?: string };

const PLATFORMS = [
  {
    key: "youtube",
    label: "YouTube",
    live: true,
    icon: "M23 7.5a3 3 0 0 0-2.1-2.1C19 5 12 5 12 5s-7 0-8.9.4A3 3 0 0 0 1 7.5 31 31 0 0 0 .6 12a31 31 0 0 0 .4 4.5 3 3 0 0 0 2.1 2.1C5 19 12 19 12 19s7 0 8.9-.4a3 3 0 0 0 2.1-2.1 31 31 0 0 0 .4-4.5 31 31 0 0 0-.4-4.5zM9.75 15.02V8.98L15.5 12z",
  },
  { key: "x", label: "X (Twitter)", live: false, icon: "M17.75 3h3.07l-6.7 7.66L22 21h-6.17l-4.83-6.32L5.47 21H2.4l7.17-8.2L2 3h6.33l4.37 5.77L17.75 3zm-1.08 16.2h1.7L7.4 4.72H5.57z" },
  {
    key: "linkedin",
    label: "LinkedIn",
    live: false,
    icon: "M4.98 3.5a2.5 2.5 0 11-.01 5 2.5 2.5 0 01.01-5zM3 9h4v12H3zM9 9h3.8v1.7h.05c.53-1 1.83-2.05 3.77-2.05C20.6 8.65 21 11.2 21 14.5V21h-4v-5.8c0-1.4-.03-3.2-1.95-3.2-1.95 0-2.25 1.52-2.25 3.1V21H9z",
  },
] as const;

export default async function SocialPage({ searchParams }: { searchParams: Promise<Params> }) {
  const params = await searchParams;
  const page = pageNum(params.page);
  const { supabase } = await requireUser();

  let list = supabase
    .from("signals")
    .select(VIDEO_SELECT, { count: "exact" })
    .eq("changes.kind", "video")
    .eq("noise", false);
  if (params.c) list = list.eq("competitor_id", params.c);

  const [{ data: competitorRows }, { data: channelRows }, { data: rows, count: total }] = await Promise.all([
    supabase.from("competitors").select("id, name").order("name"),
    supabase.from("sources").select("competitor_id, url, last_status, last_error").eq("type", "youtube"),
    list.order("created_at", { ascending: false }).range((page - 1) * PER_PAGE, page * PER_PAGE - 1),
  ]);
  const competitors = competitorRows ?? [];
  const channels = new Map((channelRows ?? []).map((c) => [c.competitor_id as string, c]));
  const signals = (rows ?? []) as unknown as SignalRow[];
  const watching = competitors.filter((c) => channels.has(c.id));
  const missing = competitors.filter((c) => !channels.has(c.id));

  const link = (change: Partial<Params>) => withParams("/app/social", { c: params.c, ...change });

  return (
    <div>
      <PageHeader
        kicker="News & more"
        title="Competitors on social media"
        description="New videos from your competitors' YouTube channels, checked every morning. Each one is explained for your product, with what to do about it."
      />
      <NewsSwitch active="social" />

      {/* Platforms: YouTube is live, the others are on the way. */}
      <div className="mt-6 flex flex-wrap gap-2" role="list" aria-label="Platforms">
        {PLATFORMS.map((p) =>
          p.live ? (
            <span
              key={p.key}
              role="listitem"
              aria-current="page"
              className="inline-flex items-center gap-2 rounded-full border border-accent bg-accent px-4 py-2 text-sm font-semibold text-accent-ink"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
                <path d={p.icon} />
              </svg>
              {p.label}
              <span className="rounded-full bg-accent-ink/20 px-1.5 text-xs">{total ?? 0}</span>
            </span>
          ) : (
            <span
              key={p.key}
              role="listitem"
              title="Coming soon: we're cooking this one"
              className="inline-flex cursor-not-allowed items-center gap-2 rounded-full border border-dashed border-line bg-surface px-4 py-2 text-sm font-semibold text-muted opacity-80"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
                <path d={p.icon} />
              </svg>
              {p.label}
              <span className="rounded-full bg-signal-soft px-2 py-0.5 text-xs font-semibold text-signal">🍳 Cooking</span>
              <span className="sr-only">(coming soon)</span>
            </span>
          ),
        )}
      </div>
      <p className="mt-2 text-xs text-muted">
        X and LinkedIn are cooking: X charges for its API, and LinkedIn doesn&apos;t let apps read other companies&apos; pages yet. YouTube is live now.
      </p>

      {/* Which competitors' channels are watched */}
      {competitors.length > 0 && (
        <div className="mt-5 rounded-2xl border border-line bg-surface p-4">
          <p className="text-sm font-semibold">
            Watching {watching.length} of {competitors.length} {competitors.length === 1 ? "channel" : "channels"}
          </p>
          <ul className="mt-2 flex flex-wrap gap-2 text-sm">
            {watching.map((c) => {
              const ch = channels.get(c.id)!;
              const failed = ch.last_status === "error" || ch.last_status === "blocked";
              return (
                <li key={c.id}>
                  <a
                    href={ch.url as string}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={failed ? (ch.last_error as string) ?? "The last check didn't work" : "Open their channel"}
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-medium hover:border-accent ${
                      failed ? "border-danger/40 text-danger" : "border-line"
                    }`}
                  >
                    <span className={`h-2 w-2 rounded-full ${failed ? "bg-danger" : "bg-accent"}`} aria-hidden />
                    {c.name}
                  </a>
                </li>
              );
            })}
            {missing.slice(0, 6).map((c) => (
              <li key={c.id}>
                <Link
                  href={`/app/competitors/${c.id}#add-page`}
                  className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-line px-3 py-1 text-muted hover:border-accent hover:text-accent"
                >
                  {c.name}: add channel
                </Link>
              </li>
            ))}
            {missing.length > 6 && <li className="self-center text-xs text-muted">and {missing.length - 6} more without a channel</li>}
          </ul>
          {missing.length > 0 && (
            <p className="mt-2 text-xs text-muted">
              No channel found on their website. Open the competitor and add their YouTube link under &quot;Add a page or channel&quot;, or press &quot;Find pages again&quot;.
            </p>
          )}
        </div>
      )}

      <div className="mt-5">
        {competitors.length > 1 && (
          <div className="mb-3">
            <ParamSelect
              param="c"
              label="Competitor"
              options={[{ value: "", label: "All competitors" }, ...competitors.map((c) => ({ value: c.id, label: c.name }))]}
            />
          </div>
        )}
        {signals.length ? (
          <SignalBrowser
            signals={signals}
            selectedId={params.s}
            hrefFor={(id) => link({ s: id, page: page > 1 ? String(page) : undefined })}
            footer={
              (total ?? 0) > PER_PAGE ? (
                <Pager page={page} perPage={PER_PAGE} total={total ?? 0} href={(n) => link({ page: n > 1 ? String(n) : undefined })} />
              ) : undefined
            }
          />
        ) : (
          <Empty title="No new videos yet.">
            When a competitor posts a video on YouTube, it shows up here the next morning, explained for your product.
          </Empty>
        )}
      </div>
    </div>
  );
}
