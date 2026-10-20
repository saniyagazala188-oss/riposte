import "server-only";
import { adminEmails } from "@/lib/access";
import { SITE_URL } from "@/lib/site";
import { emailConfigured, sendEmail } from "./send";

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

// Emails the admin(s). Never throws: a failed note must not break a signup or a report.
async function tellAdmins(subject: string, lines: string[], link: string, linkLabel: string) {
  if (!emailConfigured()) return;
  const text = `${lines.join("\n")}\n\n${linkLabel}: ${link}`;
  const html = `${lines.map((l) => `<p>${esc(l)}</p>`).join("")}<p><a href="${link}">${linkLabel}</a></p>`;
  for (const to of adminEmails()) {
    try {
      await sendEmail(to, { subject, text, html });
    } catch {
      // email not set up for this address yet
    }
  }
}

export async function notifyNewWaitlist(email: string, source: string) {
  await tellAdmins(
    `New on the Riposte waitlist: ${email}`,
    [`${email} just joined the waitlist (${source}).`, "Approve them when you're ready."],
    `${SITE_URL}/app/admin`,
    "Open Beta access",
  );
}

export async function notifyProblem(email: string, problem: string, where: string | null, shots: number) {
  await tellAdmins(
    `Problem reported by ${email}`,
    [`${email} reported a problem${where ? ` on ${where}` : ""}:`, problem.slice(0, 600), shots ? `${shots} screenshot${shots > 1 ? "s" : ""} attached.` : "No screenshots."],
    `${SITE_URL}/app/admin?view=feedback`,
    "See it in Admin",
  );
}
