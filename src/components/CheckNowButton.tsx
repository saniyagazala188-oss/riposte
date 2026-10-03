"use client";

import { useActionState } from "react";
import { checkNow, type CheckState } from "@/app/app/actions";
import { primaryButton } from "@/components/styles";

export function CheckNowButton({ competitorId }: { competitorId: string }) {
  const [state, action, pending] = useActionState<CheckState, FormData>(checkNow, { status: "idle" });

  return (
    <div className="flex flex-col items-start gap-2 sm:items-end">
      <form action={action}>
        <input type="hidden" name="competitor_id" value={competitorId} />
        <button type="submit" disabled={pending} className={primaryButton}>
          {pending ? "Checking pages…" : "Check now"}
        </button>
      </form>
      {pending && <p className="text-sm text-muted">Reading each page. This can take up to a minute.</p>}
      {!pending && state.message && (
        <p className={`max-w-sm text-sm sm:text-right ${state.status === "error" ? "text-danger" : "text-ink"}`} role="status">
          {state.message}
        </p>
      )}
    </div>
  );
}
