import type { Metadata } from "next";
import { CHANGELOG } from "@/lib/changelog";
import { SITE_URL } from "@/lib/site";
import { JsonLd, SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { ChangelogView, KIND, type Day, type Entry, type Kind, type Week } from "@/components/ChangelogView";

export const metadata: Metadata = {
  title: "Changelog · Riposte",
  description: "Every step of building Riposte in public, from the first plan to today, with dates and times.",
  alternates: { canonical: `${SITE_URL}/changelog` },
};

const TZ = "Asia/Kolkata";
const fmt = (iso: string, o: Intl.DateTimeFormatOptions) => new Date(iso).toLocaleString("en-GB", { ...o, timeZone: TZ });
// India date as YYYY-MM-DD
const ymd = (iso: string) => new Date(new Date(iso).getTime() + 5.5 * 3600e3).toISOString().slice(0, 10);
const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

function mondayOf(d: string) {
  const t = new Date(`${d}T00:00:00Z`);
  const back = (t.getUTCDay() + 6) % 7;
  t.setUTCDate(t.getUTCDate() - back);
  return t.toISOString().slice(0, 10);
}
const short = (d: string, o: Intl.DateTimeFormatOptions) =>
  new Date(`${d}T00:00:00Z`).toLocaleDateString("en-GB", { ...o, timeZone: "UTC" }).replace(/\bSept\b/, "Sep");

export default function ChangelogPage() {
  const weeks: Week[] = [];
  const counts: Record<Kind, number> = { launch: 0, feature: 0, fix: 0, decision: 0 };
  const today = ymd(new Date().toISOString());
  const thisMonday = mondayOf(today);

  for (const e of CHANGELOG) {
    counts[e.kind]++;
    const d = ymd(e.at);
    const mon = mondayOf(d);
    let w = weeks.find((x) => x.id === `week-${mon}`);
    if (!w) {
      const sun = new Date(`${mon}T00:00:00Z`);
      sun.setUTCDate(sun.getUTCDate() + 6);
      const end = sun.toISOString().slice(0, 10);
      w = {
        id: `week-${mon}`,
        label: mon === thisMonday ? "This week" : `Week of ${short(mon, { day: "numeric", month: "long" })}`,
        range: `${short(mon, { day: "numeric", month: "short" })} to ${short(end, { day: "numeric", month: "short", year: "numeric" })}`,
        days: [],
        count: 0,
      };
      weeks.push(w);
    }
    const label = fmt(e.at, { weekday: "long", day: "numeric", month: "long" });
    let day: Day | undefined = w.days.find((x) => x.label === label);
    if (!day) {
      day = { label, short: d, entries: [] };
      w.days.push(day);
    }
    const entry: Entry = {
      id: `${d}-${slug(e.title)}`,
      time: e.dateOnly ? null : fmt(e.at, { hour: "2-digit", minute: "2-digit", hour12: false }),
      iso: e.at,
      kind: e.kind,
      phase: e.phase,
      title: e.title,
      body: e.body,
    };
    day.entries.push(entry);
    w.count++;
  }

  const first = ymd(CHANGELOG[CHANGELOG.length - 1].at);
  const last = ymd(CHANGELOG[0].at);
  const daysBuilding = Math.round((Date.parse(last) - Date.parse(first)) / 86400e3) + 1;
  const phases = CHANGELOG.filter((e) => e.phase)
    .slice()
    .reverse()
    .map((e) => ({ phase: e.phase!, title: e.title, id: `${ymd(e.at)}-${slug(e.title)}` }));

  // "Phase 6a/6b/6c" count as one phase.
  const phaseCount = new Set(phases.map((p) => p.phase.match(/\d+/)?.[0])).size;

  const stats: { n: number; label: string; cls: string }[] = [
    { n: daysBuilding, label: "days of building", cls: "text-ink" },
    { n: counts.launch, label: "launches", cls: "text-accent" },
    { n: counts.feature, label: "improvements", cls: "text-[#2f8c83]" },
    { n: counts.fix, label: "fixes", cls: "text-signal" },
  ];

  return (
    <div className="min-h-dvh">
      <SiteHeader />

      <section className="border-b border-line bg-[linear-gradient(180deg,var(--accent-soft),var(--bg))]">
        <div className="mx-auto max-w-6xl px-4 pt-14 pb-12 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-accent">Changelog</p>
          <h1 className="mt-3 font-display text-4xl font-extrabold tracking-tight sm:text-6xl">
            Built <span className="text-signal">in public</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-muted">
            Every step from the first plan to today. {phaseCount ? `${phaseCount} phases, each tested live before the next. ` : ""}Times are India time
            (IST).
          </p>
          <dl className="mx-auto mt-8 grid max-w-3xl grid-cols-2 gap-3 sm:grid-cols-4">
            {stats.map((s) => (
              <div key={s.label} className="rounded-2xl border border-line bg-surface px-4 py-4">
                <dd className={`font-display text-3xl font-extrabold ${s.cls}`}>{s.n}</dd>
                <dt className="mt-1 text-xs font-semibold uppercase tracking-wider text-muted">{s.label}</dt>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <div className="blog-canvas">
        <main className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:py-16 lg:grid-cols-[15rem_minmax(0,1fr)]">
          <aside className="hidden lg:block">
            <div className="sticky top-24 flex flex-col gap-5">
              <nav aria-label="Weeks" className="rounded-2xl border border-line bg-surface p-3">
                <p className="px-2.5 pb-2 pt-1 text-xs font-semibold uppercase tracking-widest text-muted">Weeks</p>
                <ol className="flex flex-col gap-0.5">
                  {weeks.map((w) => (
                    <li key={w.id}>
                      <a href={`#${w.id}`} className="flex items-center justify-between rounded-lg px-2.5 py-1.5 text-sm text-muted hover:bg-bg hover:text-ink">
                        <span>{w.label}</span>
                        <span className="text-xs">{w.count}</span>
                      </a>
                    </li>
                  ))}
                </ol>
              </nav>
              {phases.length > 0 && (
                <nav aria-label="Build phases" className="rounded-2xl border border-line bg-surface p-3">
                  <p className="px-2.5 pb-2 pt-1 text-xs font-semibold uppercase tracking-widest text-muted">The build phases</p>
                  <ol className="flex flex-col gap-0.5">
                    {phases.map((p) => (
                      <li key={p.id}>
                        <a href={`#${p.id}`} className="flex gap-2.5 rounded-lg px-2.5 py-1.5 text-sm leading-snug text-muted hover:bg-bg hover:text-ink">
                          <span className="shrink-0 font-mono text-xs leading-5 text-accent">{p.phase.replace("Phase ", "P")}</span>
                          <span>{p.title}</span>
                        </a>
                      </li>
                    ))}
                  </ol>
                </nav>
              )}
              <div className="flex flex-wrap gap-x-3 gap-y-1.5 px-1 text-xs text-muted">
                {(Object.keys(KIND) as Kind[]).map((k) => (
                  <span key={k} className="flex items-center gap-1.5">
                    <span className={`h-2 w-2 rounded-full ${KIND[k].dot}`} aria-hidden />
                    {KIND[k].label}
                  </span>
                ))}
              </div>
            </div>
          </aside>

          <div className="min-w-0">
            <ChangelogView weeks={weeks} counts={counts} />
          </div>
        </main>
      </div>

      <SiteFooter />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: "Riposte changelog",
          url: `${SITE_URL}/changelog`,
          description: "Every step of building Riposte in public, with dates and times.",
          dateModified: CHANGELOG[0].at,
        }}
      />
    </div>
  );
}
