"use client";

import { useActionState } from "react";
import { saveProduct, type FormState } from "@/app/app/actions";
import { inputClass, primaryButton } from "@/components/styles";

type Props = { product_name: string; product_pitch: string; ideal_customer: string; differentiators: string };

export function ProductForm(initial: Props) {
  const [state, action, pending] = useActionState<FormState, FormData>(saveProduct, { status: "idle" });

  return (
    <form action={action} className="flex flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="product_name" className="text-sm font-semibold">
          Product name
        </label>
        <input id="product_name" name="product_name" defaultValue={initial.product_name} placeholder="e.g. KaneAI" required maxLength={80} className={inputClass} />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="product_pitch" className="text-sm font-semibold">
          What it does, in one line
        </label>
        <input id="product_pitch" name="product_pitch" defaultValue={initial.product_pitch} placeholder="e.g. AI-native test authoring for QA teams" maxLength={200} className={inputClass} />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="ideal_customer" className="text-sm font-semibold">
          Who you sell to
        </label>
        <input id="ideal_customer" name="ideal_customer" defaultValue={initial.ideal_customer} placeholder="e.g. QA leads at mid-size SaaS companies" maxLength={200} className={inputClass} />
        <p className="text-xs text-muted">Be specific. &quot;Content leads at B2B SaaS startups&quot; gives sharper advice than &quot;marketers&quot;.</p>
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="differentiators" className="text-sm font-semibold">
          What makes you different
        </label>
        <textarea
          id="differentiators"
          name="differentiators"
          defaultValue={initial.differentiators}
          rows={4}
          maxLength={600}
          placeholder={"One point per line, 2-3 points. e.g.\nNo-code test authoring in plain English\nRuns on 3,000+ real browsers and devices"}
          className={inputClass}
        />
        <p className="text-xs text-muted">
          Your real strengths. Talk tracks, battlecards and posts pivot to these instead of generic lines.
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={pending} className={primaryButton}>
          {pending ? "Saving…" : "Save"}
        </button>
        {state.status === "saved" && <p className="text-sm text-accent">Saved.</p>}
        {state.status === "error" && <p className="text-sm text-danger">{state.message}</p>}
      </div>
    </form>
  );
}
