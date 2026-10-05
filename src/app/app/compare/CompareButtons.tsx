"use client";

import { useActionState, useState } from "react";
import { writeComparison } from "./actions";
import type { CheckState } from "@/app/app/actions";
import { primaryButton, secondaryButton } from "@/components/styles";

export function WriteButton({ competitorId, mode }: { competitorId: string; mode: "new" | "update" | "redo" }) {
  const [state, action, pending] = useActionState<CheckState, FormData>(writeComparison, { status: "idle" });
  const label = mode === "new" ? "Write the page" : mode === "update" ? "Update the page" : "Rewrite";
  return (
    <div className="flex flex-col items-start gap-2">
      <form action={action}>
        <input type="hidden" name="competitor_id" value={competitorId} />
        <button type="submit" disabled={pending} className={mode === "redo" ? secondaryButton : primaryButton}>
          {pending ? "Writing…" : label}
        </button>
      </form>
      {pending && <p className="text-sm text-muted">Reading their pricing and recent changes. About 30 seconds.</p>}
      {!pending && state.message && (
        <p className={`text-sm ${state.status === "error" ? "text-danger" : "text-ink"}`} role="status">
          {state.message}
        </p>
      )}
    </div>
  );
}

export function CopyButton({ text }: { text: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      className={secondaryButton}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setDone(true);
          setTimeout(() => setDone(false), 2000);
        } catch {
          setDone(false);
        }
      }}
    >
      {done ? "Copied ✓" : "Copy as Markdown"}
    </button>
  );
}
