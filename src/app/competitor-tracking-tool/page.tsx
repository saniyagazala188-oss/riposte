import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { AUTHOR, SITE_URL, organizationSchema, personSchema } from "@/lib/site";
import { JsonLd, SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { WaitlistForm } from "@/components/WaitlistForm";
import { TourButton } from "@/components/TourButton";

export const dynamic = "force-static";

const URL = `${SITE_URL}/competitor-tracking-tool`;
const UPDATED = "2026-10-21";
const TITLE = "Competitor Tracking Tool for Small Marketing Teams | Riposte";
const DESC =
  "Riposte is a competitor tracking tool that checks competitors' pricing, launches, blogs, news and YouTube every morning, explains each change for your product and drafts the response. Free during the beta.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESC,
  alternates: { canonical: URL },
  openGraph: { title: TITLE, description: DESC, url: URL, siteName: "Riposte", type: "website", images: [{ url: "/video/riposte-hero-poster.jpg" }] },
};

const SHORT_ANSWER =
  "Riposte checks your competitors' pricing pages, release notes, blogs, news and YouTube every morning. It drops the noise, explains each real change for your product, and drafts the response: what to create, who owns it and where it goes.";

const WATCHES = ["Pricing pages", "Release notes", "Blogs and sitemaps", "News coverage", "YouTube channels", "AI answers"];

const STEPS = [
  ["Add your product and competitors", "Describe what you sell, then add a competitor's website. Riposte finds their pricing page, release notes, blog, news and YouTube channel."],
  ["It checks every morning", "Each page is compared with the last check. Timestamps, banners, cookie notices and other noise are ignored."],
  ["You get the change, the reason and the reply", "What changed, why it matters to you, how big it is, and a plan with first drafts, ready before your first meeting."],
];

const FEATURES = [
  {
    title: "Only what matters",
    body: "Most competitor changes are noise. Riposte filters them out and rates the rest high, medium or low impact, so you start with the one change that matters today.",
    img: "/docs/feed/views.jpg",
    alt: "Riposte feed with signals to review and noise filtered out",
  },
  {
    title: "Explained for your product",
    body: "Every change comes with \"why it matters to you\", written from your own product profile and the docs you upload. Not a generic summary of their page.",
    img: "/docs/start/feed.jpg",
    alt: "A Riposte signal explaining a competitor's pricing change",
  },
  {
    title: "A plan, an owner and a first draft",
    body: "Action kits turn a change into tasks: today or this week, who owns it and where it goes, each with a first draft. High-impact changes reach Slack or email the same morning.",
    img: "/docs/kits/kit.jpg",
    alt: "A Riposte action kit with tasks, owners and first drafts",
  },
];

// The honest comparison. Enterprise tools vary, so the column describes the usual picture, not one product.
const COMPARE = {
  cols: ["By hand", "Google Alerts", "Page monitors", "Enterprise tools", "Riposte"],
  rows: [
    ["Setup", "None", "Minutes", "Minutes", "Usually weeks", "Minutes"],
    ["Filters out noise", "You do", "No", "Partly", "Yes", "Yes"],
    ["Explains why it matters", "You do", "No", "No", "Often, with an analyst", "Yes, for your product"],
    ["Drafts the response", "No", "No", "No", "Some do", "Yes"],
    ["Covers news and YouTube", "If you look", "News only", "No", "Usually", "Yes"],
    ["Built for", "Anyone", "Anyone", "Anyone", "Large teams", "Teams of 1 to 5 marketers"],
  ],
};

const WHO = [
  ["Product marketers", "Keep battlecards, positioning and comparison pages current without checking sites by hand."],
  ["Content and SEO leads", "See what competitors publish, which topics are trending and who AI recommends."],
  ["Founders doing marketing", "Know what changed this week in five minutes, with the reply already drafted."],
];

const FAQS = [
  {
    q: "What is a competitor tracking tool?",
    a: "A competitor tracking tool watches your competitors' websites and public channels and tells you when something changes, like a price, a launch or a new page. The useful ones also tell you which changes matter and what to do about them.",
  },
  {
    q: "How does Riposte track competitors?",
    a: "Every morning Riposte checks each competitor's pricing page, release notes, blog and sitemap, news coverage and YouTube channel. It compares them with the last check and turns real changes into signals, each explained for your product.",
  },
  {
    q: "How is Riposte different from Google Alerts?",
    a: "Google Alerts sends you links to news that mentions a name. Riposte also watches competitors' own pages, filters out noise, explains why each change matters to you and drafts the response.",
  },
  {
    q: "How is Riposte different from a page-change monitor?",
    a: "A page monitor tells you that a page changed. Riposte tells you what changed, whether it matters, why it matters for your product, and what to do next.",
  },
  {
    q: "How much does Riposte cost?",
    a: "Riposte is free during the invite-only beta, with 30 days' notice before any pricing starts.",
  },
  {
    q: "How many competitors can I track?",
    a: "Up to 5 competitors during the beta, each with its pricing page, release notes, blog, news and YouTube channel.",
  },
  {
    q: "Can Riposte send competitor alerts to Slack?",
    a: "Yes. High-impact changes go to Slack or email the morning they're found, and a summary of the week arrives every Monday.",
  },
  {
    q: "Does Riposte track competitors on social media?",
    a: "Riposte tracks competitors' YouTube channels today. X and LinkedIn are planned for later.",
  },
];

const btn = "inline-flex items-center justify-center rounded-lg bg-accent px-4 py-2.5 font-semibold text-accent-ink transition hover:brightness-110";

function Band({ text }: { text: string }) {
  return (
    <section className="mx-auto max-w-6xl px-4">
      <div className="flex flex-col items-start gap-4 rounded-2xl bg-accent px-6 py-6 text-accent-ink sm:flex-row sm:items-center sm:justify-between">
        <p className="font-display text-xl font-bold">{text}</p>
        <a href="#join" className="rounded-lg bg-surface px-4 py-2.5 font-semibold text-accent hover:opacity-90">
          Join the free beta
        </a>
      </div>
    </section>
  );
}

export default function CompetitorTrackingTool() {
  return (
    <div className="min-h-dvh">
      <SiteHeader />
      <main>
        {/* 1. Hero: the answer on the left, the product on the right */}
        <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 pt-10 pb-14 lg:grid-cols-[1.05fr_1fr] lg:pt-16">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-widest text-accent">Competitor tracking tool</p>
            <h1 className="mt-3 font-display text-4xl leading-[1.05] font-extrabold tracking-tight sm:text-5xl">
              The competitor tracking tool that tells you what to do
            </h1>
            <p className="mt-5 rounded-xl border-l-4 border-accent bg-accent-soft px-4 py-3 text-lg">{SHORT_ANSWER}</p>
            <div className="mt-6">
              <WaitlistForm id="hero-email" />
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
              <TourButton />
              <span className="text-muted">Free during the beta · no sales call</span>
            </div>
            <p className="mt-5 text-xs text-muted">
              By{" "}
              <Link href={`/authors/${AUTHOR.slug}`} className="font-semibold hover:underline">
                {AUTHOR.name}
              </Link>
              , product marketer · Updated 21 October 2026
            </p>
          </div>
          <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-sm">
            <video
              src="/video/riposte-hero-loop.mp4"
              poster="/video/riposte-hero-poster.jpg"
              autoPlay
              muted
              loop
              playsInline
              aria-label="Riposte spotting a competitor change, explaining it and building an action kit"
              className="block w-full"
            />
          </div>
        </section>

        {/* 2. What it watches */}
        <section className="mx-auto max-w-6xl px-4 pb-14 text-center" aria-labelledby="watches">
          <h2 id="watches" className="text-sm font-semibold uppercase tracking-widest text-muted">
            What Riposte watches
          </h2>
          <ul className="mt-4 flex flex-wrap justify-center gap-2">
            {WATCHES.map((w) => (
              <li key={w} className="rounded-full bg-accent-soft px-4 py-1.5 text-sm font-semibold text-accent">
                {w}
              </li>
            ))}
          </ul>
        </section>

        {/* 3. How it works */}
        <section className="mx-auto max-w-6xl px-4 pb-12" aria-labelledby="how">
          <h2 id="how" className="font-display text-3xl font-bold">
            How it works
          </h2>
          <ol className="mt-6 grid gap-4 md:grid-cols-3">
            {STEPS.map(([t, b], i) => (
              <li key={t} className="rounded-2xl border border-line bg-surface p-5">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-accent text-sm font-bold text-accent-ink">{i + 1}</span>
                <h3 className="mt-3 font-display text-lg font-bold">{t}</h3>
                <p className="mt-1.5 text-muted">{b}</p>
              </li>
            ))}
          </ol>
        </section>

        <Band text="Set it up in 5 minutes. It checks every morning." />

        {/* 4. Features, each with its picture and a nearby button */}
        <section className="mx-auto flex max-w-6xl flex-col gap-14 px-4 py-16" aria-label="Features">
          {FEATURES.map((f, i) => (
            <div key={f.title} className={`grid items-center gap-8 md:grid-cols-2 ${i % 2 ? "md:[&>*:first-child]:order-2" : ""}`}>
              <div>
                <h2 className="font-display text-2xl font-bold sm:text-3xl">{f.title}</h2>
                <p className="mt-3 text-lg text-muted">{f.body}</p>
                <a href="#join" className="mt-4 inline-block font-semibold text-accent hover:underline">
                  Try it free →
                </a>
              </div>
              <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-sm">
                <Image src={f.img} alt={f.alt} width={1500} height={780} className="h-auto w-full" />
              </div>
            </div>
          ))}
        </section>

        {/* 5. The honest comparison */}
        <section className="mx-auto max-w-6xl px-4 pb-12" aria-labelledby="compare">
          <h2 id="compare" className="font-display text-3xl font-bold">
            Riposte vs the usual ways to track competitors
          </h2>
          <p className="mt-2 text-muted">A general picture of each approach. Enterprise tools vary, so check the one you&apos;re considering.</p>
          <div className="mt-6 overflow-x-auto rounded-2xl border border-line bg-surface">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b border-line text-xs uppercase tracking-wider text-muted">
                  <th className="px-4 py-3" />
                  {COMPARE.cols.map((c) => (
                    <th key={c} scope="col" className={`px-4 py-3 ${c === "Riposte" ? "bg-accent-soft text-accent" : ""}`}>
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {COMPARE.rows.map(([label, ...cells]) => (
                  <tr key={label} className="border-b border-line transition-colors last:border-0 hover:bg-signal-soft">
                    <th scope="row" className="px-4 py-3 font-semibold">
                      {label}
                    </th>
                    {cells.map((c, i) => (
                      <td key={i} className={`px-4 py-3 ${i === cells.length - 1 ? "bg-accent-soft/70 font-semibold" : ""}`}>
                        {c}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-right">
            <a href="#join" className="font-semibold text-accent hover:underline">
              Why choose Riposte? Try it free →
            </a>
          </p>
        </section>

        <Band text="See it on your own competitors." />

        {/* 6. Who it's for */}
        <section className="mx-auto max-w-6xl px-4 py-16" aria-labelledby="who">
          <h2 id="who" className="font-display text-3xl font-bold">
            Who it&apos;s for
          </h2>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {WHO.map(([t, b]) => (
              <div key={t} className="rounded-2xl border border-line bg-surface p-5">
                <h3 className="font-display text-lg font-bold">{t}</h3>
                <p className="mt-1.5 text-muted">{b}</p>
              </div>
            ))}
          </div>
          <p className="mt-4 text-sm text-muted">
            Not a fit yet: large teams that need CRM integration or win-loss analysis, and teams that mainly track competitors on X or LinkedIn.
          </p>
        </section>

        {/* 7. Questions (FAQ schema below) */}
        <section className="mx-auto max-w-3xl px-4 pb-16" aria-labelledby="faq">
          <h2 id="faq" className="font-display text-3xl font-bold">
            Questions about competitor tracking
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
          <p className="mt-6 text-sm text-muted">
            Choosing between tools? Read{" "}
            <Link href="/blog/competitive-intelligence-tools" className="font-semibold text-accent hover:underline">
              how to pick a competitive intelligence tool for a small team
            </Link>
            , or see{" "}
            <Link href="/docs" className="font-semibold text-accent hover:underline">
              how each feature works
            </Link>
            .
          </p>
        </section>

        {/* 8. Final call to action */}
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
              "@type": "WebPage",
              "@id": `${URL}#page`,
              url: URL,
              name: TITLE,
              description: DESC,
              dateModified: UPDATED,
              author: personSchema,
              breadcrumb: {
                "@type": "BreadcrumbList",
                itemListElement: [
                  { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
                  { "@type": "ListItem", position: 2, name: "Competitor tracking tool", item: URL },
                ],
              },
            },
            {
              "@type": "SoftwareApplication",
              name: "Riposte",
              url: SITE_URL,
              applicationCategory: "BusinessApplication",
              operatingSystem: "Web",
              description: SHORT_ANSWER,
              offers: { "@type": "Offer", price: "0", priceCurrency: "USD", description: "Free during the invite-only beta" },
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
