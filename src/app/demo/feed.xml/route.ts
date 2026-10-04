import { demoPosts, demoVersion } from "../version";

export const dynamic = "force-dynamic";

// RSS feed for the fictional Acme Insights blog (demo only).
export function GET(request: Request) {
  const origin = new URL(request.url).origin;
  const items = demoPosts(demoVersion())
    .map(
      (p) => `<item><title>${p.title}</title><link>${origin}/demo/blog/${p.slug}</link><guid>${origin}/demo/blog/${p.slug}</guid><pubDate>${new Date(`${p.date}T09:00:00Z`).toUTCString()}</pubDate></item>`,
    )
    .join("");
  const xml = `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>Acme Insights blog (demo)</title><link>${origin}/demo/pricing</link><description>Demo feed for testing Riposte. Acme Insights is fictional.</description>${items}</channel></rss>`;
  return new Response(xml, { headers: { "content-type": "application/rss+xml; charset=utf-8", "cache-control": "no-store" } });
}
