"use client";

import { useActionState, useEffect, useRef } from "react";
import { addOwnPrompt, generatePrompts } from "./actions";
import type { CheckState } from "@/app/app/actions";
import { inputClass, primaryButton, secondaryButton } from "@/components/styles";

function Message({ state, pending }: { state: CheckState; pending: boolean }) {
  if (pending || !state.message) return null;
  return (
    <p className={`text-sm ${state.status === "error" ? "text-danger" : "text-ink"}`} role="status">
      {state.message}
    </p>
  );
}

export function GenerateForm({ keywords, priorities, hasPrompts }: { keywords: string; priorities: string; hasPrompts: boolean }) {
  const [state, action, pending] = useActionState<CheckState, FormData>(generatePrompts, { status: "idle" });
  return (
    <form action={action} className="flex flex-col gap-4">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-semibold">Keywords you want to win</span>
          <span className="text-muted">One per line, from your SEO list or the words buyers use.</span>
          <textarea
            name="keywords"
            rows={4}
            defaultValue={keywords}
            className={inputClass}
            placeholder={"competitive intelligence tool\ncompetitor monitoring software\nbattlecard software\ncompetitor price tracking"}
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-semibold">Areas to win (optional)</span>
          <span className="text-muted">Niches where you want AI to recommend you. Each becomes a Spear topic.</span>
          <textarea
            name="priorities"
            rows={4}
            defaultValue={priorities}
            className={inputClass}
            placeholder={"Competitor alerts for content teams\nAuto-drafted responses to competitor launches"}
          />
        </label>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={pending} className={primaryButton}>
          {pending ? "Writing prompts…" : hasPrompts ? "Write new prompts" : "Write prompts"}
        </button>
        {pending && <p className="text-sm text-muted">Writing about 60 buyer prompts and checking each one. Up to a minute.</p>}
        {!pending && hasPrompts && (
          <p className="text-sm text-muted">Tracked prompts and your own are kept; the rest are replaced.</p>
        )}
      </div>
      <Message state={state} pending={pending} />
    </form>
  );
}

export function AddPromptForm({ topics }: { topics: string[] }) {
  const [state, action, pending] = useActionState<CheckState, FormData>(addOwnPrompt, { status: "idle" });
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.status === "done") ref.current?.reset();
  }, [state]);
  return (
    <form ref={ref} action={action} className="flex flex-col gap-3">
      <div className="flex flex-col gap-3">
        <input
          name="text"
          className={inputClass}
          placeholder="What's the best competitor tracking tool for a two-person content team?"
          aria-label="Your prompt"
        />
        <div className="flex gap-2">
          <input name="topic" list="prompt-topics" className={`${inputClass} flex-1`} placeholder="Topic (pick or type)" aria-label="Topic" />
        <datalist id="prompt-topics">
          {topics.map((t) => (
            <option key={t} value={t} />
          ))}
        </datalist>
          <button type="submit" disabled={pending} className={secondaryButton}>
            {pending ? "Checking…" : "Add"}
          </button>
        </div>
      </div>
      <Message state={state} pending={pending} />
    </form>
  );
}
