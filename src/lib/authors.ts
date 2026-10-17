import "server-only";
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { marked } from "marked";
import { SITE_URL } from "./site";

// One Markdown file per author in content/authors (see content/authors/README.md).
// The file name is the address: saniya-gazala.md → /authors/saniya-gazala

const DIR = path.join(process.cwd(), "content", "authors");
export const DEFAULT_AUTHOR = "saniya-gazala";

export type Link = { label: string; url: string };
export type Job = { role: string; company: string; dates?: string; summary?: string; points?: string[] };
export type Item = { title: string; place?: string; dates?: string; status?: string; url?: string };
export type Section = { title: string; items: { title: string; text?: string; url?: string; meta?: string }[] };

export type Author = {
  slug: string;
  name: string;
  role: string;
  headline: string;
  image: string | null;
  imageAlt: string;
  location: string;
  links: Link[];
  highlights: { value: string; label: string }[];
  experience: Job[];
  education: Item[];
  learning: Item[]; // courses and certifications
  skills: string[];
  sections: Section[]; // anything else: talks, projects, awards…
  html: string; // the story under the settings (About me, journey…)
  initials: string;
  url: string;
};

const arr = <T,>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);
const str = (v: unknown) => (v == null ? "" : String(v));

function read(file: string): Author {
  const { data, content } = matter(fs.readFileSync(path.join(DIR, file), "utf8"));
  const slug = file.replace(/\.md$/, "");
  const name = str(data.name) || slug;
  const renderer = new marked.Renderer();
  renderer.heading = ({ tokens, depth }) => {
    const text = renderer.parser.parseInline(tokens);
    const id = text.toLowerCase().replace(/<[^>]+>/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    return `<h${depth} id="${id}">${text}</h${depth}>`;
  };
  renderer.link = ({ href, tokens }) => {
    const text = renderer.parser.parseInline(tokens);
    return /^https?:\/\//.test(href)
      ? `<a href="${href}" target="_blank" rel="noopener noreferrer">${text}</a>`
      : `<a href="${href}">${text}</a>`;
  };
  return {
    slug,
    name,
    role: str(data.role),
    headline: str(data.headline),
    image: data.image ? str(data.image) : null,
    imageAlt: str(data.imageAlt) || name,
    location: str(data.location),
    links: arr<Link>(data.links).filter((l) => l?.url),
    highlights: arr<{ value: string; label: string }>(data.highlights),
    experience: arr<Job>(data.experience),
    education: arr<Item>(data.education),
    learning: arr<Item>(data.learning),
    skills: arr<string>(data.skills).map(String),
    sections: arr<Section>(data.sections),
    html: marked.parse(content, { renderer, async: false }) as string,
    initials: name
      .split(/\s+/)
      .map((w) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase(),
    url: `${SITE_URL}/authors/${slug}`,
  };
}

export function allAuthors(): Author[] {
  if (!fs.existsSync(DIR)) return [];
  return fs
    .readdirSync(DIR)
    .filter((f) => f.endsWith(".md") && f.toLowerCase() !== "readme.md")
    .map(read);
}

export function getAuthor(slug: string): Author | undefined {
  return allAuthors().find((a) => a.slug === slug);
}

// schema.org Person for an author: used on their page and on every post they wrote.
export function authorSchema(a: Author) {
  return {
    "@type": "Person",
    "@id": `${a.url}#person`,
    name: a.name,
    url: a.url,
    jobTitle: a.role,
    description: a.headline,
    ...(a.image ? { image: `${SITE_URL}${a.image}` } : {}),
    sameAs: a.links.map((l) => l.url),
    ...(a.skills.length ? { knowsAbout: a.skills } : {}),
    ...(a.education.length ? { alumniOf: a.education.map((e) => ({ "@type": "EducationalOrganization", name: e.place ?? e.title })) } : {}),
    ...(a.location ? { homeLocation: { "@type": "Place", name: a.location } } : {}),
  };
}
