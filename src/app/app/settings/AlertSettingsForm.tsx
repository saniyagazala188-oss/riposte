"use client";

import { useActionState } from "react";
import { saveAlertSettings, type FormState } from "@/app/app/actions";
import { inputClass, primaryButton } from "@/components/styles";

type Props = { email: string; email_alerts: boolean; weekly_digest: boolean; slack_webhook_url: string };

export function AlertSettingsForm(initial: Props) {
  const [state, action, pending] = useActionState<FormState, FormData>(saveAlertSettings, { status: "idle" });

  return (
    <form action={action} className="flex flex-col gap-5">
      <label className="flex items-start gap-3">
        <input type="checkbox" name="email_alerts" defaultChecked={initial.email_alerts} className="mt-1 h-4 w-4 accent-[var(--accent)]" />
        <span>
          <span className="block font-semibold">Email me high-impact changes</span>
          <span className="block text-sm text-muted">
            Price changes, launches that overlap your product, positioning shifts aimed at your buyers. Sent to{" "}
            {initial.email || "your login email"}.
          </span>
        </span>
      </label>

      <label className="flex items-start gap-3">
        <input type="checkbox" name="weekly_digest" defaultChecked={initial.weekly_digest} className="mt-1 h-4 w-4 accent-[var(--accent)]" />
        <span>
          <span className="block font-semibold">Weekly digest every Monday</span>
          <span className="block text-sm text-muted">Everything meaningful from the past week, most important first.</span>
        </span>
      </label>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="slack_webhook_url" className="font-semibold">
          Slack (optional)
        </label>
        <input
          id="slack_webhook_url"
          name="slack_webhook_url"
          defaultValue={initial.slack_webhook_url}
          placeholder="https://hooks.slack.com/services/…"
          className={`${inputClass} font-mono text-sm`}
          autoComplete="off"
        />
        <p className="text-xs text-muted">
          Paste an incoming webhook address to post the same alerts and digest into a channel. Leave empty for email only.
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
