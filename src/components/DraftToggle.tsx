"use client";

import { useState } from "react";
import { secondaryButton } from "@/components/styles";
import { CopyButton } from "@/components/KitButtons";

// A clear "Show draft" button (instead of a small disclosure link), with Copy next to it.
export function DraftToggle({ draft, children, compact = false }: { draft: string; children?: React.ReactNode; compact?: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-3">
      <div className="flex flex-wrap gap-1.5">
        <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} className={`${secondaryButton} ${open ? "border-accent text-accent" : ""}`}>
          {open ? (compact ? "Hide" : "Hide draft") : compact ? "Draft" : "Show draft"}
        </button>
        <CopyButton text={draft} label={compact ? "Copy" : undefined} />
        {children}
      </div>
      {open && (
        <pre className="mt-3 max-h-96 overflow-auto rounded-lg bg-bg p-3 font-sans text-sm whitespace-pre-wrap break-words">{draft}</pre>
      )}
    </div>
  );
}
