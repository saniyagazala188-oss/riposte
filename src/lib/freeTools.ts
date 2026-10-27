// Every free tool Riposte offers, in one list. The /tools hub, the footer, the sitemap and
// llms.txt all read from here, so a new tool only needs one entry to show up everywhere.

export type FreeTool = {
  slug: string; // lives at /tools/<slug>
  name: string;
  short: string; // one line for cards and the footer
  gives: string[]; // what you get, in plain words
  category: "Sales enablement" | "AI search" | "Competitor research";
  status: "live" | "soon";
  launched?: string; // YYYY-MM-DD, live tools only
  time: string; // how long one run takes
  cta?: string; // link text on the hub card, when "Open the <name>" reads badly
};

export const FREE_TOOLS: FreeTool[] = [
  {
    slug: "battlecard-generator",
    name: "Battlecard generator",
    short: "A one-page sales battlecard from any competitor's website.",
    gives: ["Who they are and who they sell to", "Why you win, and why you lose", "Pricing, objections and answers", "Questions to ask on calls"],
    category: "Sales enablement",
    status: "live",
    launched: "2026-10-21",
    time: "About 30 seconds",
  },
  {
    slug: "ai-recommendation-checker",
    name: "Does AI recommend you?",
    short: "See which brands AI tools recommend for your buyers' questions, and whether you're one of them.",
    gives: ["Who gets recommended for your category", "Whether your brand shows up", "Which pages the answers lean on", "What to write to close the gap"],
    category: "AI search",
    status: "live",
    launched: "2026-10-27",
    time: "Under a minute",
    cta: "Check if AI recommends you",
  },
];

export const LIVE_TOOLS = FREE_TOOLS.filter((t) => t.status === "live");
export const toolHref = (t: FreeTool) => `/tools/${t.slug}`;
export const CATEGORIES = [...new Set(FREE_TOOLS.map((t) => t.category))];
