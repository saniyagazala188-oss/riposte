import "server-only";

// Sends email through Resend and messages through a Slack incoming webhook.
// Both are plain HTTPS calls; the keys stay on the server.

export function emailConfigured() {
  return Boolean(process.env.RESEND_API_KEY);
}

export async function sendEmail(to: string, msg: { subject: string; html: string; text: string }) {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("RESEND_API_KEY is not set");
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM || "Riposte <onboarding@resend.dev>",
      to: [to],
      subject: msg.subject,
      html: msg.html,
      text: msg.text,
    }),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Email failed (${res.status}): ${(await res.text()).slice(0, 200)}`);
}

export async function sendSlack(webhookUrl: string, payload: { text: string }) {
  if (!/^https:\/\/hooks\.slack\.com\//.test(webhookUrl)) throw new Error("Not a Slack webhook address");
  const res = await fetch(webhookUrl, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Slack failed (${res.status})`);
}
