import "server-only";
import type { FeedItem } from "@/lib/fetcher/extract";

// NewsData.io: a news API with a free plan (200 requests a day, news delayed by 12 hours).
// Used for competitor news when NEWSDATA_API_KEY is set; otherwise Riposte falls back to GDELT.

export const newsDataConfigured = () => Boolean(process.env.NEWSDATA_API_KEY);

type Article = { article_id?: string; title?: string; link?: string; pubDate?: string; duplicate?: boolean };
type Reply = { status?: string; results?: Article[] | { message?: string; code?: string } };

export type NewsDataResult = { ok: true; items: FeedItem[] } | { ok: false; busy: boolean; message: string };

// "2026-10-16 08:15:00" (UTC) -> ISO
function iso(pubDate?: string): string | null {
  if (!pubDate) return null;
  const t = Date.parse(pubDate.replace(" ", "T") + (/[zZ]|[+-]\d\d:?\d\d$/.test(pubDate) ? "" : "Z"));
  return Number.isNaN(t) ? null : new Date(t).toISOString();
}

export function toFeedItems(results: Article[]): FeedItem[] {
  const seen = new Set<string>();
  const items: FeedItem[] = [];
  for (const a of results) {
    if (!a.title || !a.link || a.duplicate) continue;
    if (seen.has(a.link)) continue;
    seen.add(a.link);
    items.push({ id: a.link, title: a.title.trim(), link: a.link, date: iso(a.pubDate) });
  }
  return items;
}

export async function newsFor(company: string): Promise<NewsDataResult> {
  const key = process.env.NEWSDATA_API_KEY;
  if (!key) return { ok: false, busy: false, message: "News isn't set up yet." };
  const params = new URLSearchParams({ apikey: key, q: `"${company.replace(/"/g, "")}"`, language: "en" });
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  try {
    const res = await fetch(`https://newsdata.io/api/1/latest?${params}`, { signal: controller.signal, cache: "no-store" });
    if (res.status === 429) return { ok: false, busy: true, message: "The news service's daily limit was reached. Riposte will try again on the next check." };
    const body = (await res.json().catch(() => null)) as Reply | null;
    if (!res.ok || !body || body.status !== "success" || !Array.isArray(body.results)) {
      const msg = body && !Array.isArray(body.results) ? body.results?.message : null;
      return { ok: false, busy: false, message: `The news service said: ${msg ?? `status ${res.status}`}` };
    }
    return { ok: true, items: toFeedItems(body.results) };
  } catch {
    return { ok: false, busy: false, message: "The news service didn't respond in time." };
  } finally {
    clearTimeout(timer);
  }
}
