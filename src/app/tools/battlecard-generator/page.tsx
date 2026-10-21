import type { Metadata } from "next";
import Link from "next/link";
import { AUTHOR, SITE_URL, organizationSchema, personSchema } from "@/lib/site";
import { JsonLd, SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { BattlecardTool } from "./BattlecardTool";

export const maxDuration = 60; // reading two sites and writing the card can take ~40 seconds

const URL = `${SITE_URL}/tools/battlecard-generator`;
const UPDATED = "2026-10-21";
const TITLE = "Free Battlecard Generator: Sales Battlecard From Any Competitor's Website | Riposte";
const DESC =
  "Free AI battlecard generator. Enter your product and a competitor's website, and get a one-page sales battlecard: who they are, why you win and lose, pricing, objections and questions to ask. No sign-up.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESC,
  alternates: { canonical: URL },
  openGraph: { title: TITLE, description: DESC, url: URL, siteName: "Riposte", type: "website", images: [{ url: "/blog/covers/sales-battlecard-template.jpg" }] },
};

const SHORT_ANSWER =
  "Enter your product and a competitor's website. The generator reads their homepage and pricing page, then drafts a one-page sales battlecard in 8 parts: who they are, who they sell to, why you win, why you lose, pricing, objections with answers, questions to ask, and proof to add. It's free, needs no sign-up, and takes about 30 seconds.";

const PARTS = [
  ["Who they are", "Their product in one or two lines, from their own homepage."],
  ["Who they sell to", "The customers and team sizes they aim at."],
  ["Why we win", "Where your product is stronger, based on what you told it."],
  ["Why we lose", "An honest look at where they're stronger. Reps trust cards that admit this."],
  ["Pricing", "Their plans and prices, only if they're on their pricing page."],
  ["Objections", "What a buyer might say, and a short, honest answer."],
  ["Questions to ask", "Discovery questions that bring out where you're stronger."],
  ["Proof to add", "The customer stories or numbers you should add yourself."],
];

const FAQS = [
  { q: "What is a sales battlecard?", a: "A sales battlecard is a one-page guide that helps reps win deals against one competitor. It covers who the competitor is, why you win and lose, their pricing, common objections with answers and questions to ask on calls." },
  { q: "Is this battlecard generator free?", a: "Yes. It's free, with no sign-up. You can make 3 battlecards a day." },
  { q: "How does the battlecard generator work?", a: "It reads the competitor's homepage and pricing page, plus your own website if you add it. An AI model then drafts the battlecard using only facts from those pages and what you said about your product." },
  { q: "Can I trust an AI-written battlecard?", a: "Treat it as a first draft. It only uses what's on the competitor's own pages, and it lists what it couldn't confirm. Check the facts and add what only your team knows, like real win and loss reasons, before sharing it with sales." },
  { q: "Why does it say the pricing isn't published?", a: "Many companies don't put prices on their website. The generator never guesses a price, so it says so when their pricing page doesn't show one." },
  { q: "How do I keep a battlecard up to date?", a: "Update it within a week of any competitor change to pricing, features or messaging. Riposte checks competitors every morning and drafts the exact battlecard update when something changes." },
  { q: "Do you store what I enter?", a: "No. Your product details are only used to write your card. To limit use, we keep a count of runs per visitor with a scrambled version of the IP address, and the competitor website asked about." },
];

export default function BattlecardGenerator() {
  return (
    <div className="blog-canvas min-h-dvh">
      <SiteHeader />
      <main>
        <section className="mx-auto max-w-3xl px-4 pt-10 pb-10 lg:pt-14">
          <p className="text-xs font-semibold uppercase tracking-widest text-accent">Free tool</p>
          <h1 className="mt-3 font-display text-4xl leading-[1.05] font-extrabold tracking-tight sm:text-5xl">Free battlecard generator</h1>
          <p className="mt-4 text-lg text-muted">A one-page sales battlecard from any competitor&apos;s website, in about 30 seconds.</p>
          <div className="mt-6">
            <BattlecardTool />
          </div>
          <p className="mt-4 text-xs text-muted">
            Made by{" "}
            <Link href={`/authors/${AUTHOR.slug}`} className="font-semibold hover:underline">
              {AUTHOR.name}
            </Link>
            , a product marketer who has written a lot of battlecards · Updated 21 October 2026
          </p>
        </section>

        <section className="mx-auto max-w-3xl px-4 pb-12" aria-labelledby="how">
          <h2 id="how" className="font-display text-3xl font-bold">
            How the battlecard generator works
          </h2>
          <p className="mt-4 rounded-xl border-l-4 border-accent bg-accent-soft px-4 py-3 text-lg">{SHORT_ANSWER}</p>
        </section>

        <section className="mx-auto max-w-5xl px-4 pb-12" aria-labelledby="parts">
          <h2 id="parts" className="font-display text-3xl font-bold">
            What&apos;s in your battlecard
          </h2>
          <ol className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {PARTS.map(([t, b], i) => (
              <li key={t} className="rounded-2xl border border-line bg-surface p-4">
                <span className="grid h-7 w-7 place-items-center rounded-full bg-accent text-xs font-bold text-accent-ink">{i + 1}</span>
                <h3 className="mt-2 font-display font-bold">{t}</h3>
                <p className="mt-1 text-sm text-muted">{b}</p>
              </li>
            ))}
          </ol>
          <p className="mt-4 text-sm text-muted">
            These are the same 8 parts as our{" "}
            <Link href="/blog/sales-battlecard-template" className="font-semibold text-accent hover:underline">
              free sales battlecard template
            </Link>
            , which explains what to write in each.
          </p>
        </section>

        <section className="mx-auto max-w-5xl px-4 pb-12">
          <div className="flex flex-col items-start gap-4 rounded-2xl bg-accent px-6 py-6 text-accent-ink sm:flex-row sm:items-center sm:justify-between">
            <p className="font-display text-xl font-bold">A battlecard is only as good as its last update.</p>
            <Link href="/competitor-tracking-tool" className="rounded-lg bg-surface px-4 py-2.5 font-semibold text-accent hover:opacity-90">
              Keep it current with Riposte
            </Link>
          </div>
        </section>

        <section className="mx-auto max-w-3xl px-4 pb-16" aria-labelledby="faq">
          <h2 id="faq" className="font-display text-3xl font-bold">
            Questions about battlecards
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
            Comparing tools for this?{" "}
            <Link href="/alternatives" className="font-semibold text-accent hover:underline">
              See how competitor tracking tools compare
            </Link>
            .
          </p>
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
                  { "@type": "ListItem", position: 2, name: "Battlecard generator", item: URL },
                ],
              },
            },
            {
              "@type": "WebApplication",
              name: "Riposte Battlecard Generator",
              url: URL,
              applicationCategory: "BusinessApplication",
              operatingSystem: "Web",
              description: SHORT_ANSWER,
              offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
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
