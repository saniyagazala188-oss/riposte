import { requireUser } from "@/lib/auth";
import { card, eyebrow } from "@/components/styles";
import { SendTestButton } from "@/components/ActionButtons";
import { emailConfigured } from "@/lib/notify/send";
import { geminiConfigured } from "@/lib/ai/gemini";
import { AlertSettingsForm } from "./AlertSettingsForm";

export const metadata = { title: "Alerts · Riposte" };

export default async function SettingsPage() {
  const { supabase, user } = await requireUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("email, email_alerts, weekly_digest, slack_webhook_url, last_digest_at")
    .eq("id", user.id)
    .maybeSingle();
  const emailReady = emailConfigured();

  return (
    <div className="max-w-2xl">
      <p className={eyebrow}>Alerts</p>
      <h1 className="mt-1 font-display text-3xl font-bold">How Riposte tells you</h1>
      <p className="mt-2 text-muted">
        A dashboard nobody opens doesn&apos;t help. Riposte sends high-impact changes the morning they&apos;re found,
        and a digest of the whole week every Monday.
      </p>

      {(!emailReady || !geminiConfigured()) && (
        <p className="mt-5 rounded-xl border border-line bg-signal-soft px-4 py-3 text-sm">
          {!geminiConfigured() && "AI explanations are switched off until the GEMINI_API_KEY setting is added. "}
          {!emailReady && "Emails are switched off until the RESEND_API_KEY setting is added."}
        </p>
      )}

      <section className={`${card} mt-6 p-5`}>
        <AlertSettingsForm
          email={profile?.email ?? user.email ?? ""}
          email_alerts={profile?.email_alerts ?? true}
          weekly_digest={profile?.weekly_digest ?? true}
          slack_webhook_url={profile?.slack_webhook_url ?? ""}
        />
      </section>

      <section className={`${card} mt-6 p-5`}>
        <h2 className="font-display text-xl font-bold">Try it</h2>
        <p className="mt-1 text-sm text-muted">Save your settings first, then send yourself a test.</p>
        <div className="mt-4 flex flex-col gap-4">
          <SendTestButton what="email" label="Send a test email" />
          <SendTestButton what="digest" label="Send this week's digest now" />
          {profile?.slack_webhook_url && <SendTestButton what="slack" label="Send a test to Slack" />}
        </div>
      </section>
    </div>
  );
}
