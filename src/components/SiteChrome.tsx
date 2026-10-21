import Link from "next/link";
import { Logo } from "@/components/Logo";
import { ALTERNATIVES } from "@/lib/alternatives";

// Header and footer for the public pages (landing, blog, changelog, about).

const NAV = [
  { href: "/competitor-tracking-tool", label: "Product" },
  { href: "/alternatives", label: "Compare" },
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
        {NAV.map((n) =>
          n.href === "/alternatives" ? (
            <div key={n.href} className="group relative">
              <Link
                href={n.href}
                className="rounded-lg px-2 py-1.5 font-medium text-muted hover:text-ink sm:px-3"
              >
                {n.label} <span aria-hidden className="text-xs">▾</span>
              </Link>
              <div className="invisible absolute top-full left-0 z-50 pt-2 opacity-0 transition group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100">
                <div className="w-56 rounded-xl border border-line bg-surface p-1.5 shadow-lg">
                  {ALTERNATIVES.map((a) => (
                    <Link
                      key={a.slug}
                      href={`/alternatives/${a.slug}`}
                      className="block rounded-lg px-3 py-2 text-muted hover:bg-accent-soft hover:text-ink"
                    >
                      {a.name} alternatives
                    </Link>
                  ))}
                  <Link
                    href="/alternatives"
                    className="mt-1 block rounded-lg border-t border-line px-3 py-2 font-semibold text-accent hover:bg-accent-soft"
                  >
                    All comparisons →
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <Link
              key={n.href}
              href={n.href}
              className="rounded-lg px-2 py-1.5 font-medium text-muted hover:text-ink sm:px-3"
            >
              {n.label}
            </Link>
          ),
        )}
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
        <nav className="flex w-full flex-wrap gap-x-4 gap-y-1 text-xs" aria-label="Compare">
          <span className="font-semibold">Compare:</span>
          {ALTERNATIVES.map((a) => (
            <Link key={a.slug} href={`/alternatives/${a.slug}`} className="hover:text-ink">
              {a.name} alternatives
            </Link>
          ))}
        </nav>
        <nav className="flex w-full flex-wrap gap-x-4 gap-y-1 text-xs" aria-label="Free tools">
          <span className="font-semibold">Free tools:</span>
          <Link href="/tools/battlecard-generator" className="hover:text-ink">
            Battlecard generator
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
