import "server-only";
import { generateJson } from "@/lib/ai/gemini";
import { fetchPage } from "@/lib/discovery";
import { isSameSite, nameFromDomain } from "@/lib/discovery/parse";
import { htmlToLines } from "@/lib/fetcher/extract";

// Free battlecard generator: reads a competitor's homepage and pricing page, then drafts
// a one-page battlecard in the same 8 sections as the blog's battlecard template.
// It only uses what's on those pages plus what the visitor says about their own product.

export type Objection = { they_say: string; you_say: string };
export type Battlecard = {
  competitor: string;
  who_they_are: string;
  who_they_sell_to: string;
  why_we_win: string[];
  why_we_lose: string[];
  pricing: string;
  objections: Objection[];
  questions: string[];
  proof: string[];
  check_these: string[]; // things the page didn't say, to confirm by hand
};

export type BattlecardInput = { product: string; about: string; yourDomain: string | null; competitorDomain: string };
export type BattlecardResult = { card: Battlecard; sources: string[] };

const MAX_CHARS = 7000;

async function readText(url: string): Promise<{ url: string; text: string } | null> {
  try {
    const page = await fetchPage(url);
    if (!page.ok || !page.contentType.includes("html")) return null;
    const text = htmlToLines(page.text).join("\n").slice(0, MAX_CHARS);
    return text.length > 200 ? { url: page.url, text } : null;
  } catch {
    return null;
  }
}

// The pricing link from the homepage if there is one, otherwise the usual /pricing address.
function pricingUrl(html: string, domain: string, base: string): string {
  const hrefs = [...html.matchAll(/href=["']([^"'#]+)["']/gi)].map((m) => m[1]);
  for (const h of hrefs) {
    try {
      const u = new URL(h, base);
      if (isSameSite(u, domain) && /\/(pricing|plans|price)(\/|$)/i.test(u.pathname)) return u.toString();
    } catch {
      // not a usable link
    }
  }
  return `https://${domain}/pricing`;
}

export class SiteUnreadable extends Error {}

export async function buildBattlecard(input: BattlecardInput): Promise<BattlecardResult> {
  const home = await fetchPage(`https://${input.competitorDomain}`).catch(() => null);
  if (!home?.ok || !home.text) throw new SiteUnreadable("Couldn't read that website");
  const homeText = htmlToLines(home.text).join("\n").slice(0, MAX_CHARS);
  if (homeText.length < 200) throw new SiteUnreadable("That website has too little text to read");

  const [pricing, yours] = await Promise.all([
    readText(pricingUrl(home.text, input.competitorDomain, home.url)),
    input.yourDomain ? readText(`https://${input.yourDomain}`) : Promise.resolve(null),
  ]);

  const sources = [home.url, ...(pricing ? [pricing.url] : [])];
  const name = nameFromDomain(input.competitorDomain);

  const prompt = `You are a senior product marketer writing a one-page sales battlecard.

MY PRODUCT: ${input.product}
What it does (in my words): ${input.about}
${yours ? `My homepage text:\n"""\n${yours.text.slice(0, 3000)}\n"""` : ""}

COMPETITOR: ${input.competitorDomain} (call it by the brand name used on its pages, or "${name}")
Competitor homepage (${home.url}):
"""
${homeText}
"""
${pricing ? `Competitor pricing page (${pricing.url}):\n"""\n${pricing.text}\n"""` : "No pricing page could be read."}

Write the battlecard. Rules:
- Use ONLY facts found in the competitor text above. Never invent features, customers, numbers or prices.
- Pricing: quote exact plan names and prices only if they appear in the pricing text. Otherwise say "Not published on their website".
- why_we_win / why_we_lose: compare my product (as I described it) with what their pages say. Be fair and specific; why_we_lose must be honest.
- objections: things a buyer comparing us might say, with a short, honest answer.
- questions: trap-setting discovery questions that surface where we're stronger, without naming or trashing them.
- proof: what kind of proof I should add (e.g. "A customer quote from a team that switched"), since you don't know my customers.
- check_these: 2-4 things their pages didn't make clear that I should confirm (e.g. "Whether they offer a free trial").
- Plain, short sentences. 3-4 bullets per list. No em dashes. No hype.`;

  const schema = {
    type: "OBJECT",
    properties: {
      competitor: { type: "STRING" },
      who_they_are: { type: "STRING" },
      who_they_sell_to: { type: "STRING" },
      why_we_win: { type: "ARRAY", items: { type: "STRING" } },
      why_we_lose: { type: "ARRAY", items: { type: "STRING" } },
      pricing: { type: "STRING" },
      objections: {
        type: "ARRAY",
        items: { type: "OBJECT", properties: { they_say: { type: "STRING" }, you_say: { type: "STRING" } }, required: ["they_say", "you_say"] },
      },
      questions: { type: "ARRAY", items: { type: "STRING" } },
      proof: { type: "ARRAY", items: { type: "STRING" } },
      check_these: { type: "ARRAY", items: { type: "STRING" } },
    },
    required: ["competitor", "who_they_are", "who_they_sell_to", "why_we_win", "why_we_lose", "pricing", "objections", "questions", "proof", "check_these"],
  };

  const card = await generateJson<Battlecard>(prompt, schema, { timeoutMs: 45000 });
  return { card, sources };
}

// For the local preview (no AI key): a sample card with made-up names.
export function sampleBattlecard(input: BattlecardInput): BattlecardResult {
  return {
    sources: [`https://${input.competitorDomain}/`, `https://${input.competitorDomain}/pricing`],
    card: {
      competitor: nameFromDomain(input.competitorDomain),
      who_they_are: "A website monitoring tool that alerts teams when competitor pages change, with AI summaries of each change.",
      who_they_sell_to: "Marketing and sales teams at mid-size companies, especially in B2B software.",
      why_we_win: [
        "We explain each change for the buyer's own product, not just the page.",
        "We draft the response, with an owner, so nothing waits for a meeting.",
        "Setup takes minutes: competitors' key pages are found automatically.",
      ],
      why_we_lose: [
        "They check pages every few minutes; we check once a day.",
        "They integrate with Salesforce, which large sales teams expect.",
        "They have been around longer and have more customer stories.",
      ],
      pricing: "Starter $29/month, Team $99/month, Enterprise by quote (from their pricing page).",
      objections: [
        { they_say: "They already summarize changes with AI.", you_say: "They summarize the page. We tell you what it means for your product and what to do next." },
        { they_say: "We need it in Salesforce.", you_say: "That's a real gap today. Most of our users share updates in Slack instead." },
        { they_say: "They're cheaper.", you_say: "Compare the time saved: the draft reply is ready, not just the alert." },
      ],
      questions: [
        "When a competitor changes pricing, how long until sales knows?",
        "Who turns a change alert into an updated battlecard today?",
        "How many alerts a week turn out to be noise?",
      ],
      proof: ["A quote from a customer who switched and saved time each week", "A before/after of a battlecard kept current"],
      check_these: ["Whether they offer a free trial", "Which plans include Slack alerts"],
    },
  };
}
