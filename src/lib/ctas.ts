import "server-only";
import fs from "node:fs";
import path from "node:path";

// Image CTAs for the blog. Edit them in content/ctas.json (see content/blog/README.md).
export type Cta = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  button: string;
  link: string;
  image?: string;
  imageAlt?: string;
};

const FILE = path.join(process.cwd(), "content", "ctas.json");

export function allCtas(): Record<string, Cta> {
  if (!fs.existsSync(FILE)) return {};
  try {
    return JSON.parse(fs.readFileSync(FILE, "utf8"));
  } catch (e) {
    console.warn("content/ctas.json could not be read:", e);
    return {};
  }
}

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// HTML for one CTA card. Used inside posts (:::cta name) and at the end of every post.
// "compact" is the narrow version for the magazine layout's sidebar.
export function ctaHtml(id: string, compact = false): string {
  const c = allCtas()[id];
  if (!c) {
    console.warn(`Blog CTA "${id}" isn't in content/ctas.json`);
    return "";
  }
  const external = /^https?:\/\//.test(c.link);
  return `<aside class="blog-cta${compact ? " blog-cta-compact" : ""}" aria-label="${esc(c.title)}">
  <div class="blog-cta-text">
    ${c.eyebrow ? `<p class="blog-cta-eyebrow">${esc(c.eyebrow)}</p>` : ""}
    <p class="blog-cta-title">${esc(c.title)}</p>
    ${c.subtitle ? `<p class="blog-cta-sub">${esc(c.subtitle)}</p>` : ""}
    <a class="blog-cta-btn" href="${esc(c.link)}"${external ? ' target="_blank" rel="noopener noreferrer"' : ""}>${esc(c.button)} <span aria-hidden="true">→</span></a>
  </div>
  ${c.image ? `<div class="blog-cta-img"><img src="${esc(c.image)}" alt="${esc(c.imageAlt ?? "")}" loading="lazy" /></div>` : ""}
</aside>`;
}
