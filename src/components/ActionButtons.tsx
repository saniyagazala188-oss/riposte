"use client";

import { useActionState } from "react";
import { explainPending, sendTest, type CheckState } from "@/app/app/actions";
import { primaryButton, secondaryButton } from "@/components/styles";

function Status({ state }: { state: CheckState }) {
  if (!state.message) return null;
  return (
    <p className={`text-sm ${state.status === "error" ? "text-danger" : "text-ink"}`} role="status">
      {state.message}
    </p>
  );
}

// Asks the AI to explain changes that are still waiting.
export function ExplainPendingButton() {
  const [state, action, pending] = useActionState<CheckState, FormData>(explainPending, { status: "idle" });
  return (
    <div className="flex flex-col items-start gap-2">
      <form action={action}>
        <button type="submit" disabled={pending} className={primaryButton}>
          {pending ? "Explaining…" : "Explain them now"}
        </button>
      </form>
      {!pending && <Status state={state} />}
    </div>
  );
}

// Sends a test email, test Slack message, or this week's digest to the signed-in user.
export function SendTestButton({ what, label }: { what: "email" | "slack" | "digest"; label: string }) {
  const [state, action, pending] = useActionState<CheckState, FormData>(sendTest, { status: "idle" });
  return (
    <div className="flex flex-col items-start gap-2">
      <form action={action}>
        <input type="hidden" name="what" value={what} />
        <button type="submit" disabled={pending} className={secondaryButton}>
          {pending ? "Sending…" : label}
        </button>
      </form>
      {!pending && <Status state={state} />}
    </div>
  );
}
