"use client";

import { useActionState } from "react";
import { analyseTopics, type CheckState } from "@/app/app/actions";
import { primaryButton, secondaryButton } from "@/components/styles";

export function TopicsButton({ competitorId, refresh = false }: { competitorId: string; refresh?: boolean }) {
  const [state, action, pending] = useActionState<CheckState, FormData>(analyseTopics, { status: "idle" });
  return (
    <div className="flex flex-col items-start gap-2">
      <form action={action}>
        <input type="hidden" name="competitor_id" value={competitorId} />
        <button type="submit" disabled={pending} className={refresh ? secondaryButton : primaryButton}>
          {pending ? "Reading their content…" : refresh ? "Refresh topics" : "Find their topics"}
        </button>
      </form>
      {pending && <p className="text-sm text-muted">Grouping their posts into topics. About 20 seconds.</p>}
      {!pending && state.message && (
        <p className={`text-sm ${state.status === "error" ? "text-danger" : "text-ink"}`} role="status">
          {state.message}
        </p>
      )}
    </div>
  );
}
