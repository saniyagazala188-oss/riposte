"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type Item = { slug: string; title: string; description: string; category: string };

// Search box on /docs: filters every docs page by its title, description and category as you type.
export function DocsSearch({ items }: { items: Item[] }) {
  const [q, setQ] = useState("");
  const hits = useMemo(() => {
    const words = q.toLowerCase().split(/\s+/).filter(Boolean);
    if (!words.length) return [];
    return items.filter((i) => words.every((w) => `${i.title} ${i.description} ${i.category}`.toLowerCase().includes(w))).slice(0, 8);
  }, [q, items]);

  return (
    <div className="relative mx-auto mt-7 max-w-xl text-left">
      <label htmlFor="docs-search" className="sr-only">
        Search the docs
      </label>
      <input
        id="docs-search"
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search, for example Slack, action kit, YouTube…"
        autoComplete="off"
        className="w-full rounded-2xl border border-line bg-surface px-5 py-4 text-base shadow-sm outline-none focus:border-accent"
      />
      {q.trim() && (
        <div className="absolute inset-x-0 top-full z-20 mt-2 overflow-hidden rounded-2xl border border-line bg-surface shadow-lg">
          {hits.length ? (
            <ul>
              {hits.map((h) => (
                <li key={h.slug}>
                  <Link href={`/docs/${h.slug}`} className="block px-5 py-3 hover:bg-bg">
                    <span className="block font-semibold">{h.title}</span>
                    <span className="block text-sm text-muted">{h.category}</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-5 py-4 text-sm text-muted">Nothing found. Try another word, or browse the topics below.</p>
          )}
        </div>
      )}
    </div>
  );
}
