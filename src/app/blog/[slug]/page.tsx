import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { allPosts, formatDate, getPost, relatedPosts, type Post } from "@/lib/blog";
import { ctaHtml } from "@/lib/ctas";
import { AUTHOR, SITE_URL, organizationSchema, personSchema } from "@/lib/site";
import { JsonLd, SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { BlogToc } from "@/components/BlogToc";
import { ReadingProgress, ShareLinks } from "@/components/BlogExtras";

// Two designs for a post: "classic" and "magazine". Pick one in content/blog-settings.json,
// or per post with `layout:` in its settings.

export const dynamicParams = false;

export function generateStaticParams() {
  return allPosts().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const post = getPost((await params).slug);
  if (!post) return {};
  const url = `${SITE_URL}/blog/${post.slug}`;
  const images = post.cover ? [{ url: `${SITE_URL}${post.cover}`, width: 1200, height: 630, alt: post.coverAlt || post.title }] : undefined;
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
      images,
    },
    twitter: { card: post.cover ? "summary_large_image" : "summary", title: post.metaTitle, description: post.description, images: images?.map((i) => i.url) },
  };
}

type Toc = { id: string; text: string; n: string }[];

export default async function BlogPost({ params }: { params: Promise<{ slug: string }> }) {
  const post = getPost((await params).slug);
  if (!post) notFound();
  const url = `${SITE_URL}/blog/${post.slug}`;
  const more = relatedPosts(post);
  const toc: Toc = [
    ...post.headings,
    ...(post.verdict ? [{ id: "bottom-line", text: "The bottom line", n: "✓" }] : []),
    ...(post.faqs.length ? [{ id: "faq", text: "Frequently asked questions", n: "?" }] : []),
  ];

  return (
    <div className="min-h-dvh">
      <SiteHeader />
      {post.layout === "magazine" ? <Magazine post={post} toc={toc} more={more} url={url} /> : <Classic post={post} toc={toc} more={more} />}
      <SiteFooter />
      <Schema post={post} url={url} />
    </div>
  );
}

/* ---------------- Classic ---------------- */

function Classic({ post, toc, more }: { post: Post; toc: Toc; more: Post[] }) {
  return (
    <main className="mx-auto max-w-6xl px-4 pt-6 pb-16">
      <Breadcrumb post={post} />
      <article>
        <header className="mt-5 max-w-3xl">
          <Tags post={post} />
          <h1 className="mt-4 font-display text-4xl font-extrabold leading-[1.08] tracking-tight sm:text-5xl">{post.title}</h1>
          {post.description && <p className="mt-4 text-lg leading-relaxed text-muted sm:text-xl">{post.description}</p>}
          <Byline post={post} />
        </header>

        <Cover post={post} className="mt-8" />

        <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_17rem]">
          <div className="min-w-0 max-w-3xl">
            <QuickAnswer post={post} />
            {toc.length > 2 && (
              <div className="mt-6">
                <BlogToc headings={toc} variant="mobile" />
              </div>
            )}
            <div id="post-body" className="prose-riposte mt-10" dangerouslySetInnerHTML={{ __html: post.html }} />
            <BottomLine post={post} />
            <Faqs post={post} />
            {post.cta && <div className="prose-riposte mt-14" dangerouslySetInnerHTML={{ __html: ctaHtml(post.cta) }} />}
            <AuthorBox className="mt-12" />
          </div>
          {toc.length > 2 && (
            <aside className="hidden lg:block">
              <div className="sticky top-24">
                <BlogToc headings={toc} variant="side" />
              </div>
            </aside>
          )}
        </div>
      </article>
      <RelatedGrid more={more} />
    </main>
  );
}

/* ---------------- Magazine ---------------- */

function Magazine({ post, toc, more, url }: { post: Post; toc: Toc; more: Post[]; url: string }) {
  return (
    <>
      <ReadingProgress />
      <section className="border-b border-line bg-[linear-gradient(180deg,var(--accent-soft),var(--bg))]">
        <div className={`mx-auto max-w-6xl px-4 pt-8 ${post.cover ? "pb-36 sm:pb-48" : "pb-12"}`}>
          <Breadcrumb post={post} />
          <div className="mx-auto mt-8 max-w-3xl text-center">
            <div className="flex justify-center">
              <Tags post={post} />
            </div>
            <h1 className="mt-5 font-display text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl">{post.title}</h1>
            {post.description && <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-muted sm:text-xl">{post.description}</p>}
            <div className="mt-7 flex flex-wrap items-center justify-center gap-x-5 gap-y-3">
              <Byline post={post} center />
              <ShareLinks url={url} title={post.title} />
            </div>
          </div>
        </div>
      </section>

      <div className="blog-canvas">
      <main className="mx-auto max-w-6xl px-4 pb-20">
        {post.cover && <Cover post={post} className="relative z-10 -mt-28 sm:-mt-40" />}

        <div className="mt-12 grid gap-10 lg:grid-cols-[14rem_minmax(0,1fr)] xl:grid-cols-[14rem_minmax(0,1fr)_16rem]">
          {toc.length > 2 ? (
            <aside className="hidden lg:block">
              <div className="sticky top-24">
                <BlogToc headings={toc} variant="side" />
              </div>
            </aside>
          ) : (
            <div className="hidden lg:block" />
          )}

          <article className="min-w-0 rounded-3xl border border-line bg-surface px-5 py-7 shadow-[0_30px_70px_-50px_rgba(14,60,58,0.45)] sm:px-10 sm:py-10">
            {post.summary && (
              <section className="rounded-2xl border border-signal/25 bg-signal-soft p-6" aria-label="Quick answer">
                <p className="text-xs font-semibold uppercase tracking-widest text-signal">In short</p>
                <p className="mt-2 text-[1.05rem] font-medium leading-relaxed">{post.summary}</p>
              </section>
            )}
            {toc.length > 2 && (
              <div className="mt-6">
                <BlogToc headings={toc} variant="mobile" />
              </div>
            )}
            <div id="post-body" className="prose-riposte blog-b mt-10" dangerouslySetInnerHTML={{ __html: post.html }} />
            <BottomLine post={post} />
            <Faqs post={post} />
            {post.cta && <div className="prose-riposte mt-14 xl:hidden" dangerouslySetInnerHTML={{ __html: ctaHtml(post.cta) }} />}
            <AuthorBox className="mt-12 xl:hidden" />
          </article>

          <aside className="hidden xl:block">
            <div className="sticky top-24 flex flex-col gap-5">
              <AuthorBox compact />
              {post.cta && <div className="prose-riposte" dangerouslySetInnerHTML={{ __html: ctaHtml(post.cta, true) }} />}
            </div>
          </aside>
        </div>
      </main>
      </div>

      {more.length > 0 && (
        <section className="border-t border-line bg-surface">
          <div className="mx-auto max-w-6xl px-4 py-14">
            <div className="flex items-end justify-between gap-4">
              <h2 className="font-display text-2xl font-bold">More from the blog</h2>
              <Link href="/blog" className="text-sm font-semibold text-accent hover:underline">
                All posts →
              </Link>
            </div>
            <ul className="mt-6 grid gap-4 md:grid-cols-3">
              {more.map((p) => (
                <li key={p.slug}>
                  <Link href={`/blog/${p.slug}`} className="group flex h-full gap-4 rounded-2xl border border-line bg-bg p-3 transition hover:border-accent md:flex-col">
                    {p.cover && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.cover} alt="" loading="lazy" className="aspect-[1200/630] w-32 shrink-0 rounded-xl border border-line object-cover md:w-full" />
                    )}
                    <div className="min-w-0 md:px-1 md:pb-1">
                      <p className="text-xs font-semibold text-accent">{p.tags[0]}</p>
                      <p className="mt-1 font-display font-bold leading-snug group-hover:text-accent">{p.title}</p>
                      <p className="mt-2 text-xs text-muted">{p.readingMinutes} min read</p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
    </>
  );
}

/* ---------------- Shared pieces ---------------- */

function Breadcrumb({ post }: { post: Post }) {
  return (
    <nav className="flex items-center gap-1.5 text-sm text-muted" aria-label="Breadcrumb">
      <Link href="/blog" className="hover:text-ink">
        Blog
      </Link>
      <span aria-hidden>/</span>
      <span className="text-ink">{post.tags[0] ?? "Article"}</span>
    </nav>
  );
}

function Tags({ post }: { post: Post }) {
  if (!post.tags.length) return null;
  return (
    <ul className="flex flex-wrap gap-2">
      {post.tags.map((t) => (
        <li key={t} className="rounded-full border border-accent/20 bg-accent-soft px-3 py-1 text-xs font-semibold text-accent">
          {t}
        </li>
      ))}
    </ul>
  );
}

function Byline({ post, center = false }: { post: Post; center?: boolean }) {
  return (
    <div className={`flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-muted ${center ? "justify-center" : "mt-6"}`}>
      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-accent font-display text-sm font-bold text-accent-ink" aria-hidden>
        SG
      </span>
      <Link href="/about" className="font-semibold text-ink hover:underline">
        {AUTHOR.name}
      </Link>
      <span aria-hidden>·</span>
      <time dateTime={post.date}>{formatDate(post.date)}</time>
      {post.updated !== post.date && (
        <>
          <span aria-hidden>·</span>
          <span>
            Updated <time dateTime={post.updated}>{formatDate(post.updated)}</time>
          </span>
        </>
      )}
      <span aria-hidden>·</span>
      <span>{post.readingMinutes} min read</span>
    </div>
  );
}

function Cover({ post, className = "" }: { post: Post; className?: string }) {
  if (!post.cover) return null;
  return (
    <div className={`overflow-hidden rounded-3xl border border-line bg-surface shadow-[0_30px_60px_-40px_rgba(14,60,58,0.45)] ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={post.cover} alt={post.coverAlt} width={1200} height={630} className="block h-auto w-full" />
    </div>
  );
}

function QuickAnswer({ post }: { post: Post }) {
  if (!post.summary) return null;
  return (
    <section className="rounded-2xl border border-accent/40 bg-accent-soft p-6" aria-label="Quick answer">
      <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-accent">
        <svg aria-hidden viewBox="0 0 20 20" className="h-4 w-4">
          <path d="M11 2L4 11h5l-1 7 7-9h-5l1-7z" fill="currentColor" />
        </svg>
        Quick answer
      </p>
      <p className="mt-2 text-[1.05rem] leading-relaxed">{post.summary}</p>
    </section>
  );
}

function BottomLine({ post }: { post: Post }) {
  if (!post.verdict) return null;
  return (
    <section id="bottom-line" className="mt-14 scroll-mt-24 rounded-2xl border-2 border-accent bg-surface p-6 sm:p-7">
      <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-accent">
        <span className="grid h-5 w-5 place-items-center rounded-full bg-accent text-[11px] text-accent-ink" aria-hidden>
          ✓
        </span>
        The bottom line
      </p>
      <p className="mt-3 font-display text-xl font-semibold leading-snug sm:text-2xl" dangerouslySetInnerHTML={{ __html: post.verdict }} />
    </section>
  );
}

function Faqs({ post }: { post: Post }) {
  if (!post.faqs.length) return null;
  return (
    <section id="faq" className="mt-14 scroll-mt-24">
      <h2 className="font-display text-2xl font-bold">Frequently asked questions</h2>
      <div className="mt-5 divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
        {post.faqs.map((f, i) => (
          <details key={f.q} className="group" open={i === 0}>
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
  );
}

function AuthorBox({ className = "", compact = false }: { className?: string; compact?: boolean }) {
  return (
    <aside className={`flex ${compact ? "flex-col" : "flex-wrap items-center"} gap-4 rounded-2xl border border-line bg-surface p-5 ${className}`}>
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-accent font-display text-lg font-bold text-accent-ink">SG</div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted">Written by</p>
        <p className="font-semibold">
          <Link href="/about" className="hover:underline">
            {AUTHOR.name}
          </Link>
        </p>
        <p className={`text-sm text-muted ${compact ? "mt-1 line-clamp-4" : ""}`}>{AUTHOR.short}</p>
      </div>
    </aside>
  );
}

function RelatedGrid({ more }: { more: Post[] }) {
  if (!more.length) return null;
  return (
    <section className="mt-20 border-t border-line pt-10">
      <div className="flex items-end justify-between gap-4">
        <h2 className="font-display text-2xl font-bold">Keep reading</h2>
        <Link href="/blog" className="text-sm font-semibold text-accent hover:underline">
          All posts →
        </Link>
      </div>
      <ul className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {more.map((p) => (
          <li key={p.slug}>
            <Link
              href={`/blog/${p.slug}`}
              className="group flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-surface transition hover:-translate-y-0.5 hover:border-accent hover:shadow-[0_20px_40px_-30px_rgba(14,60,58,0.5)]"
            >
              {p.cover && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.cover} alt="" loading="lazy" width={1200} height={630} className="block aspect-[1200/630] w-full border-b border-line object-cover" />
              )}
              <div className="flex flex-1 flex-col p-5">
                <p className="text-xs font-semibold text-accent">{p.tags[0]}</p>
                <p className="mt-1.5 font-display text-lg font-bold leading-snug group-hover:text-accent">{p.title}</p>
                <p className="mt-auto pt-3 text-xs text-muted">
                  {formatDate(p.date)} · {p.readingMinutes} min read
                </p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Schema({ post, url }: { post: Post; url: string }) {
  return (
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
            ...(post.cover ? { image: `${SITE_URL}${post.cover}` } : {}),
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
  );
}
