"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

// 24×24 line icons (Lucide-style), drawn with the current text colour.
const ICONS: Record<string, React.ReactNode> = {
  feed: <path d="M22 12h-4l-3 9L9 3l-3 9H2" />,
  actions: (
    <>
      <path d="m9 11 3 3L22 4" />
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
    </>
  ),
  competitors: (
    <>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </>
  ),
  content: (
    <>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
    </>
  ),
  compare: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M12 3v18" />
    </>
  ),
  prompts: <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />,
  visibility: (
    <>
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7S2 12 2 12z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  product: (
    <>
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <path d="M3.3 7 12 12l8.7-5M12 22V12" />
    </>
  ),
  alerts: (
    <>
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </>
  ),
  blog: (
    <>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z" />
    </>
  ),
  changelog: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  about: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </>
  ),
};

function Icon({ name }: { name: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="shrink-0">
      {ICONS[name]}
    </svg>
  );
}

type Item = { href: string; label: string; icon: string; badge?: number };
type Group = { label: string; items: Item[] };

export function navGroups(counts: { toReview: number; openActions: number }): Group[] {
  return [
    {
      label: "Monitor",
      items: [
        { href: "/app", label: "Feed", icon: "feed", badge: counts.toReview },
        { href: "/app/actions", label: "Actions", icon: "actions", badge: counts.openActions },
        { href: "/app/competitors", label: "Competitors", icon: "competitors" },
      ],
    },
    {
      label: "Content",
      items: [
        { href: "/app/content", label: "Content intel", icon: "content" },
        { href: "/app/compare", label: "Comparisons", icon: "compare" },
      ],
    },
    {
      label: "AI search",
      items: [
        { href: "/app/prompts", label: "Prompt Studio", icon: "prompts" },
        { href: "/app/visibility", label: "AI visibility", icon: "visibility" },
      ],
    },
    {
      label: "Settings",
      items: [
        { href: "/app/product", label: "Your product", icon: "product" },
        { href: "/app/settings", label: "Alerts & account", icon: "alerts" },
      ],
    },
    {
      label: "Riposte",
      items: [
        { href: "/blog", label: "Blog", icon: "blog" },
        { href: "/changelog", label: "Changelog", icon: "changelog" },
        { href: "/about", label: "About the founder", icon: "about" },
      ],
    },
  ];
}

function NavList({ groups, onNavigate }: { groups: Group[]; onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Main" className="flex flex-col gap-5">
      {groups.map((g) => (
        <div key={g.label}>
          <p className="px-3 text-[11px] font-semibold uppercase tracking-widest text-muted">{g.label}</p>
          <ul className="mt-1.5 flex flex-col gap-0.5">
            {g.items.map((l) => {
              const active = l.href === "/app" ? pathname === "/app" : pathname.startsWith(l.href);
              return (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium ${
                      active ? "bg-accent-soft text-ink" : "text-muted hover:bg-bg hover:text-ink"
                    }`}
                  >
                    <span className={active ? "text-accent" : ""}>
                      <Icon name={l.icon} />
                    </span>
                    <span className="flex-1">{l.label}</span>
                    {l.badge ? (
                      <span className="rounded-full bg-signal-soft px-2 py-0.5 text-xs font-semibold text-signal">{l.badge}</span>
                    ) : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

function Account({ email }: { email: string }) {
  return (
    <div className="border-t border-line pt-4">
      <p className="truncate px-3 text-xs text-muted" title={email}>
        {email}
      </p>
      <form action="/auth/signout" method="post" className="mt-2 px-3">
        <button className="text-sm font-medium text-muted hover:text-ink">Log out</button>
      </form>
    </div>
  );
}

// Desktop: a fixed sidebar. Phone and tablet: a top bar with a menu button.
export function AppSidebar({
  logo,
  email,
  counts,
}: {
  logo: React.ReactNode;
  email: string;
  counts: { toReview: number; openActions: number };
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  useEffect(() => setOpen(false), [pathname]);
  const groups = navGroups(counts);

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-line bg-surface px-3 py-5 lg:flex">
        <div className="px-3">{logo}</div>
        <div className="mt-7 flex-1 overflow-y-auto">
          <NavList groups={groups} />
        </div>
        <Account email={email} />
      </aside>

      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-line bg-surface px-4 py-3 lg:hidden">
        {logo}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="mobile-nav"
          className="rounded-lg border border-line px-3 py-1.5 text-sm font-medium"
        >
          {open ? "Close" : "Menu"}
        </button>
      </header>
      {open && (
        <div id="mobile-nav" className="fixed inset-x-0 top-[57px] bottom-0 z-20 overflow-y-auto bg-surface px-3 py-5 lg:hidden">
          <NavList groups={groups} onNavigate={() => setOpen(false)} />
          <div className="mt-6">
            <Account email={email} />
          </div>
        </div>
      )}
    </>
  );
}
