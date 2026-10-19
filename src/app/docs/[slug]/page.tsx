import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { allDocs, docCategories, docsByCategory, getDoc, neighbours, type Doc } from "@/lib/docs";
import { formatDate } from "@/lib/blog";
import { SITE_URL, organizationSchema } from "@/lib/site";
import { JsonLd, SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { BlogToc } from "@/components/BlogToc";
import { CopyCode } from "@/components/BlogExtras";

export const dynamicParams = false;

export function generateStaticParams() {
  return allDocs().map((d) => ({ slug: d.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const doc = getDoc((await params).slug);
  if (!doc) return {};
  const url = `${SITE_URL}/docs/${doc.slug}`;
  return {
    title: doc.metaTitle,
    description: doc.description,
    keywords: doc.keywords,
    alternates: { canonical: url },
    openGraph: { title: doc.metaTitle, description: doc.description, url, type: "article", modifiedTime: doc.updated, siteName: "Riposte" },
    twitter: { card: "summary", title: doc.metaTitle, description: doc.description },
  };
}

export default async function DocPage({ params }: { params: Promise<{ slug: string }> }) {
  const doc = getDoc((await params).slug);
  if (!doc) notFound();
  const cat = docCategories().find((c) => c.id === doc.category);
  const { prev, next } = neighbours(doc.slug);
  const related = doc.related.map((s) => getDoc(s)).filter((d): d is Doc => !!d);
  const toc = [...doc.headings, ...(doc.faqs.length ? [{ id: "faq", text: "Questions", n: "" }] : [])];
  const url = `${SITE_URL}/docs/${doc.slug}`;

  return (
    <div className="min-h-dvh">
      <SiteHeader />
      <main className="blog-canvas">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 pt-8 pb-16 lg:grid-cols-[15rem_minmax(0,1fr)] xl:grid-cols-[15rem_minmax(0,1fr)_14rem]">
          {/* Left: every docs page, by topic */}
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <details className="rounded-2xl border border-line bg-surface p-4 lg:hidden">
              <summary className="cursor-pointer font-semibold">All docs</summary>
              <DocsNav current={doc.slug} />
            </details>
            <div className="hidden max-h-[calc(100dvh-8rem)] overflow-y-auto rounded-2xl border border-line bg-surface p-4 lg:block">
              <Link href="/docs" className="text-xs font-semibold uppercase tracking-[0.16em] text-accent hover:underline">
                Riposte Docs
              </Link>
              <DocsNav current={doc.slug} />
            </div>
          </aside>

          {/* Middle: the article */}
          <article className="min-w-0 rounded-3xl border border-line bg-surface px-5 py-8 shadow-sm sm:px-10">
            <nav aria-label="Breadcrumb" className="text-sm text-muted">
              <ol className="flex flex-wrap items-center gap-1.5">
                <li>
                  <Link href="/docs" className="hover:text-accent">
                    Docs
                  </Link>
                </li>
                <li aria-hidden>/</li>
                <li>
                  <Link href={`/docs#${doc.category}`} className="hover:text-accent">
                    {cat?.title ?? "Docs"}
                  </Link>
                </li>
              </ol>
            </nav>
            <h1 className="mt-4 font-display text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">{doc.title}</h1>
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted">
              {doc.updated && <span>Updated {formatDate(doc.updated)}</span>}
              {doc.appLink && (
                <Link href={doc.appLink.href} className="inline-flex items-center gap-1.5 rounded-full bg-accent px-3.5 py-1.5 text-sm font-semibold text-accent-ink hover:opacity-90">
                  {doc.appLink.label} →
                </Link>
              )}
            </div>

            {doc.summary && (
              <div className="mt-6 rounded-2xl border border-accent/30 bg-accent-soft px-5 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">In short</p>
                <p className="mt-1.5 leading-relaxed">{doc.summary}</p>
              </div>
            )}

            {toc.length > 2 && (
              <div className="mt-6 xl:hidden">
                <BlogToc headings={toc} variant="mobile" />
              </div>
            )}

            <CopyCode />
            <div id="post-body" className="prose-riposte docs-body mt-8" dangerouslySetInnerHTML={{ __html: doc.html }} />

            {doc.faqs.length > 0 && (
              <section id="faq" className="mt-12 scroll-mt-24">
                <h2 className="font-display text-2xl font-bold">Questions</h2>
                <div className="mt-4 divide-y divide-line overflow-hidden rounded-2xl border border-line">
                  {doc.faqs.map((f) => (
                    <details key={f.q} className="group">
                      <summary className="flex cursor-pointer list-none items-start justify-between gap-4 px-5 py-4 font-semibold hover:bg-bg">
                        <h3 className="text-base">{f.q}</h3>
                        <span
                          className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full border border-line text-muted transition group-open:rotate-45 group-open:border-accent group-open:text-accent"
                          aria-hidden
                        >
                          +
                        </span>
                      </summary>
                      <p className="px-5 pb-5 leading-relaxed text-muted">{f.a}</p>
                    </details>
                  ))}
                </div>
              </section>
            )}

            {related.length > 0 && (
              <section className="mt-12" aria-labelledby="related-docs">
                <h2 id="related-docs" className="font-display text-xl font-bold">
                  Related guides
                </h2>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {related.map((r) => (
                    <Link key={r.slug} href={`/docs/${r.slug}`} className="rounded-2xl border border-line p-4 hover:border-accent">
                      <span className="block font-semibold">{r.title}</span>
                      <span className="mt-1 block text-sm text-muted">{r.description}</span>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            <nav className="mt-12 grid gap-3 border-t border-line pt-6 sm:grid-cols-2" aria-label="Previous and next">
              {prev ? (
                <Link href={`/docs/${prev.slug}`} className="rounded-2xl border border-line p-4 hover:border-accent">
                  <span className="block text-xs text-muted">← Previous</span>
                  <span className="mt-1 block font-semibold">{prev.title}</span>
                </Link>
              ) : (
                <span />
              )}
              {next && (
                <Link href={`/docs/${next.slug}`} className="rounded-2xl border border-line p-4 text-right hover:border-accent">
                  <span className="block text-xs text-muted">Next →</span>
                  <span className="mt-1 block font-semibold">{next.title}</span>
                </Link>
              )}
            </nav>
          </article>

          {/* Right: on this page */}
          {toc.length > 2 && (
            <aside className="hidden xl:block">
              <div className="sticky top-24">
                <BlogToc headings={toc} variant="side" />
              </div>
            </aside>
          )}
        </div>
      </main>
      <SiteFooter />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "TechArticle",
              "@id": `${url}#article`,
              headline: doc.title,
              description: doc.description,
              abstract: doc.summary,
              url,
              mainEntityOfPage: url,
              dateModified: doc.updated,
              inLanguage: "en",
              articleSection: cat?.title,
              keywords: doc.keywords.join(", "),
              about: { "@type": "SoftwareApplication", name: "Riposte", applicationCategory: "BusinessApplication", url: SITE_URL },
              author: organizationSchema,
              publisher: organizationSchema,
            },
            {
              "@type": "BreadcrumbList",
              itemListElement: [
                { "@type": "ListItem", position: 1, name: "Docs", item: `${SITE_URL}/docs` },
                { "@type": "ListItem", position: 2, name: cat?.title ?? "Docs", item: `${SITE_URL}/docs#${doc.category}` },
                { "@type": "ListItem", position: 3, name: doc.title, item: url },
              ],
            },
            ...(doc.faqs.length
              ? [
                  {
                    "@type": "FAQPage",
                    mainEntity: doc.faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
                  },
                ]
              : []),
          ],
        }}
      />
    </div>
  );
}

function DocsNav({ current }: { current: string }) {
  return (
    <nav aria-label="Docs" className="mt-3 flex flex-col gap-4 text-sm">
      {docsByCategory().map((c) => (
        <div key={c.id}>
          <p className="mb-1.5 font-semibold">
            <span aria-hidden>{c.icon}</span> {c.title}
          </p>
          <ul className="flex flex-col border-l border-line">
            {c.docs.map((d) => (
              <li key={d.slug}>
                <Link
                  href={`/docs/${d.slug}`}
                  aria-current={d.slug === current ? "page" : undefined}
                  className={`-ml-px block border-l-2 py-1 pl-3 ${
                    d.slug === current ? "border-accent font-semibold text-accent" : "border-transparent text-muted hover:text-ink"
                  }`}
                >
                  {d.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}
