"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { inputClass, primaryButton } from "@/components/styles";

// Set or change the password, so logging in doesn't need an email link.
export function PasswordForm() {
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "busy" | "saved" | "error">("idle");
  const [message, setMessage] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const supabase = createClient();
    if (!supabase) return;
    setStatus("busy");
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setStatus("error");
      setMessage(error.message);
    } else {
      setStatus("saved");
      setPassword("");
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-2">
      <label htmlFor="new-password" className="text-sm font-semibold">
        Password
      </label>
      <div className="flex gap-2">
        <input
          id="new-password"
          type="password"
          minLength={8}
          required
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="At least 8 characters"
          className={`${inputClass} flex-1`}
        />
        <button type="submit" disabled={status === "busy"} className={primaryButton}>
          {status === "busy" ? "Saving…" : "Save"}
        </button>
      </div>
      {status === "saved" && <p className="text-sm text-accent">Saved. Next time, log in with your email and this password.</p>}
      {status === "error" && <p className="text-sm text-danger">{message}</p>}
    </form>
  );
}
