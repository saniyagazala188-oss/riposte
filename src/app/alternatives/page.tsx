import type { Metadata } from "next";
import Link from "next/link";
import { AUTHOR, SITE_URL, organizationSchema, personSchema } from "@/lib/site";
import { JsonLd, SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { WaitlistForm } from "@/components/WaitlistForm";
import { TourButton } from "@/components/TourButton";
import { ALTERNATIVES, CHECKED, CHECKED_LABEL, HOW_TO_CHOOSE, TOOLS } from "@/lib/alternatives";

export const dynamic = "force-static";

const URL = `${SITE_URL}/alternatives`;
const TITLE = "Competitive Intelligence Tool Alternatives, Compared (2026) | Riposte";
const DESC =
  "Compare Crayon, Klue, Kompyte, Visualping and Riposte: who each competitor tracking tool is built for, what it tracks and how pricing works. Facts checked on each company's own website.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESC,
  alternates: { canonical: URL },
  openGraph: { title: TITLE, description: DESC, url: URL, siteName: "Riposte", type: "website", images: [{ url: "/video/riposte-hero-poster.jpg" }] },
};

const SHORT_ANSWER =
  "Crayon, Klue and Kompyte are competitive intelligence platforms for larger teams, with battlecards, CRM integrations and pricing by demo or quote. Visualping is a page-change monitor with a free plan. Riposte is a competitor tracking tool for teams of 1 to 5 marketers that explains each change and drafts the response, free during its beta.";

// One row per tool, across the questions people ask first.
const GRID: { key: keyof typeof TOOLS; built: string; explains: string; drafts: string; winloss: string; price: string }[] = [
  { key: "crayon", built: "CI and sales teams at larger companies", explains: "AI summaries, importance score", drafts: "Battlecards you build", winloss: "Yes", price: "By demo" },
  { key: "klue", built: "CI and win-loss teams, sellers", explains: "Auto-generated insights", drafts: "Battlecards, deal support", winloss: "Yes, interviews", price: "By demo" },
  { key: "kompyte", built: "Go-to-market teams", explains: "AI-assisted feed", drafts: "Battlecards, reports", winloss: "Stats from CRM", price: "Quote-based" },
  { key: "visualping", built: "Anyone watching web pages", explains: "Summary of the page change", drafts: "No", winloss: "No", price: "Free plan, paid from $14/mo" },
  { key: "riposte", built: "Teams of 1 to 5 marketers", explains: "Yes, for your product", drafts: "Yes, with owners", winloss: "No", price: "Free during the beta" },
];

export default function AlternativesHub() {
  return (
    <div className="blog-canvas min-h-dvh">
      <SiteHeader />
      <main>
        <section className="mx-auto max-w-4xl px-4 pt-10 pb-12 text-center lg:pt-16">
          <p className="text-xs font-semibold uppercase tracking-widest text-accent">Compare</p>
          <h1 className="mt-3 font-display text-4xl leading-[1.05] font-extrabold tracking-tight sm:text-5xl">Competitor tracking tools, compared honestly</h1>
          <div className="mx-auto mt-6 max-w-3xl rounded-xl border-l-4 border-accent bg-accent-soft px-4 py-3 text-left">
            <p className="text-xs font-semibold uppercase tracking-widest text-accent">Short answer</p>
            <p className="mt-1 text-lg">{SHORT_ANSWER}</p>
          </div>
          <p className="mt-5 text-xs text-muted">
            By{" "}
            <Link href={`/authors/${AUTHOR.slug}`} className="font-semibold hover:underline">
              {AUTHOR.name}
            </Link>
            , who builds Riposte · Facts last checked {CHECKED_LABEL}
          </p>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-12" aria-labelledby="pages">
          <h2 id="pages" className="font-display text-3xl font-bold">
            Looking for an alternative to…
          </h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {ALTERNATIVES.map((a) => (
              <Link key={a.slug} href={`/alternatives/${a.slug}`} className="group rounded-2xl border border-line bg-surface p-5 transition hover:border-accent hover:shadow-sm">
                <h3 className="font-display text-xl font-bold">{a.name}</h3>
                <p className="mt-1.5 text-sm text-muted">{TOOLS[a.slug].what}</p>
                <span className="mt-3 inline-block font-semibold text-accent group-hover:underline">{a.name} alternatives →</span>
              </Link>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-12" aria-labelledby="grid">
          <h2 id="grid" className="font-display text-3xl font-bold">
            All five at a glance
          </h2>
          <p className="mt-2 text-muted">From each company&apos;s own website, checked {CHECKED_LABEL}.</p>
          <div className="mt-6 overflow-x-auto rounded-2xl border border-line bg-surface">
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead>
                <tr className="border-b border-line text-xs uppercase tracking-wider text-muted">
                  <th className="px-4 py-3">Tool</th>
                  <th className="px-4 py-3">Built for</th>
                  <th className="px-4 py-3">Explains why it matters</th>
                  <th className="px-4 py-3">Drafts the response</th>
                  <th className="px-4 py-3">Win/loss</th>
                  <th className="px-4 py-3">Pricing</th>
                </tr>
              </thead>
              <tbody>
                {GRID.map((r) => (
                  <tr key={r.key} className={`border-b border-line transition-colors last:border-0 hover:bg-signal-soft ${r.key === "riposte" ? "bg-accent-soft/70 font-semibold" : ""}`}>
                    <th scope="row" className="px-4 py-3 font-semibold">
                      {TOOLS[r.key].name}
                    </th>
                    <td className="px-4 py-3">{r.built}</td>
                    <td className="px-4 py-3">{r.explains}</td>
                    <td className="px-4 py-3">{r.drafts}</td>
                    <td className="px-4 py-3">{r.winloss}</td>
                    <td className="px-4 py-3">{r.price}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-right">
            <Link href="/competitor-tracking-tool" className="font-semibold text-accent hover:underline">
              Why choose Riposte? See how it works →
            </Link>
          </p>
        </section>

        <section className="mx-auto max-w-6xl px-4">
          <div className="flex flex-col items-start gap-4 rounded-2xl bg-accent px-6 py-6 text-accent-ink sm:flex-row sm:items-center sm:justify-between">
            <p className="font-display text-xl font-bold">See it on your own competitors. It takes 5 minutes.</p>
            <a href="#join" className="rounded-lg bg-surface px-4 py-2.5 font-semibold text-accent hover:opacity-90">
              Join the free beta
            </a>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-16" aria-labelledby="choose">
          <h2 id="choose" className="font-display text-3xl font-bold">
            How to choose
          </h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {HOW_TO_CHOOSE.map(([q, a]) => (
              <div key={q} className="rounded-2xl border border-line bg-surface p-5">
                <h3 className="font-display text-lg font-bold">{q}</h3>
                <p className="mt-1.5 text-muted">{a}</p>
              </div>
            ))}
          </div>
          <p className="mt-6 text-sm text-muted">
            More help:{" "}
            <Link href="/blog/competitive-intelligence-tools" className="font-semibold text-accent hover:underline">
              how to pick a competitive intelligence tool for a small team
            </Link>
            .
          </p>
        </section>

        <section id="join" className="scroll-mt-20 bg-accent-soft">
          <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-4 py-14 text-center">
            <h2 className="font-display text-3xl font-bold">Every competitor move deserves a sharp reply.</h2>
            <p className="max-w-xl text-muted">Join the free beta. I let people in a few at a time, and you&apos;ll get an email when you&apos;re in.</p>
            <WaitlistForm id="join-email" />
            <TourButton />
          </div>
        </section>
      </main>
      <SiteFooter />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            { ...organizationSchema, "@id": `${SITE_URL}/#org` },
            {
              "@type": "CollectionPage",
              "@id": `${URL}#page`,
              url: URL,
              name: TITLE,
              description: DESC,
              dateModified: CHECKED,
              author: personSchema,
              breadcrumb: {
                "@type": "BreadcrumbList",
                itemListElement: [
                  { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
                  { "@type": "ListItem", position: 2, name: "Compare", item: URL },
                ],
              },
              hasPart: ALTERNATIVES.map((a) => ({ "@type": "WebPage", name: `${a.name} alternatives`, url: `${SITE_URL}/alternatives/${a.slug}` })),
            },
          ],
        }}
      />
    </div>
  );
}
