import "server-only";
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { marked } from "marked";
import { ctaHtml } from "./ctas";
import { DEFAULT_AUTHOR } from "./authors";

// Blog posts live as Markdown files in content/blog. See content/blog/README.md for how to write one.

const DIR = path.join(process.cwd(), "content", "blog");

export type Faq = { q: string; a: string };
export type PostMeta = {
  slug: string;
  title: string; // the H1 on the page
  metaTitle: string; // the <title>, under 60 characters
  description: string; // meta description, under 160 characters
  summary: string; // "Quick answer" box: the short answer AI tools can quote
  date: string; // YYYY-MM-DD
  updated: string;
  keywords: string[];
  tags: string[];
  faqs: Faq[];
  readingMinutes: number;
  cover: string | null; // image at the top, on cards and in link previews
  coverAlt: string;
  verdict: string; // "The bottom line" card at the end (HTML)
  cta: string | null; // CTA at the end of the post, from content/ctas.json; null = none
  related: string[]; // slugs to show first under "Keep reading"
  layout: BlogLayout; // which page design to use
  featured: boolean; // shown as the big card on /blog
  author: string; // author file name in content/authors, without .md
};

export type BlogLayout = "classic" | "magazine";

// Site-wide blog settings in content/blog-settings.json. A post can override the layout with `layout:`.
export function blogSettings(): { layout: BlogLayout } {
  const file = path.join(process.cwd(), "content", "blog-settings.json");
  try {
    const s = JSON.parse(fs.readFileSync(file, "utf8"));
    return { layout: s.layout === "magazine" ? "magazine" : "classic" };
  } catch {
    return { layout: "classic" };
  }
}
export type Post = PostMeta & { html: string; headings: { id: string; text: string; n: string }[] };

const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/<[^>]+>/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const decode = (s: string) =>
  s.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");

const files = () =>
  fs.existsSync(DIR) ? fs.readdirSync(DIR).filter((f) => f.endsWith(".md") && f.toLowerCase() !== "readme.md") : [];

// Just the settings of one post, for "read next" cards inside other posts.
function frontOf(slug: string): { title: string; description: string; cover: string | null } | null {
  for (const f of files()) {
    const { data } = matter(fs.readFileSync(path.join(DIR, f), "utf8"));
    if (String(data.slug || f.replace(/\.md$/, "")) === slug)
      return { title: String(data.title ?? slug), description: String(data.description ?? ""), cover: data.cover ? String(data.cover) : null };
  }
  return null;
}

// The address shown above a screenshot: /blog/screens/actions.jpg → /app/actions, feed.jpg → /app
const screenPath = (href: string) => {
  const n = href.split("/").pop()?.replace(/\.\w+$/, "") ?? "";
  return n === "feed" ? "/app" : `/app/${n}`;
};

const CALLOUT: Record<string, { label: string; icon: string }> = {
  tip: { label: "Tip", icon: "💡" },
  note: { label: "Note", icon: "📝" },
  important: { label: "Important", icon: "⚠️" },
  example: { label: "Example", icon: "🔎" },
};

// Turns the special lines into HTML before Markdown runs:
//   :::cta beta            an image CTA from content/ctas.json
//   :::read some-post      a "read next" card linking to another post
//   :::tip Optional title  a highlighted box, closed by a line with just :::
function blocks(md: string, inline: (s: string) => string): string {
  const lines = md.split("\n");
  const out: string[] = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    let m = line.match(/^:::cta\s+([\w-]+)\s*$/);
    if (m) {
      out.push("", ctaHtml(m[1]), "");
      continue;
    }
    m = line.match(/^:::read\s+([\w-]+)\s*$/);
    if (m) {
      const p = frontOf(m[1]);
      if (p)
        out.push(
          "",
          `<div class="blog-read-wrap"><a class="blog-read" href="/blog/${m[1]}">${p.cover ? `<img src="${esc(p.cover)}" alt="" loading="lazy" />` : ""}<span><small>Read next</small><strong>${esc(p.title)}</strong><em>${esc(p.description)}</em></span><b aria-hidden="true">→</b></a></div>`,
          "",
        );
      else console.warn(`Blog: ":::read ${m[1]}" points to a post that doesn't exist`);
      continue;
    }
    m = line.match(/^:::(tip|note|important|example)\s*(.*)$/);
    if (m) {
      const body: string[] = [];
      i++;
      while (i < lines.length && lines[i].trim() !== ":::") body.push(lines[i++]);
      const c = CALLOUT[m[1]];
      out.push(
        "",
        `<div class="blog-callout blog-callout-${m[1]}"><p class="blog-callout-title"><span aria-hidden="true">${c.icon}</span> ${esc(m[2] || c.label)}</p>${inline(body.join("\n"))}</div>`,
        "",
      );
      continue;
    }
    out.push(lines[i]);
  }
  return out.join("\n");
}

function read(file: string): Post {
  const raw = fs.readFileSync(path.join(DIR, file), "utf8");
  const { data, content } = matter(raw);
  const slug = String(data.slug || file.replace(/\.md$/, ""));
  const headings: Post["headings"] = [];
  const renderer = new marked.Renderer();
  renderer.heading = ({ tokens, depth }) => {
    let text = renderer.parser.parseInline(tokens);
    if (depth !== 2) return `<h${depth} id="${slugify(text)}">${text}</h${depth}>`;
    // Section headings get a number, drawn by CSS from data-n so the heading text stays clean for
    // search engines and AI. "## 3. Something" keeps its own number.
    const own = text.match(/^(\d+)[.)]\s+/);
    const n = String(own ? Number(own[1]) : headings.length + 1).padStart(2, "0");
    if (own) text = text.slice(own[0].length);
    const id = slugify(decode(text));
    headings.push({ id, text: decode(text.replace(/<[^>]+>/g, "")), n });
    return `<h2 id="${id}" class="blog-h2" data-n="${n}"><span>${text}</span></h2>`;
  };
  renderer.link = ({ href, tokens }) => {
    const text = renderer.parser.parseInline(tokens);
    const external = /^https?:\/\//.test(href) && !href.startsWith(process.env.NEXT_PUBLIC_SITE_URL || "https://useriposte.com");
    return `<a href="${href}"${external ? ' target="_blank" rel="noopener noreferrer"' : ""}>${text}</a>`;
  };
  // Images become figures with a caption (the text in quotes). App screenshots in /blog/screens/ get a browser frame.
  renderer.image = ({ href, title, text }) => {
    const img = `<img src="${esc(href)}" alt="${esc(text)}" loading="lazy" />`;
    const cap = title ? `<figcaption>${esc(title)}</figcaption>` : "";
    if (href.includes("/blog/screens/"))
      return `<figure class="blog-shot"><div class="blog-shot-frame"><div class="blog-shot-bar"><i></i><i></i><i></i><span><b>useriposte.com</b>${screenPath(href)}</span></div>${img}</div>${cap}</figure>`;
    return `<figure class="blog-fig">${img}${cap}</figure>`;
  };
  // Code blocks (like a template to copy) get a box and a Copy button (see CopyCode in BlogExtras).
  renderer.code = ({ text }) =>
    `<div class="blog-code"><button type="button" class="blog-copy" data-copy>Copy</button><pre><code>${esc(text)}</code></pre></div>`;
  // A paragraph holding only an image shouldn't wrap the figure in <p>.
  renderer.paragraph = ({ tokens }) => {
    const inner = renderer.parser.parseInline(tokens);
    return inner.trim().startsWith("<figure") ? inner : `<p>${inner}</p>`;
  };
  const md = (s: string) => marked.parse(s, { renderer, async: false }) as string;
  const html = md(blocks(content, md));
  const date = String(data.date ?? "").slice(0, 10);
  const words = content.split(/\s+/).filter(Boolean).length;
  return {
    slug,
    title: String(data.title ?? slug),
    metaTitle: String(data.metaTitle ?? data.title ?? slug),
    description: String(data.description ?? ""),
    summary: String(data.summary ?? ""),
    date,
    updated: String(data.updated ?? date).slice(0, 10),
    keywords: Array.isArray(data.keywords) ? data.keywords.map(String) : [],
    tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
    faqs: Array.isArray(data.faqs) ? data.faqs.map((f: Faq) => ({ q: String(f.q), a: String(f.a) })) : [],
    readingMinutes: Math.max(1, Math.round(words / 220)),
    cover: data.cover ? String(data.cover) : null,
    coverAlt: String(data.coverAlt ?? ""),
    verdict: data.verdict ? (marked.parseInline(String(data.verdict), { async: false }) as string) : "",
    cta: data.cta === false || data.cta === "none" ? null : String(data.cta ?? "beta"),
    related: Array.isArray(data.related) ? data.related.map(String) : [],
    featured: data.featured === true,
    author: data.author ? String(data.author) : DEFAULT_AUTHOR,
    layout: data.layout === "magazine" || data.layout === "classic" ? data.layout : blogSettings().layout,
    html,
    headings,
  };
}

export function allPosts(): Post[] {
  return files()
    .map(read)
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : a.slug < b.slug ? -1 : 1));
}

export function getPost(slug: string): Post | undefined {
  return allPosts().find((p) => p.slug === slug);
}

// "Keep reading": posts named in `related` first, then the ones sharing the most tags, newest first.
export function relatedPosts(post: Post, n = 3): Post[] {
  const others = allPosts().filter((p) => p.slug !== post.slug);
  const picked = post.related.map((s) => others.find((p) => p.slug === s)).filter((p): p is Post => !!p);
  const rest = others
    .filter((p) => !picked.includes(p))
    .map((p) => ({ p, score: p.tags.filter((t) => post.tags.includes(t)).length }))
    .sort((a, b) => b.score - a.score || (a.p.date < b.p.date ? 1 : -1))
    .map((x) => x.p);
  return [...picked, ...rest].slice(0, n);
}

export const formatDate = (d: string) =>
  new Date(`${d}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
