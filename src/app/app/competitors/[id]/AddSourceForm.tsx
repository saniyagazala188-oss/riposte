"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { addSource, type FormState } from "@/app/app/actions";
import { SOURCE_LABELS, type SourceType } from "@/lib/discovery/parse";
import { inputClass, primaryButton } from "@/components/styles";

// News sources are added automatically for every competitor, so they are not offered here.
const TYPES = (Object.keys(SOURCE_LABELS) as SourceType[]).filter((t) => t !== "news");

export function AddSourceForm({ competitorId }: { competitorId: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(addSource, { status: "idle" });
  const formRef = useRef<HTMLFormElement>(null);
  const [type, setType] = useState<SourceType>("pricing");

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
          <select id="source-type" name="type" value={type} onChange={(e) => setType(e.target.value as SourceType)} className={inputClass}>
            {TYPES.map((t) => (
              <option key={t} value={t}>
                {SOURCE_LABELS[t]}
              </option>
            ))}
          </select>
        </div>
        <div className="flex min-w-0 flex-col gap-1.5">
          <label htmlFor="source-url" className="text-sm font-semibold">
            {type === "youtube" ? "Channel link" : "Web address"}
          </label>
          <input
            id="source-url"
            name="url"
            required
            placeholder={type === "youtube" ? "https://www.youtube.com/@acme" : "https://acme.com/pricing"}
            className={inputClass}
          />
          {type === "youtube" && <p className="text-xs text-muted">Paste their channel link. Riposte checks it for new videos every morning.</p>}
        </div>
        <button type="submit" disabled={pending} className={`${primaryButton} self-start`}>
          {pending ? "Adding…" : type === "youtube" ? "Add channel" : "Add page"}
        </button>
      </div>
      {state.status === "error" && <p className="text-sm text-danger">{state.message}</p>}
    </form>
  );
}
