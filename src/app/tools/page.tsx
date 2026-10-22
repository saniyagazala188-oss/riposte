import type { Metadata } from "next";
import Link from "next/link";
import { AUTHOR, SITE_URL, organizationSchema, personSchema } from "@/lib/site";
import { JsonLd, SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { WaitlistForm } from "@/components/WaitlistForm";
import { CONTACT_EMAIL } from "@/components/LegalPage";
import { CATEGORIES, FREE_TOOLS, LIVE_TOOLS, toolHref } from "@/lib/freeTools";

export const dynamic = "force-static";

const URL = `${SITE_URL}/tools`;
const TITLE = "Free Tools for Product Marketers: Battlecards, Competitor Research, AI Search | Riposte";
const DESC =
  "Free tools for product marketers and small marketing teams. Make a sales battlecard from any competitor's website, with more tools for competitor research and AI search on the way. No sign-up.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESC,
  alternates: { canonical: URL },
  openGraph: { title: TITLE, description: DESC, url: URL, siteName: "Riposte", type: "website", images: [{ url: "/video/riposte-hero-poster.jpg" }] },
};

const SHORT_ANSWER =
  "Riposte's free tools help product marketers do one job well in under a minute: right now, a battlecard generator that drafts a one-page sales battlecard from any competitor's website. Every tool is free, needs no sign-up, and only uses public pages.";

const FAQS = [
  { q: "Are these tools really free?", a: "Yes. Every tool here is free and needs no sign-up. Each one has a small daily limit so the AI costs stay manageable." },
  { q: "Do you store what I type?", a: "Results aren't saved. To enforce the daily limit, a tool keeps a scrambled (hashed) version of your IP address, the competitor website you entered and the time of the run. Nothing else." },
  { q: "Where does the information come from?", a: "Only from public pages, like a competitor's homepage and pricing page. The tools never guess prices, and each result lists what to check before you share it." },
  { q: "How is this different from Riposte itself?", a: "A free tool gives you a one-time snapshot. Riposte checks your competitors every morning, explains what changed and drafts your response, so your battlecards and pages stay current." },
  { q: "Can I suggest a tool?", a: `Yes, please. Email ${CONTACT_EMAIL} with the job you want done. The most requested ideas get built first.` },
];

export default function ToolsHub() {
  return (
    <div className="blog-canvas min-h-dvh">
      <SiteHeader />
      <main>
        <section className="mx-auto max-w-4xl px-4 pt-10 pb-10 text-center lg:pt-16">
          <p className="text-xs font-semibold uppercase tracking-widest text-accent">Free tools</p>
          <h1 className="mt-3 font-display text-4xl leading-[1.05] font-extrabold tracking-tight sm:text-5xl">Free tools for product marketers</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted">Small tools that each do one job well. Free, no sign-up, built from public pages only.</p>
          <div className="mx-auto mt-6 max-w-3xl rounded-xl border-l-4 border-accent bg-accent-soft px-4 py-3 text-left">
            <p className="text-xs font-semibold uppercase tracking-widest text-accent">Short answer</p>
            <p className="mt-1 text-lg">{SHORT_ANSWER}</p>
          </div>
          <p className="mt-5 text-xs text-muted">
            Made by{" "}
            <Link href={`/authors/${AUTHOR.slug}`} className="font-semibold hover:underline">
              {AUTHOR.name}
            </Link>
            , who builds Riposte · {LIVE_TOOLS.length} live, {FREE_TOOLS.length - LIVE_TOOLS.length} on the way
          </p>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-12" aria-labelledby="all-tools">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 id="all-tools" className="font-display text-2xl font-bold">All free tools</h2>
              <p className="text-sm text-muted">{CATEGORIES.join(" · ")}</p>
            </div>
            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {FREE_TOOLS.map((t) => {
                const live = t.status === "live";
                const body = (
                  <>
                    <div className="flex items-center justify-between gap-2">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${live ? "bg-accent-soft text-accent" : "bg-signal-soft text-ink"}`}>
                        {live ? "Free · live" : "Coming soon"}
                      </span>
                      <span className="text-xs text-muted">{t.time}</span>
                    </div>
                    <p className="mt-4 text-xs font-semibold uppercase tracking-widest text-muted">{t.category}</p>
                    <h3 className="mt-1 font-display text-xl font-bold">{t.name}</h3>
                    <p className="mt-1.5 text-sm text-muted">{t.short}</p>
                    <ul className="mt-4 flex flex-col gap-1.5 text-sm">
                      {t.gives.map((g) => (
                        <li key={g} className="flex gap-2">
                          <span className="text-accent" aria-hidden>
                            ✓
                          </span>
                          {g}
                        </li>
                      ))}
                    </ul>
                    <span className={`mt-5 inline-block font-semibold ${live ? "text-accent group-hover:underline" : "text-muted"}`}>
                      {live ? `Open the ${t.name.toLowerCase()} →` : "Join the beta to hear when it's live ↓"}
                    </span>
                  </>
                );
                return live ? (
                  <Link key={t.slug} href={toolHref(t)} className="group flex flex-col rounded-2xl border border-line bg-surface p-5 transition hover:border-accent hover:shadow-sm">
                    {body}
                  </Link>
                ) : (
                  <a key={t.slug} href="#join" className="flex flex-col rounded-2xl border border-dashed border-line bg-surface/70 p-5 transition hover:border-muted">
                    {body}
                  </a>
                );
              })}
            </div>
          </section>

        <section className="mx-auto max-w-6xl px-4 pb-12">
          <div className="flex flex-col items-start gap-4 rounded-2xl bg-accent px-6 py-6 text-accent-ink sm:flex-row sm:items-center sm:justify-between">
            <p className="font-display text-xl font-bold">A free tool gives you a snapshot. Riposte keeps it current.</p>
            <Link href="/competitor-tracking-tool" className="rounded-lg bg-surface px-4 py-2.5 font-semibold text-accent hover:opacity-90">
              See how Riposte works
            </Link>
          </div>
        </section>

        <section className="mx-auto max-w-3xl px-4 pb-16" aria-labelledby="faq">
          <h2 id="faq" className="font-display text-3xl font-bold">
            Questions about the free tools
          </h2>
          <div className="mt-6 flex flex-col gap-3">
            {FAQS.map((f) => (
              <details key={f.q} className="group rounded-2xl border border-line bg-surface px-5 py-4">
                <summary className="cursor-pointer list-none font-semibold marker:hidden">
                  <h3 className="inline">{f.q}</h3>
                  <span className="float-right text-accent transition group-open:rotate-45" aria-hidden>
                    +
                  </span>
                </summary>
                <p className="mt-3 text-muted">{f.a}</p>
              </details>
            ))}
          </div>
          <div className="mt-6 rounded-2xl border border-line bg-surface p-5">
            <h3 className="font-display text-lg font-bold">Want a tool that isn&apos;t here?</h3>
            <p className="mt-1.5 text-muted">
              Tell me the job you want done:{" "}
              <a href={`mailto:${CONTACT_EMAIL}?subject=Free%20tool%20idea`} className="font-semibold text-accent hover:underline">
                {CONTACT_EMAIL}
              </a>
            </p>
          </div>
        </section>

        <section id="join" className="scroll-mt-20 bg-accent-soft">
          <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-4 py-14 text-center">
            <h2 className="font-display text-3xl font-bold">Get the next free tool first.</h2>
            <p className="max-w-xl text-muted">Join the free Riposte beta. You&apos;ll hear when a new tool goes live, and when your beta spot is ready.</p>
            <WaitlistForm id="join-email" />
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
              author: personSchema,
              breadcrumb: {
                "@type": "BreadcrumbList",
                itemListElement: [
                  { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
                  { "@type": "ListItem", position: 2, name: "Free tools", item: URL },
                ],
              },
              mainEntity: {
                "@type": "ItemList",
                itemListElement: LIVE_TOOLS.map((t, i) => ({ "@type": "ListItem", position: i + 1, name: t.name, url: `${SITE_URL}${toolHref(t)}` })),
              },
            },
            {
              "@type": "FAQPage",
              mainEntity: FAQS.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
            },
          ],
        }}
      />
    </div>
  );
}
