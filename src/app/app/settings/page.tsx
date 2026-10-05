import { requireUser } from "@/lib/auth";
import { card } from "@/components/styles";
import { SendTestButton } from "@/components/ActionButtons";
import { emailConfigured } from "@/lib/notify/send";
import { geminiConfigured } from "@/lib/ai/gemini";
import { PageHeader } from "@/components/ui";
import { AlertSettingsForm } from "./AlertSettingsForm";
import { PasswordForm } from "./PasswordForm";
import { clearHistory } from "@/app/app/actions";
import { ConfirmSubmit } from "@/components/FormButtons";

export const metadata = { title: "Alerts & account · Riposte" };

export default async function SettingsPage() {
  const { supabase, user } = await requireUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("email, email_alerts, weekly_digest, slack_webhook_url, last_digest_at")
    .eq("id", user.id)
    .maybeSingle();
  const emailReady = emailConfigured();

  return (
    <div>
      <PageHeader
        kicker="Alerts & account"
        title="How Riposte tells you"
        description="High-impact changes arrive the morning they're found, and a digest of the whole week every Monday."
      />

      {(!emailReady || !geminiConfigured()) && (
        <p className="mt-5 rounded-xl border border-line bg-signal-soft px-4 py-3 text-sm">
          {!geminiConfigured() && "AI explanations are switched off until the GEMINI_API_KEY setting is added. "}
          {!emailReady && "Emails are switched off until the RESEND_API_KEY setting is added."}
        </p>
      )}

      <div className="mt-5 grid items-start gap-5 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <section className={`${card} p-5`}>
          <h2 className="mb-4 font-display text-lg font-bold">Alerts</h2>
          <AlertSettingsForm
            email={profile?.email ?? user.email ?? ""}
            email_alerts={profile?.email_alerts ?? true}
            weekly_digest={profile?.weekly_digest ?? true}
            slack_webhook_url={profile?.slack_webhook_url ?? ""}
          />
        </section>

        <div className="flex flex-col gap-4">
          <section className={`${card} p-5`}>
            <h2 className="font-display text-lg font-bold">Try it</h2>
            <p className="mt-1 text-sm text-muted">Save your settings first, then send yourself a test.</p>
            <div className="mt-4 flex flex-col gap-3">
              <SendTestButton what="email" label="Send a test email" />
              <SendTestButton what="digest" label="Send this week's digest now" />
              {profile?.slack_webhook_url && <SendTestButton what="slack" label="Send a test to Slack" />}
            </div>
          </section>

          <section className={`${card} p-5`}>
            <h2 className="font-display text-lg font-bold">Account</h2>
            <p className="mb-3 mt-1 text-sm text-muted">
              Signed in as <span className="font-medium text-ink">{user.email}</span>. Set a password to log in without an email link.
            </p>
            <PasswordForm />
          </section>

          <section className="rounded-2xl border border-line p-5">
            <h2 className="font-semibold">Start fresh</h2>
            <p className="mb-3 mt-1 text-sm text-muted">
              Deletes every signal, action item, connected move and trend. Competitors and their pages stay, and tracking carries on
              from today.
            </p>
            <form action={clearHistory}>
              <ConfirmSubmit label="Clear all history" confirmLabel="Yes, clear everything" pendingLabel="Clearing…" />
            </form>
          </section>
        </div>
      </div>
    </div>
  );
}
