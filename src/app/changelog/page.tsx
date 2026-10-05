import type { Metadata } from "next";
import { CHANGELOG, type ChangeEntry } from "@/lib/changelog";
import { SITE_URL } from "@/lib/site";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";

export const metadata: Metadata = {
  title: "Changelog · Riposte",
  description: "Every step of building Riposte in public, from the first plan to today, with dates and times.",
  alternates: { canonical: `${SITE_URL}/changelog` },
};

const KIND: Record<ChangeEntry["kind"], { label: string; cls: string }> = {
  launch: { label: "Launch", cls: "bg-accent text-accent-ink" },
  feature: { label: "Improvement", cls: "bg-accent-soft text-ink" },
  fix: { label: "Fix", cls: "bg-signal-soft text-signal" },
  decision: { label: "Milestone", cls: "border border-line text-muted" },
};

const day = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Kolkata" });
const time = (iso: string) =>
  new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Asia/Kolkata" });

export default function ChangelogPage() {
  const days: { day: string; entries: ChangeEntry[] }[] = [];
  for (const e of CHANGELOG) {
    const d = day(e.at);
    const g = days.find((x) => x.day === d);
    if (g) g.entries.push(e);
    else days.push({ day: d, entries: [e] });
  }

  return (
    <div className="min-h-dvh">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 pt-8 pb-16">
        <p className="text-xs font-semibold uppercase tracking-widest text-accent">Changelog</p>
        <h1 className="mt-2 font-display text-4xl font-extrabold tracking-tight">Built in public</h1>
        <p className="mt-3 text-lg text-muted">
          Every step from the first plan to today. Nine phases, each tested live before the next. Times are India time (IST).
        </p>

        <div className="mt-10 flex flex-col gap-10">
          {days.map((g) => (
            <section key={g.day}>
              <h2 className="sticky top-0 z-10 bg-bg py-2 font-display text-lg font-bold">{g.day}</h2>
              <ol className="mt-2 border-l-2 border-line">
                {g.entries.map((e) => (
                  <li key={e.at + e.title} className="relative pb-6 pl-6 last:pb-0">
                    <span className="absolute -left-[7px] top-1.5 h-3 w-3 rounded-full border-2 border-bg bg-accent" aria-hidden />
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      {!e.dateOnly && <time dateTime={e.at} className="font-mono text-muted">{time(e.at)}</time>}
                      <span className={`rounded-full px-2 py-0.5 font-semibold ${KIND[e.kind].cls}`}>{KIND[e.kind].label}</span>
                      {e.phase && <span className="font-semibold text-accent">{e.phase}</span>}
                    </div>
                    <h3 className="mt-1 font-semibold">{e.title}</h3>
                    <p className="mt-0.5 text-sm text-muted">{e.body}</p>
                  </li>
                ))}
              </ol>
            </section>
          ))}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
