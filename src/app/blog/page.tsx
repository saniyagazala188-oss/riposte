import Link from "next/link";
import type { Metadata } from "next";
import { allPosts, formatDate } from "@/lib/blog";
import { ctaHtml } from "@/lib/ctas";
import { AUTHOR, SITE_URL, personSchema } from "@/lib/site";
import { JsonLd, SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { BlogGrid, type Card } from "@/components/BlogGrid";

export const metadata: Metadata = {
  title: "Blog · Riposte",
  description: "Practical guides on competitive intelligence, content and AI search for product marketers, from building Riposte in public.",
  alternates: { canonical: `${SITE_URL}/blog` },
  openGraph: {
    title: "Riposte blog",
    description: "Competitive intelligence, content and AI search for marketers.",
    url: `${SITE_URL}/blog`,
    type: "website",
    images: [{ url: `${SITE_URL}/blog/covers/what-riposte-does.jpg`, width: 1200, height: 630 }],
  },
};

export default function BlogIndex() {
  const posts = allPosts();
  const featured = posts.find((p) => p.featured) ?? posts[0];
  const rest = posts.filter((p) => p !== featured);
  // Topic buttons: each post's main topic (its first tag).
  const topics = [...new Set(rest.map((p) => p.tags[0]).filter(Boolean))];
  const cards: Card[] = rest.map((p) => ({
    slug: p.slug,
    title: p.title,
    description: p.description,
    tags: p.tags,
    cover: p.cover,
    date: formatDate(p.date),
    iso: p.date,
    minutes: p.readingMinutes,
  }));

  return (
    <div className="min-h-dvh">
      <SiteHeader />

      <section className="border-b border-line bg-[linear-gradient(180deg,var(--accent-soft),var(--bg))]">
        <div className="mx-auto max-w-6xl px-4 pt-14 pb-12 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-accent">The Riposte blog</p>
          <h1 className="mx-auto mt-3 max-w-3xl font-display text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl">
            Notes for marketers who <span className="text-signal">respond fast</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-muted sm:text-xl">
            Competitive intelligence, content and AI search, from building Riposte in public.
          </p>
          <p className="mt-6 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-sm text-muted">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent font-display text-xs font-bold text-accent-ink" aria-hidden>
              SG
            </span>
            <span>
              By{" "}
              <Link href="/about" className="font-semibold text-ink hover:underline">
                {AUTHOR.name}
              </Link>
            </span>
            <span aria-hidden>·</span>
            <span>{posts.length} posts</span>
          </p>
        </div>
      </section>

      <div className="blog-canvas">
        <main className="mx-auto max-w-6xl px-4 py-12 sm:py-16">
          {featured && (
            <section aria-labelledby="featured-title">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted">Start here</p>
              <article className="group relative mt-4 grid overflow-hidden rounded-3xl border border-line bg-surface shadow-[0_30px_70px_-50px_rgba(14,60,58,0.55)] transition hover:border-accent md:grid-cols-[1.15fr_1fr]">
                {featured.cover && (
                  <div className="flex items-center border-b border-line bg-[linear-gradient(135deg,var(--accent-soft),var(--bg))] md:border-r md:border-b-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={featured.cover} alt={featured.coverAlt} width={1200} height={630} className="block h-auto w-full" />
                  </div>
                )}
                <div className="flex flex-col p-6 sm:p-8">
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full bg-signal-soft px-3 py-1 text-xs font-semibold text-signal">Featured</span>
                    {featured.tags.slice(0, 2).map((t) => (
                      <span key={t} className="rounded-full border border-accent/20 bg-accent-soft px-3 py-1 text-xs font-semibold text-accent">
                        {t}
                      </span>
                    ))}
                  </div>
                  <h2 id="featured-title" className="mt-4 font-display text-2xl font-extrabold leading-tight tracking-tight sm:text-3xl group-hover:text-accent">
                    <Link href={`/blog/${featured.slug}`} className="after:absolute after:inset-0">
                      {featured.title}
                    </Link>
                  </h2>
                  <p className="mt-3 leading-relaxed text-muted">{featured.description}</p>
                  <p className="mt-auto flex items-center justify-between gap-3 pt-6 text-sm">
                    <span className="text-muted">
                      <time dateTime={featured.date}>{formatDate(featured.date)}</time> · {featured.readingMinutes} min read
                    </span>
                    <span className="font-semibold text-accent" aria-hidden>
                      Read the post →
                    </span>
                  </p>
                </div>
              </article>
            </section>
          )}

          {cards.length > 0 && (
            <section className="mt-16" aria-labelledby="all-posts">
              <h2 id="all-posts" className="font-display text-2xl font-bold sm:text-3xl">
                All posts
              </h2>
              <p className="mt-1 text-muted">Pick a topic, or read them all.</p>
              <div className="mt-6">
                <BlogGrid posts={cards} topics={topics} />
              </div>
            </section>
          )}

          <div className="prose-riposte mt-16" dangerouslySetInnerHTML={{ __html: ctaHtml("beta") }} />
        </main>
      </div>

      <SiteFooter />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Blog",
          name: "Riposte blog",
          description: "Competitive intelligence, content and AI search for marketers, from building Riposte in public.",
          url: `${SITE_URL}/blog`,
          author: personSchema,
          blogPost: posts.map((p) => ({
            "@type": "BlogPosting",
            headline: p.title,
            description: p.description,
            url: `${SITE_URL}/blog/${p.slug}`,
            datePublished: p.date,
            dateModified: p.updated,
            ...(p.cover ? { image: `${SITE_URL}${p.cover}` } : {}),
            keywords: p.keywords.join(", "),
          })),
        }}
      />
    </div>
  );
}
