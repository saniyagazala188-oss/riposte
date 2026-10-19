import Link from "next/link";
import type { Metadata } from "next";
import { docsByCategory } from "@/lib/docs";
import { SITE_URL, organizationSchema } from "@/lib/site";
import { JsonLd, SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { DocsSearch } from "@/components/DocsSearch";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Riposte Docs: how to set up and use Riposte",
  description: "Step-by-step help for every Riposte feature: setup, tracking competitors, signals, action kits, email and Slack alerts, and AI search.",
  alternates: { canonical: `${SITE_URL}/docs` },
  openGraph: { title: "Riposte Docs", description: "How to set up and use every Riposte feature.", url: `${SITE_URL}/docs`, siteName: "Riposte", type: "website" },
};

export default function DocsHome() {
  const cats = docsByCategory();
  const items = cats.flatMap((c) => c.docs.map((d) => ({ slug: d.slug, title: d.title, description: d.description, category: c.title })));
  return (
    <div className="min-h-dvh">
      <SiteHeader />
      <main className="blog-canvas">
        <section className="mx-auto max-w-6xl px-4 pt-14 pb-10 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">Riposte Docs</p>
          <h1 className="mt-3 font-display text-4xl font-extrabold tracking-tight sm:text-5xl">How can we help?</h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-muted">Short, step-by-step guides to set up and use every part of Riposte.</p>
          <DocsSearch items={items} />
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-16" aria-label="Topics">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {cats.map((c) => (
              <div key={c.id} id={c.id} className="flex flex-col rounded-2xl border border-line bg-surface p-6 shadow-sm">
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-accent-soft text-lg" aria-hidden>
                    {c.icon}
                  </span>
                  <h2 className="font-display text-xl font-bold">{c.title}</h2>
                </div>
                <p className="mt-2 text-sm text-muted">{c.description}</p>
                <ul className="mt-4 flex flex-col gap-1.5 border-t border-line pt-4">
                  {c.docs.map((d) => (
                    <li key={d.slug}>
                      <Link href={`/docs/${d.slug}`} className="group flex items-start gap-2 text-[15px] font-medium hover:text-accent">
                        <span className="mt-0.5 text-accent" aria-hidden>
                          →
                        </span>
                        <span className="group-hover:underline">{d.title}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-10 rounded-2xl border border-line bg-surface p-6 text-center">
            <p className="font-display text-lg font-bold">Can&apos;t find what you need?</p>
            <p className="mt-1 text-sm text-muted">
              Tell us in the app under <b>Give feedback</b>, and we&apos;ll answer and add it here. Looking for articles instead?{" "}
              <Link href="/blog" className="font-semibold text-accent underline">
                Read the blog
              </Link>
              .
            </p>
          </div>
        </section>
      </main>
      <SiteFooter />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "CollectionPage",
              "@id": `${SITE_URL}/docs#page`,
              name: "Riposte Docs",
              url: `${SITE_URL}/docs`,
              description: "How to set up and use every Riposte feature.",
              isPartOf: { "@type": "WebSite", name: "Riposte", url: SITE_URL },
              publisher: organizationSchema,
              hasPart: items.map((i) => ({ "@type": "TechArticle", headline: i.title, url: `${SITE_URL}/docs/${i.slug}` })),
            },
            {
              "@type": "BreadcrumbList",
              itemListElement: [
                { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
                { "@type": "ListItem", position: 2, name: "Docs", item: `${SITE_URL}/docs` },
              ],
            },
          ],
        }}
      />
    </div>
  );
}
