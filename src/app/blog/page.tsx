import Link from "next/link";
import type { Metadata } from "next";
import { allPosts, formatDate } from "@/lib/blog";
import { SITE_URL } from "@/lib/site";
import { JsonLd, SiteFooter, SiteHeader } from "@/components/SiteChrome";

export const metadata: Metadata = {
  title: "Blog · Riposte",
  description: "Practical guides on competitive intelligence, content and AI search for product marketers, from building Riposte in public.",
  alternates: { canonical: `${SITE_URL}/blog` },
  openGraph: { title: "Riposte blog", description: "Competitive intelligence, content and AI search for marketers.", url: `${SITE_URL}/blog`, type: "website" },
};

export default function BlogIndex() {
  const posts = allPosts();
  return (
    <div className="min-h-dvh">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 pt-8 pb-16">
        <p className="text-xs font-semibold uppercase tracking-widest text-accent">Blog</p>
        <h1 className="mt-2 font-display text-4xl font-extrabold tracking-tight">Notes for marketers who respond fast</h1>
        <p className="mt-3 text-lg text-muted">Competitive intelligence, content and AI search, from building Riposte in public.</p>

        <ul className="mt-10 flex flex-col gap-4">
          {posts.map((p) => (
            <li key={p.slug}>
              <Link href={`/blog/${p.slug}`} className="block rounded-2xl border border-line bg-surface p-5 transition hover:border-muted">
                <p className="text-xs text-muted">
                  {formatDate(p.date)} · {p.readingMinutes} min read{p.tags.length ? ` · ${p.tags.join(", ")}` : ""}
                </p>
                <h2 className="mt-1.5 font-display text-xl font-bold leading-snug">{p.title}</h2>
                <p className="mt-1.5 text-muted">{p.description}</p>
              </Link>
            </li>
          ))}
        </ul>
      </main>
      <SiteFooter />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Blog",
          name: "Riposte blog",
          url: `${SITE_URL}/blog`,
          blogPost: posts.map((p) => ({ "@type": "BlogPosting", headline: p.title, url: `${SITE_URL}/blog/${p.slug}`, datePublished: p.date })),
        }}
      />
    </div>
  );
}
