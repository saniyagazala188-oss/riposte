"use client";

import { useActionState } from "react";
import { addCompetitor, type FormState } from "@/app/app/actions";
import { inputClass, primaryButton } from "@/components/styles";

export function AddCompetitorForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(addCompetitor, { status: "idle" });

  return (
    <form action={action} className="flex flex-col gap-3">
      <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <div className="flex min-w-0 flex-col gap-1.5">
          <label htmlFor="domain" className="text-sm font-semibold">
            Website
          </label>
          <input id="domain" name="domain" required placeholder="acme.com" autoComplete="off" className={inputClass} />
        </div>
        <div className="flex min-w-0 flex-col gap-1.5">
          <label htmlFor="name" className="text-sm font-semibold">
            Name <span className="font-normal text-muted">(optional)</span>
          </label>
          <input id="name" name="name" placeholder="Acme" maxLength={80} className={inputClass} />
        </div>
        <button type="submit" disabled={pending} className={primaryButton}>
          {pending ? "Finding pages…" : "Add competitor"}
        </button>
      </div>
      {pending && (
        <p className="text-sm text-muted">Looking for their changelog, blog, feed and pricing page. This can take up to 20 seconds.</p>
      )}
      {state.status === "error" && <p className="text-sm text-danger">{state.message}</p>}
    </form>
  );
}
