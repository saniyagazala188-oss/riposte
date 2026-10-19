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
          Slack
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
          Paste your Slack incoming webhook link to get the same alerts and the Monday summary in a channel. Leave empty for email only.
        </p>
        <details className="mt-1 rounded-xl border border-line bg-bg px-3 py-2 text-sm">
          <summary className="cursor-pointer font-semibold">How to connect Slack (5 minutes)</summary>
          <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-muted">
            <li>
              Open <a className="text-accent underline" href="https://api.slack.com/apps" target="_blank" rel="noopener noreferrer">api.slack.com/apps</a>,
              click <b>Create an App</b> → <b>From scratch</b>, name it Riposte and pick your workspace.
            </li>
            <li>
              Add the permission <b>incoming-webhook</b>, skip events, then <b>Create and Install</b> and pick the channel for alerts.
            </li>
            <li>
              In the app&apos;s menu, open <b>Incoming Webhooks</b>, copy the link that starts with https://hooks.slack.com/services/ and paste it
              above. Keep it private: anyone with it can post in your channel.
            </li>
            <li>
              Open <b>Interactivity &amp; Shortcuts</b>, switch it on, and paste this as the Request URL, then save:
              <code className="mt-1 block break-all rounded bg-surface px-2 py-1 text-xs text-ink">https://useriposte.com/api/slack/interactions</code>
              This stops Slack showing a warning icon when you click a button in a Riposte message.
            </li>
            <li>Click Save here, then <b>Send a test to Slack</b>.</li>
          </ol>
        </details>
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
