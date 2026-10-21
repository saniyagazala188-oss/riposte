"use client";

import { useActionState, useEffect, useState } from "react";
import { track } from "@/lib/analytics";
import { joinWaitlist, type WaitlistState } from "@/app/actions";

const initial: WaitlistState = { status: "idle" };

export function WaitlistForm({ id = "waitlist-email" }: { id?: string }) {
  const [state, action, pending] = useActionState(joinWaitlist, initial);
  // Bot trap: when the form appeared. Filled in after the page loads, so bots that post instantly are caught.
  const [shownAt, setShownAt] = useState("");
  // The page they're on, so Admin can show where each person joined from.
  const [from, setFrom] = useState("");
  useEffect(() => {
    setShownAt(String(Date.now()));
    setFrom(window.location.pathname);
  }, []);
  useEffect(() => {
    if (state.status === "joined") track("join_waitlist", { join_page: window.location.pathname });
  }, [state.status]);

  if (state.status === "joined") {
    return (
      <p className="rounded-xl border border-line bg-accent-soft px-4 py-3 text-sm">
        <span className="font-semibold">You&apos;re on the list.</span> I approve new people every few days, and you&apos;ll get an email when you&apos;re in.
      </p>
    );
  }

  return (
    <form action={action} className="flex w-full max-w-md flex-col gap-2 sm:flex-row">
      <label htmlFor={id} className="sr-only">
        Work email
      </label>
      <input type="hidden" name="t" value={shownAt} />
      <input type="hidden" name="from" value={from} />
      {/* Bot trap: hidden from people and screen readers; only bots fill it in. */}
      <div aria-hidden="true" style={{ position: "absolute", left: "-10000px", width: 1, height: 1, overflow: "hidden" }}>
        <label htmlFor={`${id}-website`}>Website</label>
        <input id={`${id}-website`} name="website" type="text" tabIndex={-1} autoComplete="off" defaultValue="" />
      </div>
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
