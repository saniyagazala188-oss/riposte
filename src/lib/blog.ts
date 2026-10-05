import "server-only";
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { marked } from "marked";

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
};
export type Post = PostMeta & { html: string; headings: { id: string; text: string }[] };

const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/<[^>]+>/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

function read(file: string): Post {
  const raw = fs.readFileSync(path.join(DIR, file), "utf8");
  const { data, content } = matter(raw);
  const slug = String(data.slug || file.replace(/\.md$/, ""));
  const headings: { id: string; text: string }[] = [];
  const renderer = new marked.Renderer();
  renderer.heading = ({ tokens, depth }) => {
    const text = renderer.parser.parseInline(tokens);
    const id = slugify(text);
    if (depth === 2) headings.push({ id, text: text.replace(/<[^>]+>/g, "") });
    return `<h${depth} id="${id}">${text}</h${depth}>`;
  };
  renderer.link = ({ href, tokens }) => {
    const text = renderer.parser.parseInline(tokens);
    const external = /^https?:\/\//.test(href) && !href.startsWith(process.env.NEXT_PUBLIC_SITE_URL || "https://riposte-eta.vercel.app");
    return `<a href="${href}"${external ? ' target="_blank" rel="noopener noreferrer"' : ""}>${text}</a>`;
  };
  const html = marked.parse(content, { renderer, async: false }) as string;
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
    html,
    headings,
  };
}

export function allPosts(): Post[] {
  if (!fs.existsSync(DIR)) return [];
  return fs
    .readdirSync(DIR)
    .filter((f) => f.endsWith(".md") && f.toLowerCase() !== "readme.md")
    .map(read)
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}

export function getPost(slug: string): Post | undefined {
  return allPosts().find((p) => p.slug === slug);
}

export const formatDate = (d: string) =>
  new Date(`${d}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
