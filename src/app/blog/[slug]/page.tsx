import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { allPosts, formatDate, getPost } from "@/lib/blog";
import { AUTHOR, SITE_URL, organizationSchema, personSchema } from "@/lib/site";
import { JsonLd, SiteFooter, SiteHeader } from "@/components/SiteChrome";

export const dynamicParams = false;

export function generateStaticParams() {
  return allPosts().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const post = getPost((await params).slug);
  if (!post) return {};
  const url = `${SITE_URL}/blog/${post.slug}`;
  return {
    title: post.metaTitle,
    description: post.description,
    keywords: post.keywords,
    authors: [{ name: AUTHOR.name, url: `${SITE_URL}/about` }],
    alternates: { canonical: url },
    openGraph: {
      title: post.metaTitle,
      description: post.description,
      url,
      type: "article",
      publishedTime: post.date,
      modifiedTime: post.updated,
      authors: [AUTHOR.name],
      siteName: "Riposte",
    },
    twitter: { card: "summary", title: post.metaTitle, description: post.description },
  };
}

export default async function BlogPost({ params }: { params: Promise<{ slug: string }> }) {
  const post = getPost((await params).slug);
  if (!post) notFound();
  const url = `${SITE_URL}/blog/${post.slug}`;
  const others = allPosts().filter((p) => p.slug !== post.slug).slice(0, 2);

  return (
    <div className="min-h-dvh">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 pt-6 pb-16">
        <nav className="text-sm text-muted" aria-label="Breadcrumb">
          <Link href="/blog" className="hover:text-ink">
            Blog
          </Link>{" "}
          / <span className="text-ink">{post.tags[0] ?? "Article"}</span>
        </nav>

        <article>
          <header className="mt-4">
            <h1 className="font-display text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">{post.title}</h1>
            <p className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted">
              <Link href="/about" className="font-semibold text-ink hover:underline">
                {AUTHOR.name}
              </Link>
              <span>·</span>
              <time dateTime={post.date}>{formatDate(post.date)}</time>
              {post.updated !== post.date && (
                <>
                  <span>·</span>
                  <span>
                    Updated <time dateTime={post.updated}>{formatDate(post.updated)}</time>
                  </span>
                </>
              )}
              <span>·</span>
              <span>{post.readingMinutes} min read</span>
            </p>
          </header>

          {post.summary && (
            <section className="mt-7 rounded-2xl border border-accent bg-accent-soft p-5" aria-label="Quick answer">
              <p className="text-xs font-semibold uppercase tracking-widest text-accent">Quick answer</p>
              <p className="mt-2 leading-relaxed">{post.summary}</p>
            </section>
          )}

          {post.headings.length > 2 && (
            <nav className="mt-7 rounded-2xl border border-line p-5 text-sm" aria-label="On this page">
              <p className="font-semibold">On this page</p>
              <ol className="mt-2 flex flex-col gap-1 text-muted">
                {post.headings.map((h) => (
                  <li key={h.id}>
                    <a href={`#${h.id}`} className="hover:text-ink hover:underline">
                      {h.text}
                    </a>
                  </li>
                ))}
                {post.faqs.length > 0 && (
                  <li>
                    <a href="#faq" className="hover:text-ink hover:underline">
                      Frequently asked questions
                    </a>
                  </li>
                )}
              </ol>
            </nav>
          )}

          <div className="prose-riposte mt-8" dangerouslySetInnerHTML={{ __html: post.html }} />

          {post.faqs.length > 0 && (
            <section id="faq" className="mt-12 scroll-mt-6">
              <h2 className="font-display text-2xl font-bold">Frequently asked questions</h2>
              <div className="mt-4 flex flex-col gap-3">
                {post.faqs.map((f) => (
                  <details key={f.q} className="group rounded-xl border border-line bg-surface p-4" open>
                    <summary className="cursor-pointer list-none font-semibold">{f.q}</summary>
                    <p className="mt-2 text-muted">{f.a}</p>
                  </details>
                ))}
              </div>
            </section>
          )}

          <aside className="mt-12 flex flex-wrap items-center gap-4 rounded-2xl border border-line bg-surface p-5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-accent font-display text-lg font-bold text-accent-ink">
              SG
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold">
                <Link href="/about" className="hover:underline">
                  {AUTHOR.name}
                </Link>
              </p>
              <p className="text-sm text-muted">{AUTHOR.short}</p>
            </div>
          </aside>
        </article>

        {others.length > 0 && (
          <section className="mt-12">
            <h2 className="font-display text-xl font-bold">Keep reading</h2>
            <ul className="mt-3 grid gap-3 sm:grid-cols-2">
              {others.map((p) => (
                <li key={p.slug}>
                  <Link href={`/blog/${p.slug}`} className="block h-full rounded-xl border border-line bg-surface p-4 hover:border-muted">
                    <p className="font-semibold leading-snug">{p.title}</p>
                    <p className="mt-1 text-sm text-muted">{p.readingMinutes} min read</p>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>
      <SiteFooter />

      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "BlogPosting",
              headline: post.title,
              description: post.description,
              abstract: post.summary,
              datePublished: post.date,
              dateModified: post.updated,
              keywords: post.keywords.join(", "),
              mainEntityOfPage: url,
              url,
              author: personSchema,
              publisher: organizationSchema,
            },
            ...(post.faqs.length
              ? [
                  {
                    "@type": "FAQPage",
                    mainEntity: post.faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
                  },
                ]
              : []),
            {
              "@type": "BreadcrumbList",
              itemListElement: [
                { "@type": "ListItem", position: 1, name: "Blog", item: `${SITE_URL}/blog` },
                { "@type": "ListItem", position: 2, name: post.title, item: url },
              ],
            },
          ],
        }}
      />
    </div>
  );
}
