"use client";

import { useState } from "react";
import { secondaryButton } from "@/components/styles";

// The invite message, folded away behind a preview, with a one-click copy.
export function CopyInvite({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-3">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          className={secondaryButton}
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(text);
              setCopied(true);
              setTimeout(() => setCopied(false), 2500);
            } catch {
              setOpen(true);
            }
          }}
        >
          {copied ? "Copied ✓" : "Copy the invite message"}
        </button>
        <button type="button" onClick={() => setOpen((v) => !v)} className="text-sm font-medium text-accent hover:underline">
          {open ? "Hide message" : "Preview message"}
        </button>
      </div>
      {open && <pre className="mt-2 whitespace-pre-wrap rounded-lg border border-line bg-surface p-3 font-sans text-sm">{text}</pre>}
    </div>
  );
}
