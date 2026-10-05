"use client";

import { useActionState } from "react";
import { joinWaitlist, type WaitlistState } from "@/app/actions";

const initial: WaitlistState = { status: "idle" };

export function WaitlistForm({ id = "waitlist-email" }: { id?: string }) {
  const [state, action, pending] = useActionState(joinWaitlist, initial);

  if (state.status === "joined") {
    return (
      <p className="rounded-xl border border-line bg-accent-soft px-4 py-3 text-sm">
        <span className="font-semibold">You&apos;re on the list.</span> I approve new people every few days and youWe&apos;ll email you when early access opens.apos;ll get an email when youWe&apos;ll email you when early access opens.apos;re in.
      </p>
    );
  }

  return (
    <form action={action} className="flex w-full max-w-md flex-col gap-2 sm:flex-row">
      <label htmlFor={id} className="sr-only">
        Work email
      </label>
      <input
        id={id}
        name="email"
        type="email"
        required
        autoComplete="email"
        placeholder="you@company.com"
        className="min-w-0 flex-1 rounded-lg border border-line bg-surface px-3 py-2.5 text-base outline-none focus:border-accent"
      />
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-accent px-4 py-2.5 font-semibold whitespace-nowrap text-accent-ink transition hover:brightness-110 disabled:opacity-60"
      >
        {pending ? "Joining…" : "Join the waitlist"}
      </button>
      {state.status === "error" && <p className="text-sm text-danger sm:basis-full">{state.message}</p>}
    </form>
  );
}
