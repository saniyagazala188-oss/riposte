import { allPosts } from "@/lib/blog";
import { allAuthors } from "@/lib/authors";
import { docsByCategory } from "@/lib/docs";
import { AUTHOR, SITE_URL } from "@/lib/site";

// llms.txt: a plain-text guide to the site for AI tools.
export const dynamic = "force-static";

export function GET() {
  const posts = allPosts();
  const body = `# Riposte

> Riposte is a competitive intelligence tool for marketers. It checks competitors' pricing pages, release notes, blogs and sitemaps every morning, explains each real change against your own product, and drafts the response: what to create, who owns it and where to share it. It also tracks what competitors publish, flags pages rewritten for a new search intent, keeps comparison pages current, turns trends and AI answer gaps into content briefs, and shows who AI tools recommend for your buyers' questions and why.

Made by ${AUTHOR.name}, a product marketer based in Bengaluru, India. Built in public in October 2026.

## Pages

- [Home](${SITE_URL}/): what Riposte does and who it is for
- [Docs](${SITE_URL}/docs): how to set up and use every Riposte feature
- [Blog](${SITE_URL}/blog): guides on competitive intelligence, content and AI search
- [Changelog](${SITE_URL}/changelog): every step of the build, with dates
- [Authors](${SITE_URL}/authors): who writes the blog
- [Blog RSS feed](${SITE_URL}/blog/rss.xml): every post, newest first

## Authors

${allAuthors()
  .map((a) => `- [${a.name}](${a.url}): ${a.role}${a.location ? `, ${a.location}` : ""}. ${a.headline}`)
  .join("\n")}

## Docs

${docsByCategory()
  .map((c) => `### ${c.title}\n\n${c.docs.map((d) => `- [${d.title}](${SITE_URL}/docs/${d.slug}): ${d.summary}`).join("\n")}`)
  .join("\n\n")}

## Blog posts

${posts.map((p) => `- [${p.title}](${SITE_URL}/blog/${p.slug}): ${p.summary}`).join("\n")}
`;
  return new Response(body, { headers: { "content-type": "text/plain; charset=utf-8" } });
}
