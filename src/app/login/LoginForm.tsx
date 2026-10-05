"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { inputClass, primaryButton, secondaryButton } from "@/components/styles";

type Mode = "login" | "signup" | "link";
type Status = "idle" | "busy" | "sent" | "error";

const GOOGLE = process.env.NEXT_PUBLIC_GOOGLE_LOGIN === "on";

// Log in with email + password, sign up (one confirmation email), or get a one-time link.
export function LoginForm() {
  const params = useSearchParams();
  const router = useRouter();
  const [mode, setMode] = useState<Mode>(params.get("mode") === "signup" ? "signup" : "login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState(
    params.get("error") === "link" ? "That link has expired or was already used. Log in or request a new one." : "",
  );
  const redirect = () => `${window.location.origin}/auth/callback`;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const supabase = createClient();
    if (!supabase) {
      setStatus("error");
      setMessage("Login isn't connected yet. Add the Supabase settings and try again.");
      return;
    }
    setStatus("busy");
    setMessage("");
    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setStatus("error");
        setMessage(
          /invalid login/i.test(error.message)
            ? "Email or password is wrong. If you used to log in with an email link, choose \"Email me a link\" below, then set a password in Alerts & account."
            : /confirm/i.test(error.message)
              ? "Confirm your email first: open the link we sent when you signed up."
              : error.message,
        );
        return;
      }
      router.replace("/app");
      router.refresh();
      return;
    }
    if (mode === "signup") {
      const { data, error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: redirect() } });
      if (error) {
        setStatus("error");
        setMessage(error.message);
        return;
      }
      if (data.session) {
        router.replace("/app");
        router.refresh();
        return;
      }
      setStatus("sent");
      return;
    }
    const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: redirect() } });
    if (error) {
      setStatus("error");
      setMessage(error.message);
    } else setStatus("sent");
  }

  async function google() {
    const supabase = createClient();
    await supabase?.auth.signInWithOAuth({ provider: "google", options: { redirectTo: redirect() } });
  }

  if (status === "sent") {
    return (
      <div className="rounded-xl border border-line bg-accent-soft p-5 text-sm">
        <p className="font-semibold">Check your inbox.</p>
        <p className="mt-1 text-muted">
          {mode === "signup" ? "We sent a confirmation link to " : "We sent a login link to "}
          <span className="font-medium text-ink">{email}</span>.{" "}
          {mode === "signup"
            ? "Open it once to confirm your email. After that, you log in with your email and password."
            : "Open it on this device to sign in."}
        </p>
        <p className="mt-2 text-xs text-muted">Not there? Check spam or promotions.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {mode !== "link" && (
        <div className="grid grid-cols-2 rounded-lg bg-bg p-1 text-sm" role="tablist">
          {(["login", "signup"] as const).map((m) => (
            <button
              key={m}
              type="button"
              role="tab"
              aria-selected={mode === m}
              onClick={() => {
                setMode(m);
                setMessage("");
                setStatus("idle");
              }}
              className={`rounded-md py-2 font-semibold ${mode === m ? "bg-surface shadow-sm" : "text-muted hover:text-ink"}`}
            >
              {m === "login" ? "Log in" : "Sign up"}
            </button>
          ))}
        </div>
      )}

      {GOOGLE && mode !== "link" && (
        <>
          <button type="button" onClick={google} className={`${secondaryButton} w-full py-2.5 text-base`}>
            Continue with Google
          </button>
          <p className="text-center text-xs text-muted">or with email</p>
        </>
      )}

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
          className={inputClass}
        />
        {mode !== "link" && (
          <>
            <label htmlFor="password" className="text-sm font-semibold">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={8}
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={mode === "signup" ? "At least 8 characters" : ""}
              className={inputClass}
            />
          </>
        )}
        <button type="submit" disabled={status === "busy"} className={primaryButton}>
          {status === "busy"
            ? "One moment…"
            : mode === "login"
              ? "Log in"
              : mode === "signup"
                ? "Create account"
                : "Email me a login link"}
        </button>
        {message && <p className="text-sm text-danger">{message}</p>}
      </form>

      <p className="text-center text-sm text-muted">
        {mode === "link" ? (
          <button type="button" className="font-semibold text-accent hover:underline" onClick={() => setMode("login")}>
            Back to password login
          </button>
        ) : (
          <>
            Forgot your password, or never set one?{" "}
            <button type="button" className="font-semibold text-accent hover:underline" onClick={() => setMode("link")}>
              Email me a link
            </button>
          </>
        )}
      </p>
    </div>
  );
}
