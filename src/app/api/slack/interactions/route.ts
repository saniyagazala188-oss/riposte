// Slack "Interactivity" address. Riposte's Slack messages only have link buttons, but Slack still
// tells the app about every click and shows a warning icon if nobody answers. This answers
// "got it" and does nothing else: no data is read or stored, so no Slack secret is needed.
// Users paste https://useriposte.com/api/slack/interactions into their Slack app under
// Interactivity & Shortcuts → Request URL.
export const dynamic = "force-dynamic";

export async function POST() {
  return new Response(null, { status: 200 });
}

export async function GET() {
  return new Response("Riposte's Slack click receiver. Paste this address into your Slack app's Interactivity Request URL.", {
    status: 200,
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
}
