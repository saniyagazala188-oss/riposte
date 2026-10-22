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
- [Competitor tracking tool](${SITE_URL}/competitor-tracking-tool): what Riposte tracks, how it works, how it compares with checking by hand, Google Alerts, page monitors and enterprise tools, and FAQs
- [Compare](${SITE_URL}/alternatives): Crayon, Klue, Kompyte, Visualping and Riposte compared, with facts checked on each company's own website
- [Crayon alternatives](${SITE_URL}/alternatives/crayon)
- [Klue alternatives](${SITE_URL}/alternatives/klue)
- [Kompyte alternatives](${SITE_URL}/alternatives/kompyte)
- [Visualping alternatives](${SITE_URL}/alternatives/visualping)
- [Free tools](${SITE_URL}/tools): every free Riposte tool for product marketers, no sign-up
- [Free battlecard generator](${SITE_URL}/tools/battlecard-generator): enter a competitor's website and get a one-page sales battlecard drafted from their own pages
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
