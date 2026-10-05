// Content intelligence: publishing pace from a blog feed, and the mix of pages from a sitemap.
// Pure functions, no network, so they can be tested.

export type FeedItem = { id: string; title: string; link: string; date: string | null };

const DAY = 24 * 60 * 60 * 1000;

export type Pace = {
  dated: number; // posts with a readable date
  last30: number;
  last90: number;
  perMonth: { month: string; count: number }[]; // last 6 months, oldest first
  latest: { title: string; link: string; date: string }[];
  newest: string | null;
};

// How often a competitor publishes, from the posts in its blog feed.
export function paceFromFeed(items: FeedItem[], now = Date.now()): Pace {
  const dated = items
    .map((i) => ({ ...i, t: i.date ? Date.parse(i.date) : NaN }))
    .filter((i) => Number.isFinite(i.t) && i.t <= now + DAY)
    .sort((a, b) => b.t - a.t);

  const months: { month: string; count: number; start: number; end: number }[] = [];
  const d = new Date(now);
  for (let k = 5; k >= 0; k--) {
    const start = Date.UTC(d.getUTCFullYear(), d.getUTCMonth() - k, 1);
    const end = Date.UTC(d.getUTCFullYear(), d.getUTCMonth() - k + 1, 1);
    const month = new Date(start).toLocaleDateString("en-GB", { month: "short", timeZone: "UTC" });
    months.push({ month, count: 0, start, end });
  }
  for (const i of dated) {
    const m = months.find((x) => i.t >= x.start && i.t < x.end);
    if (m) m.count++;
  }

  return {
    dated: dated.length,
    last30: dated.filter((i) => now - i.t <= 30 * DAY).length,
    last90: dated.filter((i) => now - i.t <= 90 * DAY).length,
    perMonth: months.map(({ month, count }) => ({ month, count })),
    latest: dated.slice(0, 8).map((i) => ({ title: i.title, link: i.link, date: new Date(i.t).toISOString() })),
    newest: dated[0] ? new Date(dated[0].t).toISOString() : null,
  };
}

// Groups that marketers care about, recognised from the page address.
const KINDS: { key: string; label: string; test: RegExp }[] = [
  { key: "compare", label: "Comparison & alternatives", test: /(^|[/-])(vs|versus|alternatives?|compare|comparison|competitors?)([/-]|$)/i },
  { key: "answers", label: "Answer pages for AI search", test: /\/(topics?|questions?|answers?|faqs?|llm-info|llms?\.txt|ai-info)(\/|$|\.)/i },
  { key: "blog", label: "Blog posts", test: /\/(blog|blogs|posts?|articles?|news|insights)\//i },
  { key: "guides", label: "Guides & learning", test: /\/(guides?|learn|academy|resources?|library|ebooks?|whitepapers?|webinars?|glossary|tutorials?|docs?|how-to)\b/i },
  { key: "customers", label: "Customer stories", test: /\/(customers?|case-stud(y|ies)|success-stor(y|ies)|testimonials?)\b/i },
  { key: "product", label: "Product & features", test: /\/(product|products|features?|platform|solutions?|use-cases?|integrations?)\b/i },
  { key: "changelog", label: "Release notes", test: /\/(changelog|release-notes|releases|whats-new|updates)\b/i },
];

export type PageMix = { total: number; groups: { key: string; label: string; count: number; examples: string[] }[] };

// What kind of pages a competitor has, from the addresses in its sitemap.
export function pageMix(urls: string[]): PageMix {
  const groups = KINDS.map((k) => ({ key: k.key, label: k.label, count: 0, examples: [] as string[] }));
  for (const u of urls) {
    let path: string;
    try {
      path = new URL(u).pathname.toLowerCase();
    } catch {
      continue;
    }
    const i = KINDS.findIndex((k) => k.test.test(path)); // first match wins: comparison pages before blog posts
    if (i >= 0) {
      groups[i].count++;
      if (groups[i].examples.length < 5) groups[i].examples.push(u);
    }
  }
  return { total: urls.length, groups: groups.filter((g) => g.count > 0).sort((a, b) => b.count - a.count) };
}

// A readable title from a page address: ".../blog/visual-regression-testing-guide" → "visual regression testing guide".
export function titleFromUrl(u: string): string {
  try {
    const last = new URL(u).pathname.split("/").filter(Boolean).pop() ?? "";
    return decodeURIComponent(last).replace(/\.(html?|php|aspx?)$/i, "").replace(/[-_]+/g, " ").trim();
  } catch {
    return "";
  }
}

// The titles to analyse for topics: feed titles first, then blog addresses from the sitemap.
export function titlesForTopics(feed: FeedItem[], urls: string[], max = 120): string[] {
  const out = new Set<string>();
  for (const i of feed) if (i.title) out.add(i.title.slice(0, 160));
  const pathOf = (u: string) => {
    try {
      return new URL(u).pathname;
    } catch {
      return "";
    }
  };
  const blogish = urls.filter((u) => KINDS.slice(0, 4).some((k) => k.test.test(pathOf(u))));
  for (const u of blogish) {
    if (out.size >= max) break;
    const t = titleFromUrl(u);
    if (t.length > 8) out.add(t);
  }
  return [...out].slice(0, max);
}

// True for pages a content marketer cares about: blog posts, guides, comparison and answer pages.
export function isContentUrl(u: string): boolean {
  let path = "";
  try {
    path = new URL(u).pathname.toLowerCase();
  } catch {
    return false;
  }
  return KINDS.filter((k) => ["compare", "answers", "blog", "guides"].includes(k.key)).some((k) => k.test.test(path));
}
