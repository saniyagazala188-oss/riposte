// Pure helpers for the fetcher: turn a page into comparable content, parse feeds
// and sitemaps, and compare two checks. No network calls, so all of this can be tested.

import { createHash } from "node:crypto";
import * as cheerio from "cheerio";
import { XMLParser } from "fast-xml-parser";

export const MAX_LINES = 3000;
const MAX_LINE_LENGTH = 1000;

// ---------- noise filter ----------

const RELATIVE_TIME =
  /\b(?:\d+|an?|one)\s+(?:second|sec|minute|min|hour|hr|day|week|month|year)s?\s+ago\b|\bjust now\b/gi;
const ENGAGEMENT_COUNT = /\b[\d.,]+\s*[km]?\s+(?:views|reads|likes|comments|shares|reactions|downloads)\b/gi;
const READ_TIME = /\b\d+\s*(?:-|–)?\s*min(?:ute)?s?\s+read\b/gi;
const COPYRIGHT = /^(?:©|\(c\)|copyright\b)/i;
const ONLY_DATE =
  /^(?:(?:mon|tue|wed|thu|fri|sat|sun)[a-z]*,?\s+)?(?:\d{1,2}[\s/.-])?(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?(?:[\s/.-]\d{1,2})?,?\s*\d{2,4}$|^\d{4}-\d{2}-\d{2}$|^\d{1,2}[/.]\d{1,2}[/.]\d{2,4}$/i;

// Cleans one line of text. Returns "" when the whole line is noise.
export function normalizeLine(raw: string): string {
  let line = raw.replace(/\s+/g, " ").trim();
  if (!line) return "";
  if (COPYRIGHT.test(line)) return "";
  line = line.replace(RELATIVE_TIME, "").replace(ENGAGEMENT_COUNT, "").replace(READ_TIME, "");
  line = line.replace(/\s+/g, " ").replace(/^[\s·•|,-]+|[\s·•|,-]+$/g, "").trim();
  if (line.length < 2) return "";
  if (ONLY_DATE.test(line)) return "";
  return line.length > MAX_LINE_LENGTH ? line.slice(0, MAX_LINE_LENGTH) : line;
}

// Cleans a list of lines: removes noise, empty lines and repeats.
export function cleanLines(rawLines: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of rawLines) {
    const line = normalizeLine(raw);
    if (!line || seen.has(line)) continue;
    seen.add(line);
    out.push(line);
    if (out.length >= MAX_LINES) break;
  }
  return out;
}

// ---------- HTML pages ----------

const DROP = [
  "script", "style", "noscript", "svg", "iframe", "template", "canvas", "video", "audio",
  "nav", "footer", "form", "dialog", "button", "select",
  "[role=navigation]", "[role=contentinfo]", "[role=dialog]", "[aria-hidden=true]", "[hidden]",
].join(",");
const NOISE_ATTR =
  /(cookie|consent|gdpr|onetrust|announcement|promo-?bar|top-?bar|popup|modal|newsletter|subscribe|chat-?widget|intercom|drift|hubspot-messages|toast|skip-link|breadcrumb|share|social)/;
const BLOCKS = "h1,h2,h3,h4,h5,h6,p,li,td,th,dt,dd,blockquote,pre,figcaption,div,section,article,tr,header,main,aside,summary,label";

// Turns an HTML page into clean lines of its main content.
export function htmlToLines(html: string): string[] {
  const $ = cheerio.load(html);
  $(DROP).remove();
  $("[class],[id]").each((_, el) => {
    const attrs = (el as { attribs?: Record<string, string> }).attribs ?? {};
    const value = `${attrs.class ?? ""} ${attrs.id ?? ""}`.toLowerCase();
    if (NOISE_ATTR.test(value)) $(el).remove();
  });
  // Site-wide headers sit outside the main content; article headers sit inside it.
  $("header").each((_, el) => {
    if ($(el).parents("main,article").length === 0) $(el).remove();
  });

  const main = $("main").first();
  const articles = $("article");
  let root = $("body");
  if (main.length && main.text().trim().length > 200) root = main;
  else if (articles.length === 1 && articles.text().trim().length > 200) root = articles.first();

  root.find("br").replaceWith("\n");
  root.find(BLOCKS).each((_, el) => {
    $(el).prepend("\n").append("\n");
  });
  return cleanLines(root.text().split("\n"));
}

// Turns the plain text from a page-reading service into clean lines.
export function readerTextToLines(text: string): string[] {
  const body = text.split(/\n/).filter((l) => !/^(Title|URL Source|Published Time|Markdown Content|Warning):/.test(l));
  return cleanLines(
    body.map((l) =>
      l
        .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
        .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
        .replace(/^#+\s*|^[*-]\s+|^>\s*/g, ""),
    ),
  );
}

// ---------- feeds (RSS and Atom) ----------

export type FeedItem = { id: string; title: string; link: string; date: string | null };

const xml = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@_", textNodeName: "#text" });

function text(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string" || typeof value === "number") return String(value).trim();
  if (Array.isArray(value)) return text(value[0]);
  if (typeof value === "object") {
    const v = value as Record<string, unknown>;
    return text(v["#text"] ?? v["@_href"] ?? "");
  }
  return "";
}

function asArray<T>(value: T | T[] | undefined): T[] {
  if (value == null) return [];
  return Array.isArray(value) ? value : [value];
}

export function parseFeed(body: string): FeedItem[] | null {
  let doc: Record<string, unknown>;
  try {
    doc = xml.parse(body);
  } catch {
    return null;
  }
  const rss = doc.rss as { channel?: { item?: unknown } } | undefined;
  const atom = doc.feed as { entry?: unknown } | undefined;
  const rdf = doc["rdf:RDF"] as { item?: unknown } | undefined;
  const raw = rss?.channel?.item ?? atom?.entry ?? rdf?.item;
  if (!rss && !atom && !rdf) return null;

  return asArray(raw as Record<string, unknown>[])
    .slice(0, 200)
    .map((it) => {
      let link = "";
      const l = it.link;
      if (Array.isArray(l)) {
        const alt = l.find((x) => typeof x === "object" && (x as Record<string, string>)["@_rel"] !== "self") ?? l[0];
        link = text(alt);
      } else link = text(l);
      const title = normalizeLine(text(it.title)) || link;
      const date = text(it.pubDate ?? it.published ?? it.updated ?? it["dc:date"]) || null;
      const id = link || text(it.guid ?? it.id) || title;
      return { id, title, link, date };
    })
    .filter((it) => it.id);
}

// ---------- sitemaps ----------

export type SitemapResult = { urls: string[]; children: string[]; lastmod: Record<string, string> };

// Reads page addresses from a sitemap. Uses pattern matching instead of a full XML parse,
// so a very large sitemap that was cut off part-way still gives every complete entry.
export function parseSitemap(body: string): SitemapResult | null {
  const head = body.slice(0, 5000);
  const isUrlset = /<(?:[\w-]+:)?urlset\b/i.test(head);
  const isIndex = /<(?:[\w-]+:)?sitemapindex\b/i.test(head);
  if (!isUrlset && !isIndex) return null;
  const decode = (v: string) => v.trim().replace(/^<!\[CDATA\[|\]\]>$/g, "").replace(/&amp;/g, "&");
  const collect = (block: RegExp) => {
    const out: string[] = [];
    for (const m of body.matchAll(block)) {
      const loc = m[1].match(/<loc>([\s\S]*?)<\/loc>/i);
      if (loc) out.push(decode(loc[1]));
    }
    return out.filter((u) => /^https?:\/\//i.test(u));
  };
  // A page entry's own <loc> is plain; image and video entries use <image:loc> and similar.
  const urls = isUrlset ? collect(/<url\b[^>]*>([\s\S]*?)<\/url>/gi) : [];
  const children = isIndex ? collect(/<sitemap\b[^>]*>([\s\S]*?)<\/sitemap>/gi) : [];
  // When each page was last changed, if the sitemap says so (used to spot rewritten pages).
  const lastmod: Record<string, string> = {};
  if (isUrlset) {
    for (const m of body.matchAll(/<url\b[^>]*>([\s\S]*?)<\/url>/gi)) {
      const loc = m[1].match(/<loc>([\s\S]*?)<\/loc>/i);
      const mod = m[1].match(/<lastmod>([\s\S]*?)<\/lastmod>/i);
      if (loc && mod) lastmod[decode(loc[1])] = decode(mod[1]);
    }
  }
  return { urls, children, lastmod };
}

// Picks which child sitemaps to read from a sitemap index: content first.
export function pickChildSitemaps(children: string[], max = 6): string[] {
  const content = children.filter((c) => /(post|blog|article|resource|guide|news|learn|topic|faq|question|answer|compare|vs|alternative)/i.test(c));
  const rest = children.filter((c) => !content.includes(c));
  return [...content, ...rest].slice(0, max);
}

// ---------- comparing two checks ----------

export function hashOf(values: string[]): string {
  return createHash("sha256").update(values.join("\n")).digest("hex");
}

// Lines (or URLs) that appear in one check but not the other. Order changes are ignored,
// so a page that only reshuffles content doesn't count as changed.
export function diffSets(before: string[], after: string[], cap = 50) {
  const old = new Set(before);
  const now = new Set(after);
  const added = after.filter((x) => !old.has(x));
  const removed = before.filter((x) => !now.has(x));
  return { added: added.slice(0, cap), removed: removed.slice(0, cap), addedCount: added.length, removedCount: removed.length };
}

// ---------- page outlines (for spotting rewritten pages) ----------

// The parts of a page that show what it is about and which search it targets:
// title, meta description and headings. Comparing outlines shows a change of angle or intent.
export function htmlOutline(html: string): string[] {
  const $ = cheerio.load(html);
  const out: string[] = [];
  const title = normalizeLine($("title").first().text());
  if (title) out.push(`Title: ${title}`);
  const desc = normalizeLine($('meta[name="description"]').attr("content") ?? "");
  if (desc) out.push(`Description: ${desc}`);
  $("h1, h2, h3").each((_, el) => {
    const t = normalizeLine($(el).text());
    if (t && out.length < 40) out.push(`${(el as { tagName?: string }).tagName?.toUpperCase() ?? "H"}: ${t}`);
  });
  return [...new Set(out)];
}

// Pages whose "last changed" date moved between two sitemap reads. If most of the sitemap moved
// at once, the site just regenerated its sitemap, so nothing is reported.
export function updatedPages(
  before: Record<string, string>,
  after: Record<string, string>,
  keep: (url: string) => boolean,
  max = 5,
): string[] {
  const shared = Object.keys(after).filter((u) => u in before);
  const moved = shared.filter((u) => before[u] !== after[u]);
  if (!shared.length || moved.length > Math.max(20, shared.length * 0.3)) return [];
  return moved
    .filter(keep)
    .sort((a, b) => (after[b] > after[a] ? 1 : -1))
    .slice(0, max);
}
