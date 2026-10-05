import type { MetadataRoute } from "next";
import { allPosts } from "@/lib/blog";
import { SITE_URL } from "@/lib/site";

// Public pages only; the app itself is behind login.
export default function sitemap(): MetadataRoute.Sitemap {
  const posts = allPosts();
  const latest = posts[0]?.updated ?? "2026-10-05";
  return [
    { url: SITE_URL, lastModified: latest, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/blog`, lastModified: latest, changeFrequency: "weekly", priority: 0.8 },
    ...posts.map((p) => ({ url: `${SITE_URL}/blog/${p.slug}`, lastModified: p.updated, changeFrequency: "monthly" as const, priority: 0.7 })),
    { url: `${SITE_URL}/changelog`, lastModified: latest, changeFrequency: "weekly", priority: 0.5 },
    { url: `${SITE_URL}/about`, lastModified: latest, changeFrequency: "monthly", priority: 0.5 },
  ];
}
