"use client";

import Link from "next/link";
import { useActionState } from "react";
import { writeBrief, type BriefState } from "@/app/app/content/briefs/actions";
import { secondaryButton } from "@/components/styles";

// "Write a content brief" for a trend or an AI answer gap.
export function BriefButton({ source, sourceId, label = "Write a content brief" }: { source: "trend" | "visibility"; sourceId: string; label?: string }) {
  const [state, action, pending] = useActionState<BriefState, FormData>(writeBrief, { status: "idle" });
  if (state.status === "done" && state.briefId) {
    return (
      <Link href={`/app/content/briefs/${state.briefId}`} className={`${secondaryButton} border-accent text-accent`}>
        Brief ready · open it →
      </Link>
    );
  }
  return (
    <div className="flex flex-col items-start gap-1.5">
      <form action={action}>
        <input type="hidden" name="source" value={source} />
        <input type="hidden" name="source_id" value={sourceId} />
        <button type="submit" disabled={pending} className={secondaryButton}>
          {pending ? "Writing the brief…" : label}
        </button>
      </form>
      {pending && <p className="text-xs text-muted">Keyword, intent, angle, outline and FAQs. About 20 seconds.</p>}
      {!pending && state.status === "error" && <p className="text-xs text-danger">{state.message}</p>}
    </div>
  );
}
