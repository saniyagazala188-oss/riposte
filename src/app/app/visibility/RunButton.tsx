"use client";

import { useActionState } from "react";
import { runVisibilityNow } from "./actions";
import type { CheckState } from "@/app/app/actions";
import { primaryButton, secondaryButton } from "@/components/styles";

export function RunButton({ first, count }: { first: boolean; count: number }) {
  const [state, action, pending] = useActionState<CheckState, FormData>(runVisibilityNow, { status: "idle" });
  return (
    <div className="flex flex-col items-start gap-2">
      <form action={action}>
        <button type="submit" disabled={pending} className={first ? primaryButton : secondaryButton}>
          {pending ? "Asking AI search…" : first ? `Ask ${count} prompts now` : "Run again now"}
        </button>
      </form>
      {pending && <p className="text-sm text-muted">Asking each prompt in Gemini with Google Search. About a minute.</p>}
      {!pending && state.message && (
        <p className={`text-sm ${state.status === "error" ? "text-danger" : "text-ink"}`} role="status">
          {state.message}
        </p>
      )}
    </div>
  );
}
