import { allPosts } from "@/lib/blog";
import { AUTHOR, SITE_URL } from "@/lib/site";

// llms.txt: a plain-text guide to the site for AI tools.
export const dynamic = "force-static";

export function GET() {
  const posts = allPosts();
  const body = `# Riposte

> Riposte is a competitive intelligence tool for marketers. It checks competitors' pricing pages, release notes, blogs and sitemaps every morning, explains each real change against your own product, and drafts the response: what to create, who owns it and where to share it. It also tracks what competitors publish, flags pages rewritten for a new search intent, keeps comparison pages current, turns trends and AI answer gaps into content briefs, and shows who AI tools recommend for your buyers' questions and why.

Founded by ${AUTHOR.name}, a product marketer based in Bengaluru, India. Built in public in October 2026.

## Pages

- [Home](${SITE_URL}/): what Riposte does and who it is for
- [Blog](${SITE_URL}/blog): guides on competitive intelligence, content and AI search
- [Changelog](${SITE_URL}/changelog): every step of the build, with dates
- [About the founder](${SITE_URL}/about)

## Blog posts

${posts.map((p) => `- [${p.title}](${SITE_URL}/blog/${p.slug}): ${p.summary}`).join("\n")}
`;
  return new Response(body, { headers: { "content-type": "text/plain; charset=utf-8" } });
}
