import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { fetchPage, USER_AGENT } from "@/lib/discovery";
import { isContentUrl } from "@/lib/content/stats";
import {
  diffSets,
  hashOf,
  htmlOutline,
  htmlToLines,
  parseFeed,
  parseSitemap,
  pickChildSitemaps,
  readerTextToLines,
  updatedPages,
  type FeedItem,
} from "./extract";
import { isAllowed, parseRobots, type Robots } from "./robots";

export type SourceRow = {
  id: string;
  user_id: string;
  competitor_id: string;
  type: string;
  url: string;
};

export type CheckOutcome = {
  sourceId: string;
  status: "baseline" | "unchanged" | "changed" | "blocked" | "not_found" | "robots" | "empty" | "error";
  message?: string;
};

const THIN_TEXT = 300; // characters: less than this usually means the page is built by JavaScript
const MAX_SITEMAP_URLS = 3000;
const KEEP_SNAPSHOTS = 5;

type Captured =
  | { kind: "lines"; method: "direct" | "reader"; lines: string[] }
  | { kind: "feed"; items: FeedItem[] }
  | { kind: "sitemap"; urls: string[]; lastmod: Record<string, string> };

// ---------- robots.txt, cached per run ----------

const robotsCache = new Map<string, Promise<Robots | null>>();

function robotsFor(origin: string): Promise<Robots | null> {
  let cached = robotsCache.get(origin);
  if (!cached) {
    cached = fetchPage(`${origin}/robots.txt`)
      .then((r) => (r.ok && !r.contentType.includes("html") ? parseRobots(r.text) : null))
      .catch(() => null);
    robotsCache.set(origin, cached);
  }
  return cached;
}

// ---------- page-reading service (for pages built by JavaScript) ----------

async function readWithReader(url: string): Promise<string[] | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20000);
  try {
    const headers: Record<string, string> = { "X-Return-Format": "text", "User-Agent": USER_AGENT };
    if (process.env.JINA_API_KEY) headers.Authorization = `Bearer ${process.env.JINA_API_KEY}`;
    const res = await fetch(`https://r.jina.ai/${url}`, { headers, signal: controller.signal, cache: "no-store" });
    if (!res.ok) return null;
    const lines = readerTextToLines(await res.text());
    return lines.join(" ").length >= THIN_TEXT ? lines : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

// ---------- capture one page ----------

async function capture(source: SourceRow): Promise<Captured | CheckOutcome> {
  const target = new URL(source.url);
  const robots = await robotsFor(target.origin);
  if (robots && !isAllowed(robots, target.pathname + target.search)) {
    return { sourceId: source.id, status: "robots", message: "This website asks bots not to read this page, so Riposte skips it." };
  }

  let res;
  try {
    res = await fetchPage(source.url, { large: source.type === "sitemap" || source.type === "feed" });
  } catch {
    res = null;
  }

  if (source.type === "feed" || source.type === "sitemap") {
    if (!res) return { sourceId: source.id, status: "error", message: "The website didn't respond in time." };
    if (res.status === 404 || res.status === 410) return { sourceId: source.id, status: "not_found", message: "This address no longer exists." };
    if (!res.ok) return { sourceId: source.id, status: "blocked", message: `The website refused the request (status ${res.status}).` };

    if (source.type === "feed") {
      const items = parseFeed(res.text);
      if (!items) return { sourceId: source.id, status: "error", message: "This address isn't a readable blog feed anymore." };
      return { kind: "feed", items };
    }

    const parsed = parseSitemap(res.text);
    if (!parsed) return { sourceId: source.id, status: "error", message: "This address isn't a readable sitemap anymore." };
    const urls = [...parsed.urls];
    const lastmod: Record<string, string> = { ...parsed.lastmod };
    for (const child of pickChildSitemaps(parsed.children)) {
      try {
        const sub = await fetchPage(child, { large: true });
        const inner = sub.ok ? parseSitemap(sub.text) : null;
        if (inner) {
          urls.push(...inner.urls);
          Object.assign(lastmod, inner.lastmod);
        }
      } catch {
        // one unreadable child sitemap shouldn't fail the whole check
      }
      if (urls.length >= MAX_SITEMAP_URLS) break;
    }
    const kept = [...new Set(urls)].slice(0, MAX_SITEMAP_URLS);
    const keptMods: Record<string, string> = {};
    for (const u of kept) if (lastmod[u]) keptMods[u] = lastmod[u];
    return { kind: "sitemap", urls: kept, lastmod: keptMods };
  }

  // Normal web pages: blog, changelog, pricing, other.
  if (res && (res.status === 404 || res.status === 410)) {
    return { sourceId: source.id, status: "not_found", message: "This page no longer exists. It may have moved." };
  }
  if (res && res.ok && res.contentType.includes("html")) {
    const lines = htmlToLines(res.text);
    if (lines.join(" ").length >= THIN_TEXT) return { kind: "lines", method: "direct", lines };
  }

  // Blocked, failed, or built by JavaScript: try the page-reading service.
  const viaReader = await readWithReader(source.url);
  if (viaReader) return { kind: "lines", method: "reader", lines: viaReader };

  if (!res) return { sourceId: source.id, status: "error", message: "The website didn't respond in time." };
  if (!res.ok) return { sourceId: source.id, status: "blocked", message: `The website blocked the check (status ${res.status}).` };
  return { sourceId: source.id, status: "empty", message: "The page loaded, but Riposte couldn't find readable content on it." };
}

// ---------- check one source and record the result ----------

export async function checkSource(db: SupabaseClient, source: SourceRow): Promise<CheckOutcome> {
  const now = new Date().toISOString();
  const captured = await capture(source).catch(
    (): CheckOutcome => ({ sourceId: source.id, status: "error", message: "Something went wrong reading this page." }),
  );

  if ("status" in captured) {
    await db
      .from("sources")
      .update({ last_checked_at: now, last_status: captured.status, last_error: captured.message ?? null })
      .eq("id", source.id);
    return captured;
  }

  // What we compare: lines of text, feed item ids, or sitemap URLs.
  const values =
    captured.kind === "lines" ? captured.lines : captured.kind === "feed" ? captured.items.map((i) => i.id) : captured.urls;
  const method = captured.kind === "lines" ? captured.method : "direct";
  const hash = hashOf(captured.kind === "lines" ? values : [...values].sort());

  const { data: previous } = await db
    .from("snapshots")
    .select("content_hash, method, lines, items")
    .eq("source_id", source.id)
    .order("fetched_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  let status: CheckOutcome["status"] = "unchanged";

  if (!previous || previous.method !== method) {
    // First check (or the reading method changed): this becomes the starting point.
    status = "baseline";
  } else if (previous.content_hash !== hash) {
    const before: string[] =
      captured.kind === "lines"
        ? (previous.lines as string[]) ?? []
        : captured.kind === "feed"
          ? ((previous.items as FeedItem[]) ?? []).map((i) => i.id)
          : (previous.items as string[]) ?? [];
    const diff = diffSets(before, values);

    if (captured.kind === "feed") {
      const newIds = new Set(diff.added);
      const newPosts = captured.items.filter((i) => newIds.has(i.id));
      if (newPosts.length) {
        status = "changed";
        await db.from("changes").insert({
          user_id: source.user_id,
          competitor_id: source.competitor_id,
          source_id: source.id,
          kind: "new_posts",
          added: newPosts.slice(0, 50),
          removed: [],
        });
      }
    } else if (diff.addedCount || (captured.kind === "lines" && diff.removedCount)) {
      status = "changed";
      await db.from("changes").insert({
        user_id: source.user_id,
        competitor_id: source.competitor_id,
        source_id: source.id,
        kind: captured.kind === "sitemap" ? "new_pages" : "content",
        added: diff.added,
        removed: captured.kind === "sitemap" ? [] : diff.removed,
      });
    }
  }

  // Sitemaps also say when each page last changed: rewritten blog posts and comparison pages.
  let modLines: string[] | null = null;
  if (captured.kind === "sitemap") {
    modLines = Object.entries(captured.lastmod).map(([u, m]) => `${u}\t${m}`);
    const prevMods: Record<string, string> = {};
    for (const line of (previous?.lines as string[] | null) ?? []) {
      const [u, m] = line.split("\t");
      if (u && m) prevMods[u] = m;
    }
    try {
      if (!previous || previous.method !== method || !Object.keys(prevMods).length) {
        // first time Riposte sees this sitemap's dates: remember outlines, report nothing yet
        await saveBaselineOutlines(db, source, captured.lastmod);
      } else {
        const rewritten = await recordRewrites(db, source, updatedPages(prevMods, captured.lastmod, isContentUrl));
        if (rewritten) status = "changed";
      }
    } catch {
      // page outlines are a bonus; the sitemap check itself succeeded
    }
  }
  const modsChanged = modLines !== null && hashOf(modLines) !== hashOf(((previous?.lines as string[] | null) ?? []));

  if (status !== "unchanged" || previous?.content_hash !== hash || modsChanged) {
    await db.from("snapshots").insert({
      user_id: source.user_id,
      source_id: source.id,
      fetched_at: now,
      method,
      content_hash: hash,
      lines: captured.kind === "lines" ? captured.lines : modLines,
      items: captured.kind === "feed" ? captured.items : captured.kind === "sitemap" ? captured.urls : null,
      char_count: values.join(" ").length,
    });
    await pruneSnapshots(db, source.id);
  }

  await db
    .from("sources")
    .update({
      last_checked_at: now,
      last_status: status === "changed" ? "changed" : "ok",
      last_error: null,
      ...(status === "changed" ? { last_changed_at: now } : {}),
    })
    .eq("id", source.id);

  return { sourceId: source.id, status };
}

async function pruneSnapshots(db: SupabaseClient, sourceId: string) {
  const { data } = await db
    .from("snapshots")
    .select("id")
    .eq("source_id", sourceId)
    .order("fetched_at", { ascending: false })
    .range(KEEP_SNAPSHOTS, KEEP_SNAPSHOTS + 50);
  if (data?.length) await db.from("snapshots").delete().in("id", data.map((d) => d.id));
}

// ---------- check many sources, a few at a time, within a time budget ----------

export async function checkSources(
  db: SupabaseClient,
  sources: SourceRow[],
  { concurrency = 4, budgetMs = 50000 } = {},
): Promise<CheckOutcome[]> {
  const started = Date.now();
  const results: CheckOutcome[] = [];
  let next = 0;

  async function worker() {
    while (next < sources.length && Date.now() - started < budgetMs) {
      const source = sources[next++];
      results.push(await checkSource(db, source));
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, sources.length) }, worker));
  return results;
}

// ---------- rewritten pages (intent-change alerts) ----------

async function outlineOf(url: string): Promise<string[] | null> {
  const target = new URL(url);
  const robots = await robotsFor(target.origin);
  if (robots && !isAllowed(robots, target.pathname + target.search)) return null;
  try {
    const res = await fetchPage(url);
    if (!res.ok || !res.contentType.includes("html")) return null;
    const outline = htmlOutline(res.text);
    return outline.length ? outline : null;
  } catch {
    return null;
  }
}

// On the first sitemap read, remember the outline of the most recently changed content pages,
// so a later rewrite of one of them can be shown as Before / Now.
async function saveBaselineOutlines(db: SupabaseClient, source: SourceRow, lastmod: Record<string, string>) {
  const recent = Object.entries(lastmod)
    .filter(([u]) => isContentUrl(u))
    .sort((a, b) => (b[1] > a[1] ? 1 : -1))
    .slice(0, 10)
    .map(([u]) => u);
  for (const url of recent) {
    const outline = await outlineOf(url);
    if (outline) {
      await db
        .from("page_outlines")
        .upsert({ user_id: source.user_id, competitor_id: source.competitor_id, url, outline }, { onConflict: "competitor_id,url" });
    }
  }
}

// For each page whose "last changed" date moved, compare its outline with the one saved before.
async function recordRewrites(db: SupabaseClient, source: SourceRow, urls: string[]): Promise<number> {
  let count = 0;
  for (const url of urls) {
    const outline = await outlineOf(url);
    if (!outline) continue;
    const { data: saved } = await db
      .from("page_outlines")
      .select("outline")
      .eq("competitor_id", source.competitor_id)
      .eq("url", url)
      .maybeSingle();
    const before = (saved?.outline as string[] | undefined) ?? null;
    const diff = before ? diffSets(before, outline) : null;
    if (!before || diff!.addedCount || diff!.removedCount) {
      await db.from("changes").insert({
        user_id: source.user_id,
        competitor_id: source.competitor_id,
        source_id: source.id,
        kind: "rewrite",
        page_url: url,
        added: before ? diff!.added : outline,
        removed: before ? diff!.removed : [],
      });
      count++;
    }
    await db
      .from("page_outlines")
      .upsert(
        { user_id: source.user_id, competitor_id: source.competitor_id, url, outline, fetched_at: new Date().toISOString() },
        { onConflict: "competitor_id,url" },
      );
  }
  return count;
}
