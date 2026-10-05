import { AUTHOR, SITE_URL } from "@/lib/site";

// The invite sent when someone is approved for the beta. Also shown on the admin page
// to copy into WhatsApp or LinkedIn when email can't be sent.
export function inviteMessage(email: string) {
  const url = `${SITE_URL}/login`;
  const text = `Hi! You're in the Riposte beta.

Sign up at ${url} with this email (${email}). It's free for as long as the beta runs, and you'll get 30 days' notice before any pricing.

Start with "Your product", then add up to 5 competitors. Riposte checks them every morning and tells you what changed, why it matters and what to do.

I'd love to hear what you think. There's a "Give feedback" link in the menu, and I read every answer.

${AUTHOR.name.split(" ")[0]}, founder of Riposte`;
  const html = text
    .split("\n\n")
    .map((p) => `<p>${p.replace(url, `<a href="${url}">${url}</a>`).replace(/\n/g, "<br>")}</p>`)
    .join("");
  return { subject: "You're in: the Riposte beta", text, html };
}
