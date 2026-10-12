// News about competitors: a Google News search feed per competitor name, and grouping of
// articles that cover the same story. Pure functions, no network, so they can be tested.

import type { FeedItem } from "@/lib/fetcher/extract";

// Same address the database builds in migration 0016 (keep the two in step).
export function newsFeedUrl(company: string): string {
  const q = company
    .trim()
    .replace(/%/g, "%25")
    .replace(/&/g, "%26")
    .replace(/"/g, "")
    .replace(/ /g, "+");
  return `https://news.google.com/rss/search?q=%22${q}%22+when:14d&hl=en-US&gl=US&ceid=US:en`;
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
    const { headline, outlet } = splitTitle(it.title);
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
