"use client";

import Link from "next/link";
import { useState } from "react";

export type Card = {
  slug: string;
  title: string;
  description: string;
  tags: string[];
  cover: string | null;
  date: string; // already formatted
  iso: string;
  minutes: number;
};

// All posts are in the HTML from the start (good for search engines and AI);
// the topic buttons only hide the ones that don't match.
export function BlogGrid({ posts, topics }: { posts: Card[]; topics: string[] }) {
  const [topic, setTopic] = useState<string | null>(null);
  const shown = topic ? posts.filter((p) => p.tags.includes(topic)) : posts;

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filter by topic">
        {[null, ...topics].map((t) => {
          const on = topic === t;
          return (
            <button
              key={t ?? "all"}
              type="button"
              aria-pressed={on}
              onClick={() => setTopic(t)}
              className={`rounded-full border px-3.5 py-1.5 text-sm font-semibold transition ${
                on ? "border-accent bg-accent text-accent-ink" : "border-line bg-surface text-muted hover:border-accent hover:text-accent"
              }`}
            >
              {t ?? "All posts"}
            </button>
          );
        })}
      </div>

      <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {posts.map((p) => (
          <li key={p.slug} className={shown.includes(p) ? "" : "hidden"}>
            <article className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-[0_24px_50px_-40px_rgba(14,60,58,0.55)] transition hover:-translate-y-0.5 hover:border-accent">
              {p.cover && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.cover} alt="" loading="lazy" width={1200} height={630} className="block aspect-[1200/630] w-full border-b border-line object-cover" />
              )}
              <div className="flex flex-1 flex-col p-5">
                <p className="text-xs font-semibold text-accent">{p.tags[0]}</p>
                <h2 className="mt-1.5 font-display text-lg font-bold leading-snug group-hover:text-accent">
                  <Link href={`/blog/${p.slug}`} className="after:absolute after:inset-0">
                    {p.title}
                  </Link>
                </h2>
                <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted">{p.description}</p>
                <p className="mt-auto pt-4 text-xs text-muted">
                  <time dateTime={p.iso}>{p.date}</time> · {p.minutes} min read
                </p>
              </div>
            </article>
          </li>
        ))}
      </ul>
      {shown.length === 0 && <p className="mt-8 text-muted">No posts on this topic yet.</p>}
    </div>
  );
}
