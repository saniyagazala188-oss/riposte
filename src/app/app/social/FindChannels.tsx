"use client";

import { useActionState } from "react";
import { findYouTubeChannels, type FormState } from "@/app/app/actions";
import { secondaryButton } from "@/components/styles";

// One click: look for every competitor's YouTube channel on their website.
export function FindChannels() {
  const [state, action, pending] = useActionState<FormState, FormData>(findYouTubeChannels, { status: "idle" });
  return (
    <form action={action} className="mt-3 flex flex-col gap-2">
      <button type="submit" disabled={pending} className={`${secondaryButton} self-start`}>
        {pending ? "Looking on their websites…" : "Find YouTube channels"}
      </button>
      {state.message && <p className={`text-sm ${state.status === "error" ? "text-danger" : "text-muted"}`}>{state.message}</p>}
    </form>
  );
}
