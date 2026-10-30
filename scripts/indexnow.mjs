// IndexNow: after each production deploy, tell Bing (and other IndexNow search engines) which
// pages are new or changed, so they're read within hours instead of days. Google doesn't use
// IndexNow; it reads the sitemap.
//
// What gets sent: blog posts and docs updated in the last 3 days (plus /blog, the RSS feed and
// llms.txt), free tools launched in the last 3 days (plus /tools), comparison pages when their
// "checked" date is recent, and /changelog when it has a new entry.
// Put "[indexnow all]" in a commit message to send every public page once.
// The key is public by design: the file /<key>.txt proves the site is ours.
// This never fails the build.
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

const KEY = "4c7f6fd503bb2f0f2271ce19fbf8d980";
const SITE = (process.env.NEXT_PUBLIC_SITE_URL || "https://useriposte.com").replace(/\/$/, "");
const DAYS = 3;

async function main() {
  if (process.env.VERCEL_ENV !== "production") return console.log("[indexnow] not production, skipped");
  const all = /\[indexnow all\]/i.test(process.env.VERCEL_GIT_COMMIT_MESSAGE ?? "");
  const since = Date.now() - DAYS * 86400000;
  const recent = (d) => d && Date.parse(String(d).slice(0, 10)) >= since;

  const urls = new Set();
  const blogDir = path.join(process.cwd(), "content/blog");
  for (const f of fs.readdirSync(blogDir).filter((f) => f.endsWith(".md") && f !== "README.md")) {
    const { data } = matter(fs.readFileSync(path.join(blogDir, f), "utf8"));
    if (all || recent(data.updated ?? data.date)) urls.add(`${SITE}/blog/${data.slug || f.replace(/\.md$/, "")}`);
  }
  if (urls.size) ["/blog", "/blog/rss.xml", "/llms.txt"].forEach((p) => urls.add(SITE + p));

  const docsDir = path.join(process.cwd(), "content/docs");
  let docsChanged = false;
  for (const f of fs.existsSync(docsDir) ? fs.readdirSync(docsDir).filter((f) => f.endsWith(".md") && f !== "README.md") : []) {
    const { data } = matter(fs.readFileSync(path.join(docsDir, f), "utf8"));
    if (all || recent(data.updated)) {
      urls.add(`${SITE}/docs/${data.slug || f.replace(/\.md$/, "")}`);
      docsChanged = true;
    }
  }
  if (docsChanged) ["/docs", "/llms.txt"].forEach((p) => urls.add(SITE + p));

  // Free tools: slug and launch date, read from src/lib/freeTools.ts.
  const tools = fs.readFileSync(path.join(process.cwd(), "src/lib/freeTools.ts"), "utf8");
  let toolsChanged = false;
  for (const m of tools.matchAll(/slug:\s*"([^"]+)"[\s\S]*?status:\s*"(live|soon)"(?:,\s*launched:\s*"([^"]+)")?/g)) {
    if (m[2] === "live" && (all || recent(m[3]))) {
      urls.add(`${SITE}/tools/${m[1]}`);
      toolsChanged = true;
    }
  }
  if (toolsChanged) ["/tools", "/llms.txt"].forEach((p) => urls.add(SITE + p));

  // Comparison pages: re-sent when their "checked" date moves.
  const alts = fs.readFileSync(path.join(process.cwd(), "src/lib/alternatives.ts"), "utf8");
  const checked = alts.match(/CHECKED\s*=\s*"([^"]+)"/)?.[1];
  if (all || recent(checked)) {
    urls.add(`${SITE}/alternatives`);
    for (const m of alts.matchAll(/^\s*slug:\s*"([^"]+)",/gm)) urls.add(`${SITE}/alternatives/${m[1]}`);
  }

  const log = fs.readFileSync(path.join(process.cwd(), "src/lib/changelog.ts"), "utf8");
  const latest = log.match(/at:\s*"([^"]+)"/)?.[1];
  if (all || recent(latest)) urls.add(`${SITE}/changelog`);

  if (all) {
    ["", "/privacy", "/terms", "/authors", "/competitor-tracking-tool", "/tools"].forEach((p) => urls.add(SITE + p));
    const authorDir = path.join(process.cwd(), "content/authors");
    for (const f of fs.readdirSync(authorDir).filter((f) => f.endsWith(".md") && f !== "README.md"))
      urls.add(`${SITE}/authors/${f.replace(/\.md$/, "")}`);
  }

  if (!urls.size) return console.log("[indexnow] nothing changed, nothing sent");
  const list = [...urls];
  const res = await fetch("https://api.indexnow.org/indexnow", {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({ host: new URL(SITE).host, key: KEY, keyLocation: `${SITE}/${KEY}.txt`, urlList: list }),
    signal: AbortSignal.timeout(10000),
  });
  console.log(`[indexnow] sent ${list.length} pages, answer ${res.status}`);
  list.forEach((u) => console.log("  " + u));
}

main().catch((e) => console.log("[indexnow] skipped:", e.message));
