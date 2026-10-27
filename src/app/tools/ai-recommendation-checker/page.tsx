import type { Metadata } from "next";
import Link from "next/link";
import { AUTHOR, SITE_URL, organizationSchema, personSchema } from "@/lib/site";
import { JsonLd, SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { AiCheckTool } from "./AiCheckTool";

export const maxDuration = 60; // three grounded AI answers run in parallel, about 30 to 50 seconds

const URL = `${SITE_URL}/tools/ai-recommendation-checker`;
const UPDATED = "2026-10-27";
const TITLE = "Does AI Recommend You? Free AI Recommendation Checker for Your Brand | Riposte";
const DESC =
  "Free AI recommendation checker. Enter your product and see if AI search names you when buyers ask for a tool like yours: who gets recommended instead, and which sites the answers trust. No sign-up.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESC,
  alternates: { canonical: URL },
  openGraph: { title: TITLE, description: DESC, url: URL, siteName: "Riposte", type: "website", images: [{ url: "/video/riposte-hero-poster.jpg" }] },
};

const SHORT_ANSWER =
  "Enter your product's name, website and what it does. The checker writes 3 questions a real buyer would ask an AI assistant, without naming any brand, and asks each one in Gemini with Google Search. You see which brands each answer recommends, whether yours is one of them and in what position, and which sites the answers relied on. It's free, needs no sign-up, and takes under a minute.";

const STEPS = [
  ["Writes buyer questions", "Three questions your buyers would type, with no brand names, so the answer isn't steered."],
  ["Asks AI search", "Each question goes to Gemini with live Google Search, the engine behind Google's AI answers."],
  ["Finds who's named", "Every brand in each answer, in the order it appears, with yours highlighted."],
  ["Shows the sources", "The sites each answer leaned on. These are the pages to get listed on."],
];

const FAQS = [
  { q: "How do I know if AI recommends my brand?", a: "Ask an AI assistant the questions your buyers ask, without naming your brand, and see whether you're in the answer. This checker does that for 3 buyer questions at once and shows who gets named instead, and which sites the answers relied on." },
  { q: "Is this AI recommendation checker free?", a: "Yes. It's free, with no sign-up. You can run 2 checks a day, because each check runs 3 live AI searches." },
  { q: "Which AI does it check?", a: "Gemini with Google Search turned on, which reads the live web like Google's AI answers do. ChatGPT, Perplexity and others can answer differently, so treat this as one strong signal, not the full picture." },
  { q: "Why isn't my brand recommended by AI?", a: "Usually because the sites AI trusts for your category, like review sites, \"best tools\" lists and forums, don't mention you yet, or because no page clearly answers the buyer's question with your product in it. The result shows which sites the answers used, so you know where to start." },
  { q: "How do I get recommended by ChatGPT and other AI tools?", a: "Get listed on the review sites and roundups AI already cites for your category, publish pages that answer buyer questions in their first line, and keep comparison pages honest and current. Then check again weekly, since answers change often." },
  { q: "Will I get the same result every time?", a: "Not always. AI answers vary between runs and change as the web changes. One check is a snapshot. Riposte runs the same questions every week so you can see the trend." },
  { q: "Do you store what I enter?", a: "No. Your details are only used to write the questions and read the answers. To limit use, we keep a count of runs per visitor with a scrambled version of the IP address, and the website you checked." },
];

export default function AiRecommendationChecker() {
  return (
    <div className="blog-canvas min-h-dvh">
      <SiteHeader />
      <main>
        <section className="mx-auto max-w-3xl px-4 pt-10 pb-10 lg:pt-14">
          <nav aria-label="Breadcrumb" className="text-xs font-semibold uppercase tracking-widest text-accent">
            <Link href="/tools" className="hover:underline">
              Free tools
            </Link>{" "}
            <span aria-hidden className="text-muted">/</span> AI recommendation checker
          </nav>
          <h1 className="mt-3 font-display text-4xl leading-[1.05] font-extrabold tracking-tight sm:text-5xl">Does AI recommend you?</h1>
          <p className="mt-4 text-lg text-muted">See if AI search names your product when buyers ask for a tool like yours, and who it picks instead. Under a minute.</p>
          <div className="mt-6">
            <AiCheckTool />
          </div>
          <p className="mt-4 text-xs text-muted">
            Made by{" "}
            <Link href={`/authors/${AUTHOR.slug}`} className="font-semibold hover:underline">
              {AUTHOR.name}
            </Link>
            , who tracks AI answers for Riposte every week · Updated 27 October 2026
          </p>
        </section>

        <section className="mx-auto max-w-3xl px-4 pb-12" aria-labelledby="how">
          <h2 id="how" className="font-display text-3xl font-bold">
            How the AI recommendation checker works
          </h2>
          <p className="mt-4 rounded-xl border-l-4 border-accent bg-accent-soft px-4 py-3 text-lg">{SHORT_ANSWER}</p>
        </section>

        <section className="mx-auto max-w-5xl px-4 pb-12" aria-labelledby="parts">
          <h2 id="parts" className="font-display text-3xl font-bold">
            What the checker does
          </h2>
          <ol className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map(([t, b], i) => (
              <li key={t} className="rounded-2xl border border-line bg-surface p-4">
                <span className="grid h-7 w-7 place-items-center rounded-full bg-accent text-xs font-bold text-accent-ink">{i + 1}</span>
                <h3 className="mt-2 font-display font-bold">{t}</h3>
                <p className="mt-1 text-sm text-muted">{b}</p>
              </li>
            ))}
          </ol>
          <p className="mt-4 text-sm text-muted">
            This is a one-time version of{" "}
            <Link href="/blog/riposte-ai-visibility" className="font-semibold text-accent hover:underline">
              Riposte&apos;s AI visibility tracking
            </Link>
            , which runs your questions every week and writes a brief for each gap.
          </p>
        </section>

        <section className="mx-auto max-w-5xl px-4 pb-12">
          <div className="flex flex-col items-start gap-4 rounded-2xl bg-accent px-6 py-6 text-accent-ink sm:flex-row sm:items-center sm:justify-between">
            <p className="font-display text-xl font-bold">AI answers change every week. Riposte tracks them for you.</p>
            <Link href="/competitor-tracking-tool" className="rounded-lg bg-surface px-4 py-2.5 font-semibold text-accent hover:opacity-90">
              See how Riposte works
            </Link>
          </div>
        </section>

        <section className="mx-auto max-w-3xl px-4 pb-16" aria-labelledby="faq">
          <h2 id="faq" className="font-display text-3xl font-bold">
            Questions about AI recommendations
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
            . Or browse{" "}
            <Link href="/tools" className="font-semibold text-accent hover:underline">
              all free tools
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
                  { "@type": "ListItem", position: 2, name: "Free tools", item: `${SITE_URL}/tools` },
                  { "@type": "ListItem", position: 3, name: "AI recommendation checker", item: URL },
                ],
              },
            },
            {
              "@type": "WebApplication",
              name: "Riposte AI Recommendation Checker",
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
