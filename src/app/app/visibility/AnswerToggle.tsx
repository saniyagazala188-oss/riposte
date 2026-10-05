"use client";

import { useState } from "react";

// Who was named, and a clear button to open the full answer.
export function AnswerToggle({ mentions, children }: { mentions: React.ReactNode; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0 flex-1">{mentions}</div>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className={`mt-1.5 shrink-0 rounded-lg border px-2.5 py-1 text-xs font-semibold ${open ? "border-accent text-accent" : "border-line hover:border-muted"}`}
        >
          {open ? "Hide answer" : "Read the answer"}
        </button>
      </div>
      {open && children}
    </div>
  );
}
