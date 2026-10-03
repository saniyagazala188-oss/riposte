import "server-only";
import { fallbackCandidates, isSameSite, parseHomepage, type Found, type SourceType } from "./parse";

export const USER_AGENT = "RiposteBot/0.1 (+https://riposte-eta.vercel.app)";
const TIMEOUT_MS = 6000;
const MAX_BYTES = 1_500_000;
const MAX_BYTES_XML = 8_000_000; // sitemaps with image and video entries can be several MB

type FetchResult = { ok: boolean; status: number; url: string; contentType: string; text: string };

// Fetches a public page with a time limit and a size limit.
export async function fetchPage(url: string, { readBody = true, large = false } = {}): Promise<FetchResult> {
  const limit = large ? MAX_BYTES_XML : MAX_BYTES;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), large ? TIMEOUT_MS * 2.5 : TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      redirect: "follow",
      signal: controller.signal,
      headers: { "user-agent": USER_AGENT, accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8" },
      cache: "no-store",
    });
    const contentType = res.headers.get("content-type") ?? "";
    let text = "";
    if (readBody && res.body) {
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let size = 0;
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          size += value.byteLength;
          text += decoder.decode(value, { stream: true });
          if (size > limit) {
            await reader.cancel();
            break;
          }
        }
      } catch {
        // Ran out of time part-way through a long file: keep what arrived.
        if (!text) throw new Error("No content received in time");
      }
    }
    return { ok: res.ok, status: res.status, url: res.url || url, contentType, text };
  } finally {
    clearTimeout(timer);
  }
}

export type DiscoveryResult = { found: Found[]; note: string | null };

// Finds a competitor's changelog, blog, blog feed, pricing page and sitemap from its domain.
export async function discoverSources(domain: string): Promise<DiscoveryResult> {
  const found = new Map<SourceType, string>();
  let note: string | null = null;

  // 1. Read the homepage and look for links.
  try {
    const home = await fetchPage(`https://${domain}`);
    if (home.ok && home.contentType.includes("html")) {
      const finalUrl = new URL(home.url);
      if (isSameSite(finalUrl, domain)) {
        for (const f of parseHomepage(home.text, home.url, domain)) found.set(f.type, f.url);
      }
    } else {
      note = `The homepage answered with status ${home.status}, so some pages may be missing.`;
    }
  } catch {
    note = "Couldn't reach the homepage. Add the pages yourself below, or try finding them again later.";
  }

  // 2. Try common addresses for anything still missing.
  const wanted: SourceType[] = ["changelog", "blog", "feed", "pricing", "sitemap"];
  const missing = wanted.filter((t) => !found.has(t));
  const candidates = fallbackCandidates(domain, missing);
  const checks = await Promise.allSettled(
    candidates.map(async (c) => {
      const res = await fetchPage(c.url, { readBody: c.type === "feed" || c.type === "sitemap" });
      if (!res.ok) return null;
      const finalUrl = new URL(res.url);
      if (!isSameSite(finalUrl, domain)) return null;
      // A feed or sitemap must really be XML, not a "page not found" page.
      if (c.type === "feed" && !/<(rss|feed)\b/i.test(res.text.slice(0, 2000))) return null;
      if (c.type === "sitemap" && !/<(urlset|sitemapindex)\b/i.test(res.text.slice(0, 2000))) return null;
      if ((c.type === "pricing" || c.type === "changelog" || c.type === "blog") && !res.contentType.includes("html")) return null;
      return { type: c.type, url: res.url.replace(/\/$/, "") } as Found;
    }),
  );
  for (const r of checks) {
    if (r.status === "fulfilled" && r.value && !found.has(r.value.type)) found.set(r.value.type, r.value.url);
  }

  if (found.size === 0 && !note) note = "No pages found automatically. Add them yourself below.";
  return { found: [...found].map(([type, url]) => ({ type, url })), note };
}
