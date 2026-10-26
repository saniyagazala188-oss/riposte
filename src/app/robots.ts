import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/",
    // Rules match by prefix, so each path ends in "/" (or "$" for an exact page). "/auth" alone also blocked /authors.
    disallow: ["/app$", "/app/", "/api/", "/auth/", "/login", "/reset-password", "/waitlist"] }],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
