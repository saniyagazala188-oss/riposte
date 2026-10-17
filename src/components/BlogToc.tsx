"use client";

import { useEffect, useState } from "react";

type H = { id: string; text: string; n: string };

// Table of contents. On wide screens it sits beside the post and highlights the section you're reading.
// On phones it's a fold-out "On this page" box above the post.
export function BlogToc({ headings, variant }: { headings: H[]; variant: "side" | "mobile" }) {
  const [active, setActive] = useState(headings[0]?.id);

  useEffect(() => {
    if (variant !== "side") return;
    const els = headings.map((h) => document.getElementById(h.id)).filter((e): e is HTMLElement => !!e);
    const onScroll = () => {
      let cur = els[0]?.id;
      for (const el of els) if (el.getBoundingClientRect().top < 160) cur = el.id;
      setActive(cur);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [headings, variant]);

  const list = (
    <ol className="flex flex-col gap-0.5">
      {headings.map((h) => (
        <li key={h.id}>
          <a
            href={`#${h.id}`}
            className={`flex gap-2.5 rounded-lg px-2.5 py-1.5 text-sm leading-snug transition ${
              variant === "side" && active === h.id ? "bg-accent-soft font-semibold text-ink" : "text-muted hover:bg-bg hover:text-ink"
            }`}
          >
            <span className={`font-mono text-xs leading-5 ${variant === "side" && active === h.id ? "text-accent" : ""}`}>{h.n}</span>
            <span>{h.text}</span>
          </a>
        </li>
      ))}
    </ol>
  );

  if (variant === "mobile")
    return (
      <details className="group rounded-2xl border border-line bg-surface lg:hidden">
        <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-sm font-semibold">
          On this page
          <svg aria-hidden viewBox="0 0 20 20" className="h-4 w-4 text-muted transition group-open:rotate-180">
            <path d="M5 7.5l5 5 5-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </summary>
        <div className="border-t border-line p-2">{list}</div>
      </details>
    );

  return (
    <nav aria-label="On this page" className="rounded-2xl border border-line bg-surface p-3">
      <p className="px-2.5 pb-2 pt-1 text-xs font-semibold uppercase tracking-widest text-muted">On this page</p>
      {list}
    </nav>
  );
}
