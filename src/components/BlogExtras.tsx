"use client";

import { useEffect, useState } from "react";

// A thin bar under the header that fills as you read.
export function ReadingProgress() {
  const [p, setP] = useState(0);
  useEffect(() => {
    const on = () => {
      const el = document.getElementById("post-body");
      if (!el) return;
      const r = el.getBoundingClientRect();
      const total = r.height - window.innerHeight * 0.6;
      setP(Math.min(1, Math.max(0, (window.innerHeight * 0.3 - r.top) / Math.max(1, total))));
    };
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-50 h-1" aria-hidden>
      <div className="h-full origin-left bg-accent transition-[transform] duration-100" style={{ transform: `scaleX(${p})` }} />
    </div>
  );
}

// Share on LinkedIn or X, or copy the link.
export function ShareLinks({ url, title }: { url: string; title: string }) {
  const [copied, setCopied] = useState(false);
  const btn = "grid h-9 w-9 place-items-center rounded-full border border-line bg-surface text-muted transition hover:border-accent hover:text-accent";
  return (
    <div className="flex items-center gap-2">
      <a
        className={btn}
        href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Share on LinkedIn"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
          <path d="M4.98 3.5a2.5 2.5 0 11-.01 5 2.5 2.5 0 01.01-5zM3 9h4v12H3zM9 9h3.8v1.7h.05c.53-1 1.83-2.05 3.77-2.05C20.6 8.65 21 11.2 21 14.5V21h-4v-5.8c0-1.4-.03-3.2-1.95-3.2-1.95 0-2.25 1.52-2.25 3.1V21H9z" />
        </svg>
      </a>
      <a
        className={btn}
        href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Share on X"
      >
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor" aria-hidden>
          <path d="M17.75 3h3.07l-6.7 7.66L22 21h-6.17l-4.83-6.32L5.47 21H2.4l7.17-8.2L2 3h6.33l4.37 5.77L17.75 3zm-1.08 16.2h1.7L7.4 4.72H5.57z" />
        </svg>
      </a>
      <button
        type="button"
        className={btn}
        aria-label="Copy link"
        onClick={() => {
          navigator.clipboard?.writeText(url).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 1600);
          });
        }}
      >
        {copied ? (
          <svg viewBox="0 0 20 20" className="h-4 w-4 text-accent" aria-hidden>
            <path d="M4 10.5l4 4 8-9" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : (
          <svg viewBox="0 0 20 20" className="h-4 w-4" aria-hidden>
            <path
              d="M8.5 11.5a3 3 0 004.2 0l2.6-2.6a3 3 0 00-4.2-4.2l-1 1M11.5 8.5a3 3 0 00-4.2 0l-2.6 2.6a3 3 0 004.2 4.2l1-1"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
            />
          </svg>
        )}
      </button>
    </div>
  );
}

// Copy buttons on code blocks in a post (the button HTML comes from the blog renderer).
export function CopyCode() {
  useEffect(() => {
    const on = (e: MouseEvent) => {
      const btn = (e.target as HTMLElement).closest<HTMLButtonElement>("[data-copy]");
      const code = btn?.parentElement?.querySelector("code");
      if (!btn || !code) return;
      navigator.clipboard.writeText(code.textContent ?? "").then(() => {
        btn.textContent = "Copied";
        setTimeout(() => (btn.textContent = "Copy"), 1600);
      });
    };
    document.addEventListener("click", on);
    return () => document.removeEventListener("click", on);
  }, []);
  return null;
}
