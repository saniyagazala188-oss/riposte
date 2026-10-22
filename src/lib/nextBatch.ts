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
