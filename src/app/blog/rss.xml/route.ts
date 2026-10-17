import { allPosts } from "@/lib/blog";
import { getAuthor } from "@/lib/authors";
import { SITE_URL } from "@/lib/site";

// The blog as an RSS feed: feed readers, newsletters and AI tools can pick up new posts from here.
export const dynamic = "force-static";

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export function GET() {
  const posts = allPosts();
  const items = posts
    .map((p) => {
      const url = `${SITE_URL}/blog/${p.slug}`;
      const author = getAuthor(p.author)?.name ?? "Saniya Gazala";
      return `    <item>
      <title>${esc(p.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <pubDate>${new Date(`${p.date}T09:00:00+05:30`).toUTCString()}</pubDate>
      <dc:creator>${esc(author)}</dc:creator>
${p.tags.map((t) => `      <category>${esc(t)}</category>`).join("\n")}
      <description>${esc(p.summary || p.description)}</description>${p.cover ? `\n      <enclosure url="${SITE_URL}${p.cover}" type="image/jpeg" length="0" />` : ""}
    </item>`;
    })
    .join("\n");
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>Riposte blog</title>
    <link>${SITE_URL}/blog</link>
    <atom:link href="${SITE_URL}/blog/rss.xml" rel="self" type="application/rss+xml" />
    <description>Competitive intelligence, content and AI search for marketers, from building Riposte in public.</description>
    <language>en</language>
    <lastBuildDate>${new Date(`${posts[0]?.updated ?? "2026-10-17"}T09:00:00+05:30`).toUTCString()}</lastBuildDate>
${items}
  </channel>
</rss>
`;
  return new Response(body, { headers: { "content-type": "application/rss+xml; charset=utf-8" } });
}
