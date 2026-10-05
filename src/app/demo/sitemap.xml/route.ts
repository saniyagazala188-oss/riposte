import { demoArticle, demoSlugs, demoVersion } from "../version";

export const dynamic = "force-dynamic";

// Sitemap for the fictional Acme Insights site (demo only). The "last changed" date of the
// rewritten article moves when the demo switches to its "after" version.
export function GET(request: Request) {
  const origin = new URL(request.url).origin;
  const v = demoVersion();
  const entries = [
    { loc: `${origin}/demo/pricing`, mod: "2026-10-01" },
    { loc: `${origin}/demo/changelog`, mod: "2026-10-01" },
    ...demoSlugs().map((slug) => ({ loc: `${origin}/demo/blog/${slug}`, mod: demoArticle(slug, v)!.updated })),
  ];
  const xml = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${entries
    .map((e) => `<url><loc>${e.loc}</loc><lastmod>${e.mod}</lastmod></url>`)
    .join("")}</urlset>`;
  return new Response(xml, { headers: { "content-type": "application/xml; charset=utf-8", "cache-control": "no-store" } });
}
