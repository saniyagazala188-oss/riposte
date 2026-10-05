"use client";

import { useActionState } from "react";
import { explainAnswer, type ExplainState } from "./actions";
import { primaryButton } from "@/components/styles";

// For answers saved before reasons were read: reads them from the saved answer, once.
export function ExplainButton({ answerId }: { answerId: string }) {
  const [state, action, pending] = useActionState<ExplainState, FormData>(explainAnswer, { status: "idle" });
  return (
    <div className="flex flex-col items-start gap-1.5">
      <form action={action}>
        <input type="hidden" name="answer_id" value={answerId} />
        <button type="submit" disabled={pending} className={primaryButton}>
          {pending ? "Reading the answer…" : "Show the reasons from this answer"}
        </button>
      </form>
      {pending && <p className="text-xs text-muted">Reads why the AI picked each product. About 10 seconds.</p>}
      {!pending && state.status === "error" && <p className="text-xs text-danger">{state.message}</p>}
    </div>
  );
}
