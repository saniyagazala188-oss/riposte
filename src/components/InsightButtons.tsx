"use client";

import { useActionState } from "react";
import { findStoriesAction, findTrendsAction, type CheckState } from "@/app/app/actions";
import { secondaryButton } from "@/components/styles";

function Result({ state }: { state: CheckState }) {
  if (!state.message) return null;
  return (
    <p className={`text-sm ${state.status === "error" ? "text-danger" : "text-ink"}`} role="status">
      {state.message}
    </p>
  );
}

export function FindStoriesButton({ competitorId }: { competitorId: string }) {
  const [state, action, pending] = useActionState<CheckState, FormData>(findStoriesAction, { status: "idle" });
  return (
    <div className="flex flex-col items-start gap-2">
      <form action={action}>
        <input type="hidden" name="competitor_id" value={competitorId} />
        <button type="submit" disabled={pending} className={secondaryButton}>
          {pending ? "Connecting the dots…" : "Find connected moves"}
        </button>
      </form>
      {!pending && <Result state={state} />}
    </div>
  );
}

export function FindTrendsButton() {
  const [state, action, pending] = useActionState<CheckState, FormData>(findTrendsAction, { status: "idle" });
  return (
    <div className="flex flex-col items-start gap-2">
      <form action={action}>
        <button type="submit" disabled={pending} className={secondaryButton}>
          {pending ? "Comparing competitors…" : "Find trends"}
        </button>
      </form>
      {pending && <p className="text-sm text-muted">Reading what every competitor published recently. About 20 seconds.</p>}
      {!pending && <Result state={state} />}
    </div>
  );
}
