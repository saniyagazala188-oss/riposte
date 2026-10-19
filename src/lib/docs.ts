import "server-only";
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { renderMarkdown, type Faq, type ReadCard } from "./blog";

// Riposte Docs: how to set up and use each feature. One Markdown file per page in content/docs,
// grouped by the categories in content/docs/categories.json. See content/docs/README.md.

const DIR = path.join(process.cwd(), "content", "docs");

export type DocCategory = { id: string; title: string; description: string; icon: string };
export type Doc = {
  slug: string;
  title: string;
  metaTitle: string;
  description: string;
  summary: string; // "In short" box at the top
  category: string;
  order: number; // position inside its category
  updated: string;
  keywords: string[];
  faqs: Faq[];
  related: string[]; // other docs to suggest at the end
  appLink: { href: string; label: string } | null; // "Open in Riposte" button
  html: string;
  headings: { id: string; text: string; n: string }[];
};

export function docCategories(): DocCategory[] {
  try {
    return JSON.parse(fs.readFileSync(path.join(DIR, "categories.json"), "utf8"));
  } catch {
    return [];
  }
}

const files = () => (fs.existsSync(DIR) ? fs.readdirSync(DIR).filter((f) => f.endsWith(".md") && f.toLowerCase() !== "readme.md") : []);

// "Read next" cards inside a doc point to other docs.
function docCard(slug: string): ReadCard | null {
  const f = files().find((x) => x.replace(/\.md$/, "") === slug);
  if (!f) return null;
  const { data } = matter(fs.readFileSync(path.join(DIR, f), "utf8"));
  return { href: `/docs/${slug}`, title: String(data.title ?? slug), description: String(data.description ?? ""), cover: null };
}

function read(file: string): Doc {
  const { data, content } = matter(fs.readFileSync(path.join(DIR, file), "utf8"));
  const slug = String(data.slug || file.replace(/\.md$/, ""));
  const { html, headings } = renderMarkdown(content, { numbered: false, card: docCard });
  return {
    slug,
    title: String(data.title ?? slug),
    metaTitle: String(data.metaTitle ?? data.title ?? slug),
    description: String(data.description ?? ""),
    summary: String(data.summary ?? ""),
    category: String(data.category ?? "getting-started"),
    order: Number(data.order ?? 99),
    updated: String(data.updated ?? "").slice(0, 10),
    keywords: Array.isArray(data.keywords) ? data.keywords.map(String) : [],
    faqs: Array.isArray(data.faqs) ? data.faqs.map((f: Faq) => ({ q: String(f.q), a: String(f.a) })) : [],
    related: Array.isArray(data.related) ? data.related.map(String) : [],
    appLink: data.appLink ? { href: String(data.appLink.href), label: String(data.appLink.label ?? "Open in Riposte") } : null,
    html,
    headings,
  };
}

// All docs in reading order: by category (as listed in categories.json), then by `order`.
export function allDocs(): Doc[] {
  const cats = docCategories().map((c) => c.id);
  const rank = (c: string) => (cats.indexOf(c) === -1 ? 999 : cats.indexOf(c));
  return files()
    .map(read)
    .sort((a, b) => rank(a.category) - rank(b.category) || a.order - b.order || a.title.localeCompare(b.title));
}

export const getDoc = (slug: string) => allDocs().find((d) => d.slug === slug);

export function docsByCategory() {
  const docs = allDocs();
  return docCategories()
    .map((c) => ({ ...c, docs: docs.filter((d) => d.category === c.id) }))
    .filter((c) => c.docs.length);
}

// The page before and after this one, in reading order.
export function neighbours(slug: string) {
  const docs = allDocs();
  const i = docs.findIndex((d) => d.slug === slug);
  return { prev: i > 0 ? docs[i - 1] : null, next: i >= 0 && i < docs.length - 1 ? docs[i + 1] : null };
}
