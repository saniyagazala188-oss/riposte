// Email and Slack message templates. Pure functions, so they can be tested.

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://riposte-eta.vercel.app").replace(/\/$/, "");

export type SignalForMessage = {
  id: string;
  title: string;
  what_changed: string;
  so_what: string;
  action: string;
  impact: "high" | "medium" | "low";
  competitor: string;
  competitor_id: string;
};

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const INK = "#12171c";
const MUTED = "#5a6470";
const LINE = "#dce1e3";
const ACCENT = "#0e6b66";
const SIGNAL = "#b45f06";

function layout(heading: string, intro: string, body: string) {
  return `<!doctype html><html><body style="margin:0;background:#f4f6f5;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:${INK}">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:24px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border:1px solid ${LINE};border-radius:16px">
<tr><td style="padding:24px 24px 8px">
<p style="margin:0;font-size:13px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:${ACCENT}">Riposte</p>
<h1 style="margin:8px 0 4px;font-size:22px;line-height:1.3">${esc(heading)}</h1>
<p style="margin:0;font-size:15px;color:${MUTED}">${esc(intro)}</p>
</td></tr>
${body}
<tr><td style="padding:16px 24px 24px;border-top:1px solid ${LINE};font-size:12px;color:${MUTED}">
<a href="${SITE_URL}/app" style="color:${ACCENT}">Open your feed</a> ·
<a href="${SITE_URL}/app/settings" style="color:${MUTED}">Change what Riposte sends you</a>
</td></tr>
</table></td></tr></table></body></html>`;
}

function signalBlock(s: SignalForMessage) {
  const badge = s.impact === "high" ? "High impact" : s.impact === "medium" ? "Worth knowing" : "Low impact";
  return `<tr><td style="padding:16px 24px;border-top:1px solid ${LINE}">
<p style="margin:0;font-size:12px;color:${MUTED}"><strong style="color:${s.impact === "high" ? SIGNAL : MUTED}">${badge}</strong> · ${esc(s.competitor)}</p>
<p style="margin:4px 0 8px;font-size:16px;font-weight:700"><a href="${SITE_URL}/app/competitors/${s.competitor_id}" style="color:${INK};text-decoration:none">${esc(s.title)}</a></p>
<p style="margin:0 0 6px;font-size:14px;line-height:1.5">${esc(s.what_changed)}</p>
<p style="margin:0 0 6px;font-size:14px;line-height:1.5"><strong>Why it matters:</strong> ${esc(s.so_what)}</p>
<p style="margin:0;font-size:14px;line-height:1.5"><strong>Do this:</strong> ${esc(s.action)}</p>
</td></tr>`;
}

export function alertEmail(signals: SignalForMessage[]) {
  const n = signals.length;
  const subject = n === 1 ? signals[0].title : `${n} high-impact competitor changes`;
  const html = layout(
    n === 1 ? "A competitor change needs your attention" : `${n} competitor changes need your attention`,
    "Riposte flagged these as high impact for your product.",
    signals.map(signalBlock).join(""),
  );
  return { subject, html, text: plainText(signals) };
}

export function digestEmail(signals: SignalForMessage[], { competitors, weekOf }: { competitors: number; weekOf: string }) {
  const high = signals.filter((s) => s.impact === "high");
  const rest = signals.filter((s) => s.impact !== "high");
  const subject = signals.length
    ? `Your week in competitors: ${signals.length} ${signals.length === 1 ? "change" : "changes"}${high.length ? `, ${high.length} high impact` : ""}`
    : "Your week in competitors: a quiet week";
  const intro = signals.length
    ? `What ${competitors} ${competitors === 1 ? "competitor" : "competitors"} changed in the week to ${weekOf}, most important first.`
    : `Riposte watched ${competitors} ${competitors === 1 ? "competitor" : "competitors"} this week and found no meaningful changes. Nothing to do.`;
  const shown = [...high, ...rest].slice(0, 12);
  const more = signals.length - shown.length;
  const body =
    shown.map(signalBlock).join("") +
    (more > 0
      ? `<tr><td style="padding:12px 24px;border-top:1px solid ${LINE};font-size:14px"><a href="${SITE_URL}/app" style="color:${ACCENT}">See ${more} more in your feed</a></td></tr>`
      : "");
  return { subject, html: layout("Your weekly competitor digest", intro, body), text: plainText(shown) || intro };
}

function plainText(signals: SignalForMessage[]) {
  return signals
    .map((s) => `${s.title}\n${s.what_changed}\nWhy it matters: ${s.so_what}\nDo this: ${s.action}\n`)
    .join("\n");
}

// Slack "mrkdwn" escapes only &, < and >.
const slackEsc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export function slackMessage(heading: string, signals: SignalForMessage[]) {
  const lines = signals.slice(0, 10).map(
    (s) =>
      `*<${SITE_URL}/app/competitors/${s.competitor_id}|${slackEsc(s.title)}>*\n${slackEsc(s.what_changed)}\n_Why it matters:_ ${slackEsc(s.so_what)}\n_Do this:_ ${slackEsc(s.action)}`,
  );
  return { text: [`*${slackEsc(heading)}*`, ...lines].join("\n\n") };
}
