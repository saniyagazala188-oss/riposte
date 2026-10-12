// News about competitors: a GDELT news search feed per competitor name, and grouping of
// articles that cover the same story. Pure functions, no network, so they can be tested.

import type { FeedItem } from "@/lib/fetcher/extract";

// News comes from GDELT (api.gdeltproject.org), a free, open news database built for
// programs to read. (Google News asks bots not to read its search feeds, so it isn't used.)
// The search is the exact company name, English-language news, last 14 days, newest first.
export function newsFeedUrl(company: string): string {
  const phrase = encodeURIComponent(`"${company.trim().replace(/"/g, "")}"`);
  return `https://api.gdeltproject.org/api/v2/doc/doc?query=${phrase}%20sourcelang:english&mode=ArtList&format=RSS&timespan=14d&maxrecords=50&sort=DateDesc`;
}

export const isGdelt = (url: string) => url.startsWith("https://api.gdeltproject.org/");

// The company name inside a news source address (GDELT, or the older Google News one).
export function companyFromNewsUrl(url: string): string | null {
  try {
    const u = new URL(url);
    const q = u.searchParams.get("query") ?? u.searchParams.get("q") ?? "";
    const m = q.match(/"([^"]+)"/);
    return m ? m[1].trim() : null;
  } catch {
    return null;
  }
}

// Old Google News sources are moved to GDELT the next time they are checked.
export function upgradeNewsUrl(url: string): string | null {
  if (isGdelt(url)) return null;
  const name = companyFromNewsUrl(url);
  return name ? newsFeedUrl(name) : null;
}

// A page a person can open to see the same news (the feed itself isn't meant for reading).
export function humanNewsUrl(url: string): string {
  const name = companyFromNewsUrl(url);
  return name ? `https://news.google.com/search?q=${encodeURIComponent(`"${name}"`)}` : url;
}

export function outletFromLink(link: string): string | null {
  try {
    return new URL(link).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

export type NewsArticle = { title: string; outlet: string | null; link: string; date: string | null };

// Google News titles look like "Acme raises $20M to grow its AI agent - TechCrunch".
export function splitTitle(title: string): { headline: string; outlet: string | null } {
  const m = title.match(/^(.*\S)\s+[-–—|]\s+([^-–—|]{2,60})$/);
  return m ? { headline: m[1], outlet: m[2].trim() } : { headline: title, outlet: null };
}

const STOP = new Set(
  "a an the and or of to for in on at by with from as is are was were be its it this that new over into after about up says said".split(" "),
);

export function words(headline: string): Set<string> {
  return new Set(
    headline
      .toLowerCase()
      .replace(/[^\p{L}\p{N}$%.\s]/gu, " ")
      .split(/\s+/)
      .map((w) => w.replace(/\.$/, ""))
      .filter((w) => w.length > 1 && !STOP.has(w)),
  );
}

// Two headlines are the same story when most of their words overlap.
export function sameStory(a: string, b: string): boolean {
  const x = words(a);
  const y = words(b);
  if (!x.size || !y.size) return false;
  let shared = 0;
  for (const w of x) if (y.has(w)) shared++;
  return shared / Math.min(x.size, y.size) >= 0.6;
}

export type NewsStory = { headline: string; articles: NewsArticle[] };

// Groups new feed items into stories, newest first, and leaves out stories already seen
// (headlines from earlier news changes for this competitor).
export function groupStories(items: FeedItem[], seenHeadlines: string[] = [], maxStories = 8): NewsStory[] {
  const stories: NewsStory[] = [];
  const sorted = [...items].sort((a, b) => (Date.parse(b.date ?? "") || 0) - (Date.parse(a.date ?? "") || 0));
  for (const it of sorted) {
    // GDELT titles are plain headlines; the outlet comes from the article's address.
    const headline = it.title;
    const outlet = outletFromLink(it.link);
    if (seenHeadlines.some((h) => sameStory(h, headline))) continue;
    const article = { title: headline, outlet, link: it.link, date: it.date };
    const home = stories.find((s) => sameStory(s.headline, headline));
    if (home) {
      if (home.articles.length < 6) home.articles.push(article);
    } else {
      stories.push({ headline, articles: [article] });
    }
  }
  return stories.slice(0, maxStories);
}
