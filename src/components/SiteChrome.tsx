import Link from "next/link";
import { Logo } from "@/components/Logo";

// Header and footer for the public pages (landing, blog, changelog, about).

const NAV = [
  { href: "/blog", label: "Blog" },
  { href: "/changelog", label: "Changelog" },
  { href: "/about", label: "About" },
];

export function SiteHeader({ signedIn = false }: { signedIn?: boolean }) {
  return (
    <header className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">
      <Logo />
      <nav className="flex items-center gap-1 text-sm" aria-label="Site">
        {NAV.map((n) => (
          <Link key={n.href} href={n.href} className="hidden rounded-lg px-3 py-1.5 font-medium text-muted hover:text-ink sm:inline-block">
            {n.label}
          </Link>
        ))}
        <Link
          href={signedIn ? "/app" : "/login"}
          className="ml-1 rounded-lg border border-line px-3 py-1.5 font-medium hover:border-muted"
        >
          {signedIn ? "Open dashboard →" : "Log in"}
        </Link>
      </nav>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-6 text-sm text-muted">
        <span>© {new Date().getFullYear()} Riposte · Founded by Saniya Gazala with ❤️ · Built with Claude 🤝</span>
        <nav className="flex gap-4" aria-label="Footer">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="hover:text-ink">
              {n.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}

export function JsonLd({ data }: { data: object }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}
