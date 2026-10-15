"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { inputClass, primaryButton } from "@/components/styles";

export function NewPasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [again, setAgain] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== again) return setMessage("The two passwords don't match.");
    const supabase = createClient();
    if (!supabase) return;
    setBusy(true);
    setMessage("");
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) {
      setMessage(
        /different from the old/i.test(error.message) ? "Choose a password you haven't used here before." : error.message,
      );
      return;
    }
    router.replace("/app?password=updated");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3">
      <label htmlFor="new-password" className="text-sm font-semibold">
        New password
      </label>
      <input
        id="new-password"
        type="password"
        required
        minLength={8}
        autoComplete="new-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="At least 8 characters"
        className={inputClass}
      />
      <label htmlFor="again" className="text-sm font-semibold">
        Type it again
      </label>
      <input
        id="again"
        type="password"
        required
        minLength={8}
        autoComplete="new-password"
        value={again}
        onChange={(e) => setAgain(e.target.value)}
        className={inputClass}
      />
      <button type="submit" disabled={busy} className={primaryButton}>
        {busy ? "Saving…" : "Save and open Riposte"}
      </button>
      {message && <p className="text-sm text-danger">{message}</p>}
    </form>
  );
}
