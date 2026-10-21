// Where someone joined the waitlist from. The form sends the page's path (like "/tools/battlecard-generator"),
// it's saved in waitlist.source, and Admin shows it as a friendly name.

// Keep only a clean site path, so nothing odd ends up in the database.
export function cleanPath(raw: unknown): string | null {
  const v = String(raw ?? "").trim().toLowerCase();
  if (!v.startsWith("/") || v.length > 120 || !/^\/[a-z0-9/_-]*$/.test(v)) return null;
  return v;
}

const PAGES: Record<string, string> = {
  "/": "Homepage",
  "/competitor-tracking-tool": "Product page",
  "/tools/battlecard-generator": "Battlecard tool",
  "/alternatives": "Compare page",
  "/blog": "Blog home",
  "/docs": "Docs home",
  "/changelog": "Changelog",
};

// "/blog/how-to-track-competitors" → "Blog: how to track competitors". Older rows ("landing", "signed up") stay as they are.
export function pageLabel(source: string | null): string {
  if (!source) return "Website";
  if (!source.startsWith("/")) return source === "landing" ? "Website" : source.charAt(0).toUpperCase() + source.slice(1);
  if (PAGES[source]) return PAGES[source];
  const [, section, slug] = source.split("/");
  const words = (slug ?? "").replace(/-/g, " ");
  if (section === "blog") return `Blog: ${words}`;
  if (section === "alternatives") return `Compare: ${words.charAt(0).toUpperCase()}${words.slice(1)}`;
  if (section === "docs") return `Docs: ${words}`;
  if (section === "authors") return "Author page";
  return source;
}
