"use client";

import { useActionState, useEffect, useRef } from "react";
import { addSource, type FormState } from "@/app/app/actions";
import { SOURCE_LABELS, type SourceType } from "@/lib/discovery/parse";
import { inputClass, primaryButton } from "@/components/styles";

const TYPES = Object.keys(SOURCE_LABELS) as SourceType[];

export function AddSourceForm({ competitorId }: { competitorId: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(addSource, { status: "idle" });
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.status === "saved") formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={action} className="flex flex-col gap-3">
      <input type="hidden" name="competitor_id" value={competitorId} />
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="source-type" className="text-sm font-semibold">
            Type of page
          </label>
          <select id="source-type" name="type" defaultValue="pricing" className={inputClass}>
            {TYPES.map((t) => (
              <option key={t} value={t}>
                {SOURCE_LABELS[t]}
              </option>
            ))}
          </select>
        </div>
        <div className="flex min-w-0 flex-col gap-1.5">
          <label htmlFor="source-url" className="text-sm font-semibold">
            Web address
          </label>
          <input id="source-url" name="url" required placeholder="https://acme.com/pricing" className={inputClass} />
        </div>
        <button type="submit" disabled={pending} className={`${primaryButton} self-start`}>
          {pending ? "Adding…" : "Add page"}
        </button>
      </div>
      {state.status === "error" && <p className="text-sm text-danger">{state.message}</p>}
    </form>
  );
}
