import type { MetadataRoute } from "next";
import { allPosts } from "@/lib/blog";
import { allAuthors } from "@/lib/authors";
import { allDocs } from "@/lib/docs";
import { SITE_URL } from "@/lib/site";

// Public pages only; the app itself is behind login.
export default function sitemap(): MetadataRoute.Sitemap {
  const posts = allPosts();
  const latest = posts[0]?.updated ?? "2026-10-05";
  return [
    { url: SITE_URL, lastModified: latest, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/blog`, lastModified: latest, changeFrequency: "weekly", priority: 0.8 },
    ...posts.map((p) => ({ url: `${SITE_URL}/blog/${p.slug}`, lastModified: p.updated, changeFrequency: "monthly" as const, priority: 0.7 })),
    { url: `${SITE_URL}/pricing`, lastModified: "2026-10-20", changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE_URL}/docs`, lastModified: latest, changeFrequency: "weekly", priority: 0.7 },
    ...allDocs().map((d) => ({ url: `${SITE_URL}/docs/${d.slug}`, lastModified: d.updated || latest, changeFrequency: "monthly" as const, priority: 0.6 })),
    { url: `${SITE_URL}/authors`, lastModified: latest, changeFrequency: "monthly", priority: 0.4 },
    ...allAuthors().map((a) => ({ url: a.url, lastModified: latest, changeFrequency: "monthly" as const, priority: 0.5 })),
    { url: `${SITE_URL}/changelog`, lastModified: latest, changeFrequency: "weekly", priority: 0.5 },
    { url: `${SITE_URL}/privacy`, lastModified: latest, changeFrequency: "yearly", priority: 0.2 },
    { url: `${SITE_URL}/terms`, lastModified: latest, changeFrequency: "yearly", priority: 0.2 },
  ];
}
