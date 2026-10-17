import Link from "next/link";

// The two halves of "News & more": news coverage, and competitors' social media.
export function NewsSwitch({ active }: { active: "news" | "social" }) {
  const item = (key: "news" | "social", href: string, label: string) => (
    <Link
      href={href}
      aria-current={active === key ? "page" : undefined}
      className={`rounded-lg px-4 py-1.5 text-sm font-semibold transition ${
        active === key ? "bg-surface text-ink shadow-sm" : "text-muted hover:text-ink"
      }`}
    >
      {label}
    </Link>
  );
  return (
    <div className="mt-5 inline-flex rounded-xl border border-line bg-bg p-1" role="group" aria-label="News or social media">
      {item("news", "/app/news", "News")}
      {item("social", "/app/social", "Social media")}
    </div>
  );
}
