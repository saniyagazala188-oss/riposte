// Alternatives pages: one entry per tool. Facts about each tool come from its own website
// (or its parent company's), checked on the date in CHECKED. Re-check before changing a fact.
// Rules: be fair, no logos, no prices unless checked on the tool's own pricing page.

export const CHECKED = "2026-10-21";
export const CHECKED_LABEL = "21 October 2026";

export type Faq = { q: string; a: string };

// Short, fair descriptions used in the "other options" list on every page.
export const TOOLS = {
  riposte: {
    name: "Riposte",
    href: "/competitor-tracking-tool",
    what: "A competitor tracking tool for small marketing teams. It checks competitors' pricing, release notes, blogs, news and YouTube every morning, explains each change for your product and drafts the response.",
    pick: "you're a team of 1 to 5 marketers and want changes explained and turned into tasks, without a sales call. Free during the beta.",
  },
  crayon: {
    name: "Crayon",
    href: "/alternatives/crayon",
    what: "A competitive intelligence platform built around sales enablement: competitor monitoring, AI summaries that score each insight, battlecards inside tools like Salesforce and Highspot, and win/loss reporting.",
    pick: "you have a CI or product marketing team supporting a large sales team, and want battlecards and win rates in your CRM.",
  },
  klue: {
    name: "Klue",
    href: "/alternatives/klue",
    what: "An AI platform for competitive intelligence and win-loss. It pairs a Compete Agent that gathers intel for sellers with win-loss interviews, run by people or an AI interviewer.",
    pick: "learning why you win and lose deals matters as much as tracking competitors, and your sellers live in Salesforce.",
  },
  kompyte: {
    name: "Kompyte",
    href: "/alternatives/kompyte",
    what: "Competitive intelligence software from Semrush. It tracks competitors' public digital presence with web crawlers, and adds battlecards that update, automated workflows, ad and keyword research, and win/loss stats from your CRM.",
    pick: "you already use Semrush, or want ad and keyword research next to your competitor tracking.",
  },
  visualping: {
    name: "Visualping",
    href: "/alternatives/visualping",
    what: "A website change monitor. You pick pages, it checks them on a schedule and sends an alert with an AI summary when something changes. It has a free plan and paid plans for individuals and teams.",
    pick: "you want to watch a few specific pages cheaply and are happy to judge each change yourself.",
  },
  alerts: {
    name: "Google Alerts",
    href: "https://www.google.com/alerts",
    what: "A free Google service that emails you new web results mentioning a name or phrase.",
    pick: "you only need to know when a competitor is mentioned in the news, and nothing more.",
  },
} as const;

export type ToolKey = keyof typeof TOOLS;

export type Alt = {
  slug: Exclude<ToolKey, "riposte" | "alerts">;
  name: string;
  title: string; // <title>
  description: string; // meta description
  h1: string;
  shortAnswer: string; // the answer box at the top, written to be quoted
  about: string; // what the tool is, from its own site
  why: [string, string][]; // why small teams look elsewhere
  table: [string, string, string][]; // [row, tool, riposte]
  fits: string[]; // where Riposte fits
  notFit: string[]; // where the tool is the better choice
  others: ToolKey[]; // other options, in order (Riposte is always first)
  faqs: Faq[];
  sources: [string, string][]; // [label, url]
  img: { src: string; alt: string };
};

const RIPOSTE_FITS = [
  "You're a team of 1 to 5 marketers, or a founder doing the marketing.",
  "You want each change explained for your own product, not a generic summary.",
  "You want the response drafted for you: a battlecard update, a comparison page change, a post or a Slack note, each with an owner.",
  "You want news, YouTube and AI answers covered as well as competitors' own pages.",
  "You want to start today, for free, without a sales call.",
];

export const ALTERNATIVES: Alt[] = [
  {
    slug: "crayon",
    name: "Crayon",
    title: "Crayon Alternatives for Small Marketing Teams (2026) | Riposte",
    description:
      "Looking for a Crayon alternative? Compare Riposte, Klue, Kompyte, Visualping and Google Alerts on what they track, who they're built for and how pricing works.",
    h1: "Crayon alternatives for small marketing teams",
    shortAnswer:
      "Crayon is built for sales enablement at larger companies, with battlecards, win/loss reporting and pricing by demo. If you're a small marketing team, Riposte is a lighter alternative: it checks competitors every morning, explains each change for your product and drafts the response, free during its beta. If you need win-loss interviews, Klue is the closest match. If you use Semrush, look at Kompyte.",
    about:
      "Crayon calls itself a competitive intelligence platform that monitors your competitors. Its focus is helping sales win: Crayon AI summarizes competitor news and scores how important each insight is, battlecards show up in the tools reps already use, and reports cover win/loss and battlecard use. It connects with tools like Salesforce, HubSpot, Slack, Microsoft Teams, Highspot and Gong. Pricing isn't published; you start with a demo.",
    why: [
      ["You don't run a sales enablement program", "Much of Crayon's value is in battlecards, rep leaderboards and influenced revenue. A small marketing team often just needs to know what changed and what to do about it."],
      ["You want to try it before a sales call", "Crayon's site offers a demo and a product tour, but no public pricing or free plan. Small teams often want to start on their own."],
      ["You want the response, not only the insight", "Crayon summarizes and scores changes. Some teams also want the next step written: the battlecard line, the page update or the post."],
    ],
    table: [
      ["Built for", "CI, product marketing and sales teams at larger companies", "Teams of 1 to 5 marketers"],
      ["What it watches", "Competitors' websites and other public sources", "Pricing, release notes, blogs and sitemaps, news, YouTube, AI answers"],
      ["Explains why a change matters", "AI summaries with an importance score", "Yes, written for your own product"],
      ["Drafts the response", "Battlecards and newsletters you build", "Yes: tasks, owners and first drafts"],
      ["Win/loss", "Yes", "No"],
      ["CRM integration", "Yes, including Salesforce and HubSpot", "No"],
      ["Alerts", "Email, Slack and Microsoft Teams", "Email and Slack"],
      ["Pricing", "Not published, by demo", "Free during the beta"],
    ],
    fits: RIPOSTE_FITS,
    notFit: [
      "You run a competitive program for a large sales team and need battlecards inside Salesforce or Highspot.",
      "You need win/loss reporting and to show influenced revenue.",
      "You track more than 5 competitors, or need X and LinkedIn covered today.",
    ],
    others: ["riposte", "klue", "kompyte", "visualping", "alerts"],
    faqs: [
      { q: "What is the best Crayon alternative for a small team?", a: "For a team of 1 to 5 marketers, Riposte is built for that size: it checks competitors every morning, explains each change for your product and drafts the response, and it's free during the beta. Larger teams that need win-loss programs usually compare Crayon with Klue." },
      { q: "Does Crayon have a free plan or public pricing?", a: `Not that we could find. As of ${CHECKED_LABEL}, Crayon's website doesn't publish prices or a free plan. It offers a demo and a product tour.` },
      { q: "Is there a free alternative to Crayon?", a: "Riposte is free during its beta. Google Alerts is free but only covers news mentions. Visualping has a free plan for watching up to 5 pages." },
      { q: "What does Crayon do that Riposte doesn't?", a: "Crayon has CRM integrations, battlecards inside sales tools, win/loss analysis and reports on how battlecards are used. Riposte doesn't do these. It focuses on spotting changes, explaining them and drafting the response." },
      { q: "Can I move from Crayon to Riposte?", a: "Yes. Add your product and up to 5 competitors' websites. Riposte finds their pricing page, release notes, blog, news and YouTube channel on its own, so setup takes about five minutes." },
    ],
    sources: [
      ["Crayon homepage", "https://www.crayon.co/"],
      ["Crayon integrations", "https://www.crayon.co/integrations"],
    ],
    img: { src: "/docs/kits/kit.jpg", alt: "A Riposte action kit with tasks, owners and first drafts" },
  },
  {
    slug: "klue",
    name: "Klue",
    title: "Klue Alternatives for Small Marketing Teams (2026) | Riposte",
    description:
      "Looking for a Klue alternative? Compare Riposte, Crayon, Kompyte, Visualping and Google Alerts on what they track, who they're built for and how pricing works.",
    h1: "Klue alternatives for small marketing teams",
    shortAnswer:
      "Klue is an AI platform for competitive intelligence and win-loss, built for CI teams and sellers at larger companies, with pricing by demo. If you're a small marketing team that mainly needs to know what competitors changed and what to do about it, Riposte is a lighter alternative, free during its beta. If you want battlecards in your CRM but not win-loss interviews, compare Crayon and Kompyte.",
    about:
      "Klue describes itself as the AI platform for competitive intelligence and win-loss. It has two halves: a Compete Agent that gathers competitive intel and brings it to sellers, and a win-loss suite with human expert interviews, an AI interviewer and stories written from CRM data and call recordings when a deal closes. Battlecards sit inside Salesforce, and intel can be searched in Glean. Pricing isn't published; you start with a demo.",
    why: [
      ["You don't need win-loss interviews yet", "Win-loss is a big part of Klue. If you don't have many deals to study, or no CI program, you may be paying for more than you use."],
      ["Your sellers aren't in Salesforce", "Many of Klue's features meet sellers inside Salesforce. Small teams without a CRM-driven sales process get less from that."],
      ["You want to start without a demo", "Klue's site asks you to book a demo. Small teams often want to try a tool on their own competitors first."],
    ],
    table: [
      ["Built for", "CI and win-loss teams, product marketers and sellers", "Teams of 1 to 5 marketers"],
      ["What it watches", "Competitive intel gathered by its Compete Agent", "Pricing, release notes, blogs and sitemaps, news, YouTube, AI answers"],
      ["Explains why a change matters", "Yes, through auto-generated insights", "Yes, written for your own product"],
      ["Drafts the response", "Battlecards and deal support for sellers", "Yes: tasks, owners and first drafts"],
      ["Win-loss", "Yes, interviews by people or an AI interviewer", "No"],
      ["CRM integration", "Yes, Salesforce", "No"],
      ["Pricing", "Not published, by demo", "Free during the beta"],
    ],
    fits: RIPOSTE_FITS,
    notFit: [
      "You want to run win-loss interviews and learn why deals are won and lost.",
      "Your sellers work in Salesforce and need battlecards there.",
      "You track more than 5 competitors, or need X and LinkedIn covered today.",
    ],
    others: ["riposte", "crayon", "kompyte", "visualping", "alerts"],
    faqs: [
      { q: "What is the best Klue alternative for a small team?", a: "For a team of 1 to 5 marketers that mainly needs competitor changes explained and acted on, Riposte is built for that size and is free during the beta. If you need battlecards in a CRM without win-loss interviews, compare Crayon and Kompyte." },
      { q: "Does Klue publish its pricing?", a: `Not that we could find. As of ${CHECKED_LABEL}, Klue's website doesn't list prices or a free plan, and asks you to book a demo.` },
      { q: "Is Klue a win-loss tool or a competitive intelligence tool?", a: "Both. Klue pairs competitive intelligence (its Compete Agent and battlecards) with a win-loss suite of buyer and seller interviews." },
      { q: "What does Klue do that Riposte doesn't?", a: "Klue runs win-loss interviews, puts battlecards inside Salesforce and connects to Glean. Riposte does none of these. It watches competitors' pages, news and YouTube, explains each change for your product and drafts the response." },
      { q: "Is there a free alternative to Klue?", a: "Riposte is free during its beta. Google Alerts is free for news mentions, and Visualping has a free plan for watching up to 5 pages." },
    ],
    sources: [
      ["Klue homepage", "https://klue.com/"],
      ["Klue for Salesforce", "https://klue.com/salesforce"],
    ],
    img: { src: "/docs/compare/update.jpg", alt: "Riposte suggesting an update to a comparison page after a competitor change" },
  },
  {
    slug: "kompyte",
    name: "Kompyte",
    title: "Kompyte Alternatives for Small Marketing Teams (2026) | Riposte",
    description:
      "Looking for a Kompyte alternative? Compare Riposte, Crayon, Klue, Visualping and Google Alerts on what they track, who they're built for and how pricing works.",
    h1: "Kompyte alternatives for small marketing teams",
    shortAnswer:
      "Kompyte is Semrush's competitive intelligence software for go-to-market teams, with battlecards, automated workflows and quote-based pricing. If you're a small marketing team that wants each competitor change explained for your product and the response drafted, Riposte is a lighter alternative, free during its beta. For win-loss interviews, look at Klue.",
    about:
      "Semrush describes Kompyte as competitive intelligence software for go-to-market teams. It uses web crawlers to track competitors' public digital presence, with an AI-assisted feed, company profiles, battlecards that update as things change, custom reports and automated workflows for tagging and assigning intel. It also has ad and keyword research, and win/loss stats from CRMs like Salesforce and HubSpot. Semrush subscribers get a discount.",
    why: [
      ["You don't need a full CI workspace", "Profiles, reports, workflows and battlecard analytics are built for teams that share intel across sales, marketing and leadership. A small team may only need the changes and what to do about them."],
      ["You want a price before you talk to sales", "Kompyte's pricing isn't published. Small teams often want to know the cost, or try it for free, first."],
      ["You want the response written", "Kompyte collects and organizes intel. Some teams also want the next step drafted for them."],
    ],
    table: [
      ["Built for", "Go-to-market teams: sales, marketing, revenue and leadership", "Teams of 1 to 5 marketers"],
      ["What it watches", "Competitors' public digital presence, via web crawlers", "Pricing, release notes, blogs and sitemaps, news, YouTube, AI answers"],
      ["Explains why a change matters", "AI-assisted feed with filters", "Yes, written for your own product"],
      ["Drafts the response", "Battlecards and reports you build", "Yes: tasks, owners and first drafts"],
      ["Ad and keyword research", "Yes", "No"],
      ["Win/loss", "Win/loss stats from your CRM", "No"],
      ["Pricing", "Quote-based, discount for Semrush subscribers", "Free during the beta"],
    ],
    fits: RIPOSTE_FITS,
    notFit: [
      "You already pay for Semrush and want competitor tracking in the same place.",
      "You need ad and keyword research next to your competitor intel.",
      "You track more than 5 competitors, or need X and LinkedIn covered today.",
    ],
    others: ["riposte", "crayon", "klue", "visualping", "alerts"],
    faqs: [
      { q: "What is the best Kompyte alternative for a small team?", a: "For a team of 1 to 5 marketers, Riposte is built for that size: it checks competitors every morning, explains each change for your product and drafts the response, free during the beta. For win-loss interviews, look at Klue." },
      { q: "Is Kompyte part of Semrush?", a: "Yes. Kompyte is competitive intelligence software from Semrush, and paid Semrush subscribers are eligible for a discount on it." },
      { q: "Does Kompyte publish its pricing?", a: `Not that we could find. As of ${CHECKED_LABEL}, Kompyte's pricing isn't published and is quote-based.` },
      { q: "What does Kompyte do that Riposte doesn't?", a: "Kompyte has ad and keyword research, custom reports, automated workflows for sharing intel and win/loss stats from your CRM. Riposte doesn't. It focuses on spotting changes, explaining them for your product and drafting the response." },
      { q: "Is there a free alternative to Kompyte?", a: "Riposte is free during its beta. Google Alerts is free for news mentions, and Visualping has a free plan for watching up to 5 pages." },
      { q: "Is NinjaReports better than Kompyte?", a: "They do different jobs, so it depends on what you need. As of 31 October 2026, NinjaReports describes itself as SEO reporting software, powered by SE Ranking, for freelancers and agencies that build branded client reports from tools like Google Search Console, GA4 and Facebook Ads. Kompyte is competitive intelligence software for go-to-market teams that tracks competitors' websites and turns what changes into battlecards, so pick NinjaReports for client reporting and Kompyte for tracking competitors." },
    ],
    sources: [
      ["Kompyte, on the Semrush knowledge base", "https://www.semrush.com/kb/1260-kompyte"],
      ["Kompyte by Semrush and IcebergIQ (Semrush news)", "https://www.semrush.com/news/257357-kompyte-by-semrush-joins-forces-with-icebergiq-to-transform-competitive-intelligence/"],
      ["NinjaReports, on its own site", "https://ninjareports.com/seo-reporting/"],
    ],
    img: { src: "/docs/news/tabs.jpg", alt: "Riposte's news and YouTube tabs for a competitor" },
  },
  {
    slug: "visualping",
    name: "Visualping",
    title: "Visualping Alternatives for Competitor Tracking (2026) | Riposte",
    description:
      "Looking for a Visualping alternative for tracking competitors? Compare Riposte, Crayon, Klue, Kompyte and Google Alerts on what they track, what they explain and how pricing works.",
    h1: "Visualping alternatives for competitor tracking",
    shortAnswer:
      "Visualping is a website change monitor: it tells you when a page you picked has changed, with an AI summary. If you're using it to track competitors and want to know why a change matters and what to do about it, Riposte is built for that: it watches competitors' pricing, release notes, blogs, news and YouTube, explains each change for your product and drafts the response, free during its beta.",
    about:
      "Visualping monitors website changes. You choose the pages, it checks them on a schedule and alerts you when something changes, with an AI summary and a flag for whether the change looks important. Competitor monitoring is one of its listed uses. As of 21 October 2026 it has a free plan (5 pages, 150 checks a month), Personal plans from $14 a month, and Business plans from $140 a month that add Slack and Microsoft Teams alerts.",
    why: [
      ["You have to choose every page yourself", "Visualping watches the pages you give it. Tracking a competitor well means finding their pricing page, changelog, blog and news yourself, and keeping that list current."],
      ["A change isn't a decision", "Its AI summarizes what changed on the page. It doesn't know your product, so deciding whether it matters, and what to do, is still on you."],
      ["News and YouTube aren't pages", "Competitors also move in press coverage, videos and AI answers, which a page monitor isn't built to follow."],
    ],
    table: [
      ["Built for", "Anyone who needs to watch web pages", "Teams of 1 to 5 marketers"],
      ["What it watches", "The pages you choose", "Pricing, release notes, blogs and sitemaps, news, YouTube, AI answers, found for you"],
      ["Explains why a change matters", "AI summary of the page change, with an importance flag", "Yes, written for your own product"],
      ["Drafts the response", "No", "Yes: tasks, owners and first drafts"],
      ["Check frequency", "From every 60 minutes (free) to every 2 minutes", "Every morning"],
      ["Slack alerts", "On Business plans", "Yes"],
      ["Pricing", "Free plan; Personal from $14/month; Business from $140/month", "Free during the beta"],
    ],
    fits: RIPOSTE_FITS,
    notFit: [
      "You need to know within minutes when a page changes, not the next morning.",
      "You're watching pages that aren't competitors, like regulations, stock or job listings.",
      "You want to watch many pages across lots of sites on a budget.",
    ],
    others: ["riposte", "crayon", "klue", "kompyte", "alerts"],
    faqs: [
      { q: "What is the best Visualping alternative for tracking competitors?", a: "If you want to know why a competitor's change matters and what to do about it, Riposte is built for that. It finds each competitor's pricing, release notes, blog, news and YouTube on its own, explains each change for your product and drafts the response. It's free during the beta." },
      { q: "Is Visualping free?", a: `Visualping has a free plan. As of ${CHECKED_LABEL} it covers 5 pages and 150 checks a month, checking at most every 60 minutes, with email alerts. Paid Personal plans start at $14 a month.` },
      { q: "What's the difference between a page monitor and a competitor tracking tool?", a: "A page monitor tells you that a page changed. A competitor tracking tool tells you what changed, whether it matters, why it matters for your product and what to do next." },
      { q: "What does Visualping do that Riposte doesn't?", a: "Visualping can check any page, as often as every 2 minutes, and alert you by SMS, webhook and more. Riposte only tracks competitors, checks once every morning and covers up to 5 competitors during the beta." },
      { q: "Can Riposte send alerts to Slack like Visualping?", a: "Yes. High-impact changes go to Slack or email the morning they're found, and a summary of the week arrives every Monday." },
    ],
    sources: [
      ["Visualping pricing", "https://visualping.io/business/pricing/"],
    ],
    img: { src: "/docs/feed/views.jpg", alt: "Riposte feed with signals to review and noise filtered out" },
  },
];

export const getAlt = (slug: string) => ALTERNATIVES.find((a) => a.slug === slug);

// How to choose: shared by the hub and every page.
export const HOW_TO_CHOOSE: [string, string][] = [
  ["How big is your team?", "Large CI, product marketing and sales teams get the most from Crayon, Klue and Kompyte. Teams of 1 to 5 marketers usually need something lighter."],
  ["Do you need win-loss?", "If learning why you win and lose deals is the goal, Klue and Crayon cover it. Riposte and Visualping don't."],
  ["Do you want changes explained, or just flagged?", "A page monitor like Visualping flags changes. Riposte explains each change for your product and drafts the response."],
  ["How do you want to buy?", "Crayon, Klue and Kompyte start with a demo or quote. Visualping has public prices and a free plan. Riposte is free during its beta."],
];
