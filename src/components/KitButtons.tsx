"use client";

import { useActionState, useState } from "react";
import { buildActionKit, type CheckState } from "@/app/app/actions";
import { primaryButton, secondaryButton } from "@/components/styles";

// Asks the AI to build (or rebuild) the action kit for one signal.
export function BuildKitButton({ signalId, redo = false }: { signalId: string; redo?: boolean }) {
  const [state, action, pending] = useActionState<CheckState, FormData>(buildActionKit, { status: "idle" });
  return (
    <div className="flex flex-col items-start gap-2">
      <form action={action}>
        <input type="hidden" name="signal_id" value={signalId} />
        {redo && <input type="hidden" name="redo" value="1" />}
        <button type="submit" disabled={pending} className={redo ? secondaryButton : primaryButton}>
          {pending ? "Writing the drafts…" : redo ? "Rebuild open actions" : "Build action kit"}
        </button>
      </form>
      {pending && <p className="text-sm text-muted">Deciding what to create, who owns it and writing first drafts. About 20 seconds.</p>}
      {!pending && state.status === "error" && (
        <p className="text-sm text-danger" role="status">
          {state.message}
        </p>
      )}
    </div>
  );
}

// Copies a draft to the clipboard.
export function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className={secondaryButton}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } catch {
          setCopied(false);
        }
      }}
    >
      {copied ? "Copied ✓" : "Copy draft"}
    </button>
  );
}
