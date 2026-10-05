// Pure helpers for finding a competitor's key pages.
// No network calls here, so these can be tested on sample HTML.

export type SourceType = "changelog" | "blog" | "feed" | "pricing" | "sitemap" | "other";

export const SOURCE_LABELS: Record<SourceType, string> = {
  changelog: "Release notes / changelog",
  blog: "Blog or guides",
  feed: "Blog feed (RSS)",
  pricing: "Pricing page",
  sitemap: "Sitemap",
  other: "Other page",
};

// Turns "https://www.Example.com/pricing" or "example.com" into "example.com".
// Returns null if it doesn't look like a domain.
export function normalizeDomain(input: string): string | null {
  let value = input.trim().toLowerCase();
  if (!value) return null;
  value = value.replace(/^[a-z]+:\/\//, "");
  value = value.split(/[/?#]/)[0];
  value = value.replace(/:\d+$/, "");
  value = value.replace(/^www\./, "");
  if (!/^[a-z0-9.-]+\.[a-z]{2,}$/.test(value)) return null;
  if (value.includes("..")) return null;
  return value;
}

// A readable company name from a domain: "acme-labs.io" → "Acme Labs".
export function nameFromDomain(domain: string): string {
  const base = domain.split(".")[0] ?? domain;
  return base
    .split("-")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

// True when a URL belongs to the competitor's own site (including subdomains like blog.example.com).
export function isSameSite(url: URL, domain: string): boolean {
  const host = url.hostname.toLowerCase().replace(/^www\./, "");
  return host === domain || host.endsWith(`.${domain}`);
}

const PATTERNS: { type: Exclude<SourceType, "feed" | "sitemap" | "other">; test: RegExp }[] = [
  { type: "pricing", test: /(^|\/)(pricing|plans|price)(\/|$|\.)/ },
  { type: "changelog", test: /(^|\/)(changelog|release-notes|releasenotes|releases|whats-new|what-s-new|product-updates|updates)(\/|$|\.)/ },
  { type: "blog", test: /(^|\/)(blog|resources|guides|articles|insights|learn|news)(\/|$|\.)/ },
];

export type Found = { type: SourceType; url: string };

// Reads a homepage's HTML and returns the best candidate URL for each page type.
export function parseHomepage(html: string, baseUrl: string, domain: string): Found[] {
  const found = new Map<SourceType, string>();

  // 1. Blog feeds declared in <link rel="alternate" type="application/rss+xml">.
  const linkTags = html.match(/<link\b[^>]*>/gi) ?? [];
  for (const tag of linkTags) {
    if (!/rel\s*=\s*["']?alternate/i.test(tag)) continue;
    if (!/type\s*=\s*["']?application\/(rss|atom)\+xml/i.test(tag)) continue;
    const href = attr(tag, "href");
    const url = resolve(href, baseUrl);
    if (url && isSameSite(url, domain) && !found.has("feed")) found.set("feed", clean(url));
  }

  // 2. Links in the page: pick the shortest matching path for each type.
  const best = new Map<SourceType, { url: string; score: number }>();
  const anchors = html.match(/<a\b[^>]*href\s*=\s*["'][^"']+["'][^>]*>/gi) ?? [];
  for (const tag of anchors) {
    const url = resolve(attr(tag, "href"), baseUrl);
    if (!url || !isSameSite(url, domain)) continue;
    const path = url.pathname.toLowerCase();
    const hostPart = url.hostname.toLowerCase().split(".")[0];
    for (const { type, test } of PATTERNS) {
      const subdomainMatch = test.test(`/${hostPart}/`) && path.length <= 1;
      if (!test.test(path) && !subdomainMatch) continue;
      if (path.replace(/\/+$/, "") === "" && !subdomainMatch) continue; // the homepage itself is never the page
      // Prefer short, top-level pages (/blog over /blog/2026/some-post), and for blogs prefer
      // a real blog or articles section over a press/news page.
      const blogRank = type === "blog" ? ["blog", "articles", "resources", "insights", "guides", "learn", "news"].findIndex((k) => path.includes(k)) : 0;
      const score = path.split("/").filter(Boolean).length * 100 + Math.max(0, blogRank) * 20 + path.length;
      const current = best.get(type);
      if (!current || score < current.score) best.set(type, { url: clean(url), score });
    }
  }
  for (const [type, { url }] of best) if (!found.has(type)) found.set(type, url);

  return [...found].map(([type, url]) => ({ type, url }));
}

// Common addresses to try when the homepage doesn't link to a page.
export function fallbackCandidates(domain: string, missing: SourceType[]): Found[] {
  const root = `https://${domain}`;
  const paths: Record<string, string[]> = {
    pricing: ["/pricing"],
    changelog: ["/changelog", "/release-notes"],
    blog: ["/blog"],
    feed: ["/feed", "/rss.xml", "/blog/feed", "/blog/rss.xml"],
    sitemap: ["/sitemap.xml"],
  };
  return missing.flatMap((type) => (paths[type] ?? []).map((p) => ({ type, url: root + p })));
}

function attr(tag: string, name: string): string | null {
  const m = tag.match(new RegExp(`${name}\\s*=\\s*["']([^"']+)["']`, "i"));
  return m ? m[1] : null;
}

function resolve(href: string | null, base: string): URL | null {
  if (!href || href.startsWith("#") || /^(mailto|tel|javascript):/i.test(href)) return null;
  try {
    const url = new URL(href.replace(/&amp;/g, "&"), base);
    return url.protocol === "https:" || url.protocol === "http:" ? url : null;
  } catch {
    return null;
  }
}

function clean(url: URL): string {
  url.hash = "";
  url.search = "";
  return url.toString().replace(/\/$/, "");
}
