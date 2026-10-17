import Link from "next/link";
import type { Metadata } from "next";
import { allAuthors } from "@/lib/authors";
import { allPosts } from "@/lib/blog";
import { SITE_URL } from "@/lib/site";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { AuthorAvatar } from "@/components/AuthorAvatar";

export const metadata: Metadata = {
  title: "Authors · Riposte",
  description: "The people who write the Riposte blog.",
  alternates: { canonical: `${SITE_URL}/authors` },
};

export default function AuthorsPage() {
  const authors = allAuthors();
  const posts = allPosts();
  return (
    <div className="min-h-dvh">
      <SiteHeader />
      <section className="border-b border-line bg-[linear-gradient(180deg,var(--accent-soft),var(--bg))]">
        <div className="mx-auto max-w-6xl px-4 pt-14 pb-12 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-accent">Authors</p>
          <h1 className="mt-3 font-display text-4xl font-extrabold tracking-tight sm:text-6xl">
            Who writes the <span className="text-signal">blog</span>
          </h1>
        </div>
      </section>
      <div className="blog-canvas">
        <main className="mx-auto max-w-6xl px-4 py-12 sm:py-16">
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {authors.map((a) => {
              const n = posts.filter((p) => p.author === a.slug).length;
              return (
                <li key={a.slug}>
                  <article className="group relative flex h-full flex-col items-center rounded-3xl border border-line bg-surface p-7 text-center transition hover:-translate-y-0.5 hover:border-accent">
                    <AuthorAvatar name={a.name} initials={a.initials} image={a.image} size={96} />
                    <h2 className="mt-4 font-display text-xl font-bold group-hover:text-accent">
                      <Link href={`/authors/${a.slug}`} className="after:absolute after:inset-0">
                        {a.name}
                      </Link>
                    </h2>
                    <p className="mt-1 text-sm font-semibold text-signal">{a.role}</p>
                    <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-muted">{a.headline}</p>
                    <p className="mt-auto pt-4 text-xs font-semibold text-accent">
                      {n} {n === 1 ? "post" : "posts"} →
                    </p>
                  </article>
                </li>
              );
            })}
          </ul>
        </main>
      </div>
      <SiteFooter />
    </div>
  );
}
