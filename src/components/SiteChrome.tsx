import Link from "next/link";
import { Logo } from "@/components/Logo";

// Header and footer for the public pages (landing, blog, changelog, about).

const NAV = [
  { href: "/pricing", label: "Pricing" },
  { href: "/docs", label: "Docs" },
  { href: "/blog", label: "Blog" },
  { href: "/changelog", label: "Changelog" },
  { href: "/authors/saniya-gazala", label: "About" },
];

export function SiteHeader({
  signedIn = false,
  hideAuth = false,
}: {
  signedIn?: boolean;
  hideAuth?: boolean;
}) {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-surface/85 backdrop-blur supports-[backdrop-filter]:bg-surface/75">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-3.5">
      <Logo />
      <nav
        className="flex flex-wrap items-center gap-0.5 text-sm sm:gap-1"
        aria-label="Site"
      >
        {NAV.map((n) => (
          <Link
            key={n.href}
            href={n.href}
            className="rounded-lg px-2 py-1.5 font-medium text-muted hover:text-ink sm:px-3"
          >
            {n.label}
          </Link>
        ))}
        {!hideAuth && (
          <Link
            href={signedIn ? "/app" : "/login"}
            className="ml-1 rounded-lg border border-line px-3 py-1.5 font-medium hover:border-muted"
          >
            {signedIn ? "Open dashboard →" : "Log in"}
          </Link>
        )}
      </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-6 text-sm text-muted">
        <span>
          © {new Date().getFullYear()} Riposte · Made by Saniya Gazala with
          ❤️ · Built with Claude 🤝
        </span>
        <nav className="flex flex-wrap gap-4" aria-label="Footer">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="hover:text-ink">
              {n.label}
            </Link>
          ))}
          <Link href="/privacy" className="hover:text-ink">
            Privacy
          </Link>
          <Link href="/terms" className="hover:text-ink">
            Terms
          </Link>
        </nav>
      </div>
    </footer>
  );
}

export function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}
