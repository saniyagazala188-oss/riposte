import { AUTHOR, SITE_URL } from "@/lib/site";
import { CONTACT_EMAIL } from "@/components/LegalPage";

// Sent when the admin moves someone to the next beta batch: the current round is full,
// their spot is saved, and they'll hear back by email.
export function nextBatchMessage() {
  const tool = `${SITE_URL}/tools/battlecard-generator`;
  const text = `Hi,

Thank you for joining the Riposte waitlist. It really means a lot.

I'm letting people into the beta a few at a time, so I can help each person properly and fix things quickly. This round is full right now, so I've saved you a spot in the next batch.

You don't need to do anything. I'll email you here as soon as your spot opens.

Until then, you can try the free battlecard generator, no sign-up needed: ${tool}

If you'd like to tell me what you hope Riposte will help you with, write to me at ${CONTACT_EMAIL}. I read every message.

Take care,
${AUTHOR.name.split(" ")[0]}, from Riposte`;
  const html = text
    .split("\n\n")
    .map((p) => `<p>${p.replace(tool, `<a href="${tool}">${tool}</a>`).replace(CONTACT_EMAIL, `<a href="mailto:${CONTACT_EMAIL}">${CONTACT_EMAIL}</a>`).replace(/\n/g, "<br>")}</p>`)
    .join("");
  return { subject: "Your spot in the next Riposte batch", text, html };
}

// Sent when the admin removes a real person from the waitlist (not a bot). No reason given,
// so it fits any case: a duplicate, someone who asked to leave, or not the right fit yet.
export function removedMessage() {
  const site = SITE_URL.replace(/^https?:\/\//, "");
  const text = `Hi,

Thank you for your interest in Riposte. I've removed your email from the waitlist, so you won't get any more emails from us.

If this was a mistake, or you'd like to join again later, you're always welcome back at ${site}.

Take care,
${AUTHOR.name.split(" ")[0]}, from Riposte`;
  const html = text
    .split("\n\n")
    .map((p) => `<p>${p.replace(`${site}.`, `<a href="${SITE_URL}">${site}</a>.`).replace(/\n/g, "<br>")}</p>`)
    .join("");
  return { subject: "You've been removed from the Riposte waitlist", text, html };
}
