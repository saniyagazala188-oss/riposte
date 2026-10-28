import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { isAdmin } from "@/lib/access";
import { createAdminClient } from "@/lib/supabase/admin";
import { mockEnabled } from "@/lib/supabase/mock";
import { allPosts } from "@/lib/blog";
import { PURPOSE_LABEL, type Bot } from "@/lib/aiBots";
import { card, eyebrow, secondaryButton } from "@/components/styles";
import { Empty, PageHeader } from "@/components/ui";
import { timeAgo } from "@/lib/time";

export const metadata = { title: "AI bot visits · Admin · Riposte" };
export const dynamic = "force-dynamic";

type Visit = { bot: string; company: string; purpose: Bot["purpose"]; path: string; created_at: string };

const DAY = 24 * 3600 * 1000;
const fmt = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "Asia/Kolkata" });
const daysAfter = (from: string, to: string) => Math.max(0, Math.round((new Date(to).getTime() - new Date(`${from}T00:00:00+05:30`).getTime()) / DAY));

// Which AI crawlers and search bots visit useriposte.com, and how soon after a post goes live.
export default async function AiBotsPage() {
  const { user } = await requireUser();
  if (!isAdmin(user.email)) redirect("/app");
  const db = createAdminClient();
  const { data, error } = db
    ? await db
        .from("bot_visits")
        .select("bot, company, purpose, path, created_at")
        .gte("created_at", new Date(Date.now() - 90 * DAY).toISOString())
        .order("created_at", { ascending: true })
        .limit(10000)
    : { data: null, error: null };
  const visits = mockEnabled() ? sampleVisits() : ((data ?? []) as Visit[]);
  const ai = visits.filter((v) => v.purpose !== "search-engine");
  const last30 = ai.filter((v) => Date.now() - new Date(v.created_at).getTime() < 30 * DAY);

  const byBot = new Map<string, { company: string; purpose: Bot["purpose"]; n: number; last: string }>();
  for (const v of visits) {
    const b = byBot.get(v.bot) ?? { company: v.company, purpose: v.purpose, n: 0, last: v.created_at };
    b.n++;
    b.last = v.created_at;
    byBot.set(v.bot, b);
  }
  const bots = [...byBot.entries()].sort((a, b) => b[1].n - a[1].n);

  const firstOn = (path: string, test: (v: Visit) => boolean) => visits.find((v) => v.path === path && test(v));
  const posts = allPosts()
    .map((p) => {
      const path = `/blog/${p.slug}`;
      return {
        p,
        path,
        firstAi: firstOn(path, (v) => v.purpose !== "search-engine"),
        firstUser: firstOn(path, (v) => v.purpose === "user"),
        google: firstOn(path, (v) => v.bot === "Googlebot"),
        bing: firstOn(path, (v) => v.bot === "Bingbot"),
        aiCount: ai.filter((v) => v.path === path).length,
      };
    })
    .sort((a, b) => b.p.date.localeCompare(a.p.date));

  const cell = (v: Visit | undefined, date: string) =>
    v ? (
      <>
        <span className="font-semibold">{daysAfter(date, v.created_at)}d</span>{" "}
        <span className="text-muted">
          {v.bot} · {fmt(v.created_at)}
        </span>
      </>
    ) : (
      <span className="text-muted">not yet</span>
    );

  return (
    <div>
      <PageHeader
        kicker="Admin · only you see this"
        title="AI bot visits"
        description="Which AI crawlers and search bots read useriposte.com, and how many days after a post went live they first came. Only the bot's name, the page and the time are saved."
        actions={
          <Link href="/app/admin" className={secondaryButton}>
            ← Beta access
          </Link>
        }
      />

      {error ? (
        <div className="mt-6">
          <Empty title="Couldn't read bot visits.">Has migration 0022 been run in Supabase?</Empty>
        </div>
      ) : !visits.length ? (
        <div className="mt-6">
          <Empty title="No bot visits yet.">Logging starts once this update is live. Check back tomorrow: crawlers usually visit within a day.</Empty>
        </div>
      ) : (
        <>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className={`${card} p-4`}>
              <p className={eyebrow}>AI bot visits, 30 days</p>
              <p className="mt-1 font-display text-3xl font-bold">{last30.length}</p>
            </div>
            <div className={`${card} p-4`}>
              <p className={eyebrow}>Read live for someone&apos;s question</p>
              <p className="mt-1 font-display text-3xl font-bold">{last30.filter((v) => v.purpose === "user").length}</p>
              <p className="text-xs text-muted">ChatGPT-User, Claude-User, Perplexity-User…</p>
            </div>
            <div className={`${card} p-4`}>
              <p className={eyebrow}>Blog posts an AI bot has read</p>
              <p className="mt-1 font-display text-3xl font-bold">
                {posts.filter((x) => x.firstAi).length} <span className="text-lg text-muted">of {posts.length}</span>
              </p>
            </div>
          </div>

          <section className={`${card} mt-6 overflow-x-auto`}>
            <h2 className="border-b border-line px-5 py-3 font-display text-lg font-bold">Blog posts: days from publishing to first visit</h2>
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs uppercase tracking-widest text-muted">
                  <th className="px-5 py-2 font-semibold">Post</th>
                  <th className="px-3 py-2 font-semibold">Published</th>
                  <th className="px-3 py-2 font-semibold">First AI bot</th>
                  <th className="px-3 py-2 font-semibold">First live read</th>
                  <th className="px-3 py-2 font-semibold">Googlebot</th>
                  <th className="px-3 py-2 font-semibold">Bingbot</th>
                  <th className="px-3 py-2 text-right font-semibold">AI visits</th>
                </tr>
              </thead>
              <tbody>
                {posts.map((x) => (
                  <tr key={x.path} className="border-b border-line last:border-0">
                    <td className="max-w-[260px] px-5 py-2.5">
                      <Link href={x.path} className="font-semibold hover:underline">
                        {x.p.title}
                      </Link>
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap text-muted">{fmt(`${x.p.date}T12:00:00+05:30`)}</td>
                    <td className="px-3 py-2.5">{cell(x.firstAi, x.p.date)}</td>
                    <td className="px-3 py-2.5">{cell(x.firstUser, x.p.date)}</td>
                    <td className="px-3 py-2.5">{cell(x.google, x.p.date)}</td>
                    <td className="px-3 py-2.5">{cell(x.bing, x.p.date)}</td>
                    <td className="px-3 py-2.5 text-right">{x.aiCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="px-5 py-3 text-xs text-muted">
              Counts start from the day logging went live, so older posts show their first visit after that day, not their real first visit.
            </p>
          </section>

          <section className={`${card} mt-6`}>
            <h2 className="border-b border-line px-5 py-3 font-display text-lg font-bold">Bots, last 90 days</h2>
            <ul className="divide-y divide-line">
              {bots.map(([name, b]) => (
                <li key={name} className="flex flex-wrap items-center justify-between gap-2 px-5 py-2.5 text-sm">
                  <span>
                    <span className="font-semibold">{name}</span> <span className="text-muted">· {b.company} · {PURPOSE_LABEL[b.purpose]}</span>
                  </span>
                  <span className="text-muted">
                    {b.n} visit{b.n === 1 ? "" : "s"} · last {timeAgo(b.last)}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <section className={`${card} mt-6`}>
            <h2 className="border-b border-line px-5 py-3 font-display text-lg font-bold">Latest AI bot visits</h2>
            <ul className="divide-y divide-line">
              {ai
                .slice(-30)
                .reverse()
                .map((v, i) => (
                  <li key={`${v.created_at}-${i}`} className="flex flex-wrap items-center justify-between gap-2 px-5 py-2 text-sm">
                    <span>
                      <span className="font-semibold">{v.bot}</span> <span className="text-muted">read</span> {v.path}
                    </span>
                    <span className="text-muted">{timeAgo(v.created_at)}</span>
                  </li>
                ))}
            </ul>
          </section>
        </>
      )}
    </div>
  );
}

// Local preview only: made-up visits so the page can be checked without real traffic.
function sampleVisits(): Visit[] {
  const posts = allPosts().slice(0, 4);
  const at = (date: string, days: number) => new Date(new Date(`${date}T10:00:00+05:30`).getTime() + days * DAY).toISOString();
  const rows: Visit[] = [];
  posts.forEach((p, i) => {
    const path = `/blog/${p.slug}`;
    rows.push({ bot: "Googlebot", company: "Google", purpose: "search-engine", path, created_at: at(p.date, 0) });
    rows.push({ bot: "OAI-SearchBot", company: "OpenAI", purpose: "search", path, created_at: at(p.date, 1 + i) });
    if (i < 2) rows.push({ bot: "ChatGPT-User", company: "OpenAI", purpose: "user", path, created_at: at(p.date, 3 + i) });
    if (i < 3) rows.push({ bot: "ClaudeBot", company: "Anthropic", purpose: "training", path, created_at: at(p.date, 2 + i * 2) });
    if (i === 0) rows.push({ bot: "Bingbot", company: "Microsoft", purpose: "search-engine", path, created_at: at(p.date, 4) });
  });
  rows.push({ bot: "PerplexityBot", company: "Perplexity", purpose: "search", path: "/tools/ai-recommendation-checker", created_at: new Date(Date.now() - 3 * 3600e3).toISOString() });
  rows.push({ bot: "GPTBot", company: "OpenAI", purpose: "training", path: "/llms.txt", created_at: new Date(Date.now() - 5 * 3600e3).toISOString() });
  return rows.filter((r) => new Date(r.created_at).getTime() < Date.now()).sort((a, b) => a.created_at.localeCompare(b.created_at));
}
