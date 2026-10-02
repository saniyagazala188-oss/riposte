"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Status = "idle" | "sending" | "sent" | "error";

export function LoginForm() {
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState(
    params.get("error") === "link" ? "That login link has expired or was already used. Request a new one." : "",
  );

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const supabase = createClient();
    if (!supabase) {
      setStatus("error");
      setMessage("Login isn't connected yet. Add the Supabase settings and try again.");
      return;
    }
    setStatus("sending");
    setMessage("");
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) {
      setStatus("error");
      setMessage(error.message);
    } else {
      setStatus("sent");
    }
  }

  if (status === "sent") {
    return (
      <div className="rounded-xl border border-line bg-accent-soft p-5 text-sm">
        <p className="font-semibold">Check your inbox.</p>
        <p className="mt-1 text-muted">
          We sent a login link to <span className="font-medium text-ink">{email}</span>. Open it on this device to sign
          in.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3">
      <label htmlFor="email" className="text-sm font-semibold">
        Work email
      </label>
      <input
        id="email"
        type="email"
        required
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@company.com"
        className="rounded-lg border border-line bg-bg px-3 py-2.5 text-base outline-none focus:border-accent"
      />
      <button
        type="submit"
        disabled={status === "sending"}
        className="rounded-lg bg-accent px-4 py-2.5 font-semibold text-accent-ink transition hover:brightness-110 disabled:opacity-60"
      >
        {status === "sending" ? "Sending link…" : "Email me a login link"}
      </button>
      {message && <p className="text-sm text-danger">{message}</p>}
      <p className="text-xs text-muted">No password needed. We email you a one-time link.</p>
    </form>
  );
}
