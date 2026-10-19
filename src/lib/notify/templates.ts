// Email and Slack message templates. Pure functions, so they can be tested.

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://useriposte.com").replace(/\/$/, "");

export type SignalForMessage = {
  id: string;
  title: string;
  what_changed: string;
  so_what: string;
  action: string;
  impact: "high" | "medium" | "low";
  competitor: string;
  competitor_id: string;
  category?: string;
  // The action kit, when one was built: who does what, how soon, and where to share it.
  actions?: { title: string; owner: string; priority: string; channel: string }[];
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
<p style="margin:8px 0 0">You get this because email alerts are on for your Riposte account. Riposte · competitive intelligence for marketers · <a href="${SITE_URL}" style="color:${MUTED}">useriposte.com</a></p>
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

// The "Send test email" message: a real, designed email (a bare one-liner looks like spam).
export function testEmail(email: string) {
  const html = layout(
    "Your alerts are set up",
    `Riposte will email ${email} when a competitor change matters for your product.`,
    `<tr><td style="padding:16px 24px;border-top:1px solid ${LINE};font-size:14px;line-height:1.6">
<p style="margin:0 0 8px"><strong>What you'll get:</strong></p>
<p style="margin:0 0 6px">· <strong>High-impact alerts</strong> the morning Riposte finds them: what changed, why it matters to you, and what to do.</p>
<p style="margin:0 0 12px">· <strong>A weekly digest</strong> every Monday with everything from the week.</p>
<p style="margin:0;color:${MUTED}">Tip: if this landed in spam, mark it "Not spam" so future alerts reach your inbox.</p>
</td></tr>`,
  );
  const text = `Your alerts are set up.

Riposte will email ${email} when a competitor change matters for your product.

What you'll get:
- High-impact alerts the morning Riposte finds them: what changed, why it matters to you, and what to do.
- A weekly digest every Monday with everything from the week.

Open your feed: ${SITE_URL}/app
Change what Riposte sends you: ${SITE_URL}/app/settings`;
  return { subject: "Your Riposte alerts are set up", html, text };
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

export type ShippedSummary = { done: { title: string; competitor: string }[]; open: number };

function shippedBlock(s: ShippedSummary) {
  if (!s.done.length && !s.open) return "";
  const n = s.done.length;
  const lines = s.done
    .slice(0, 6)
    .map((d) => `<li style="margin:0 0 4px">${esc(d.title)} <span style="color:${MUTED}">· ${esc(d.competitor)}</span></li>`)
    .join("");
  return `<tr><td style="padding:16px 24px;border-top:1px solid ${LINE}">
<p style="margin:0;font-size:16px;font-weight:700">${n ? `Your team shipped ${n} ${n === 1 ? "response" : "responses"} to competitor moves this week` : "No responses shipped this week yet"}</p>
${lines ? `<ul style="margin:8px 0 0;padding-left:18px;font-size:14px;line-height:1.5">${lines}</ul>` : ""}
${s.open ? `<p style="margin:8px 0 0;font-size:14px;color:${MUTED}">${s.open} still open. <a href="${SITE_URL}/app/actions" style="color:${ACCENT}">See the Actions board</a></p>` : ""}
</td></tr>`;
}

export function digestEmail(
  signals: SignalForMessage[],
  { competitors, weekOf, shipped = { done: [], open: 0 } }: { competitors: number; weekOf: string; shipped?: ShippedSummary },
) {
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
    shippedBlock(shipped) +
    shown.map(signalBlock).join("") +
    (more > 0
      ? `<tr><td style="padding:12px 24px;border-top:1px solid ${LINE};font-size:14px"><a href="${SITE_URL}/app" style="color:${ACCENT}">See ${more} more in your feed</a></td></tr>`
      : "");
  const shippedText = shipped.done.length
    ? `Your team shipped ${shipped.done.length} responses to competitor moves this week.\n\n`
    : "";
  return { subject, html: layout("Your weekly competitor digest", intro, body), text: shippedText + (plainText(shown) || intro) };
}

function plainText(signals: SignalForMessage[]) {
  return signals
    .map((s) => `${s.title}\n${s.what_changed}\nWhy it matters: ${s.so_what}\nDo this: ${s.action}\n`)
    .join("\n");
}

// Slack "mrkdwn" escapes only &, < and >.
const slackEsc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const CATEGORY: Record<string, string> = {
  pricing: "Pricing",
  product: "Product",
  content: "Content",
  positioning: "Positioning",
};
const PRIORITY: Record<string, string> = { now: "Today", this_week: "This week", later: "Later" };
const IMPACT: Record<string, string> = { high: "🔴 High impact", medium: "🟠 Medium impact", low: "⚪ Low impact" };

// A Slack message as cards (Block Kit): for each change, the competitor, what changed, why it
// matters, what to do, who does what (from the action kit) and buttons back into Riposte.
// `text` is the plain version Slack shows in notifications.
export function slackMessage(heading: string, signals: SignalForMessage[], note?: string) {
  const list = signals.slice(0, 8);
  const blocks: unknown[] = [{ type: "header", text: { type: "plain_text", text: heading.slice(0, 150), emoji: true } }];
  if (note) blocks.push({ type: "context", elements: [{ type: "mrkdwn", text: slackEsc(note) }] });

  for (const s of list) {
    const open = `${SITE_URL}/app?show=all&s=${s.id}`;
    const tags = [IMPACT[s.impact], s.category && CATEGORY[s.category]].filter(Boolean).join("  ·  ");
    blocks.push(
      { type: "divider" },
      {
        type: "section",
        text: { type: "mrkdwn", text: `*${slackEsc(s.competitor)}*  ·  ${tags}\n*<${open}|${slackEsc(s.title)}>*` },
      },
      {
        type: "section",
        fields: [
          { type: "mrkdwn", text: `*What changed*\n${slackEsc(clip(s.what_changed, 900))}` },
          { type: "mrkdwn", text: `*Why it matters to you*\n${slackEsc(clip(s.so_what, 900))}` },
        ],
      },
      { type: "section", text: { type: "mrkdwn", text: `*What to do*\n${slackEsc(clip(s.action, 1500))}` } },
    );
    if (s.actions?.length) {
      const rows = s.actions
        .slice(0, 4)
        .map(
          (a) =>
            `• *${PRIORITY[a.priority] ?? "This week"} · ${slackEsc(a.owner)}:* ${slackEsc(a.title)}${a.channel ? `\n   _Share in:_ ${slackEsc(a.channel)}` : ""}`,
        );
      blocks.push({ type: "section", text: { type: "mrkdwn", text: `*Who does what*\n${rows.join("\n")}` } });
    }
    blocks.push({
      type: "actions",
      elements: [
        { type: "button", style: "primary", text: { type: "plain_text", text: s.actions?.length ? "Open the action kit" : "Open in Riposte" }, url: open },
        { type: "button", text: { type: "plain_text", text: "Their page" }, url: `${SITE_URL}/app/competitors/${s.competitor_id}` },
      ],
    });
  }

  blocks.push(
    { type: "divider" },
    {
      type: "actions",
      elements: [{ type: "button", text: { type: "plain_text", text: "Open your feed" }, url: `${SITE_URL}/app` }],
    },
  );
  if (signals.length > list.length)
    blocks.push({ type: "context", elements: [{ type: "mrkdwn", text: `And ${signals.length - list.length} more in your feed.` }] });

  const text = [heading, ...list.map((s) => `${s.competitor}: ${s.title}`)].join("\n");
  return { text, blocks };
}

const clip = (t: string, n: number) => (t.length > n ? `${t.slice(0, n - 1).trimEnd()}…` : t);
