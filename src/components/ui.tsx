import Link from "next/link";
import { eyebrow } from "@/components/styles";

// Shared layout pieces for the app pages (server-rendered).

export function PageHeader({
  kicker,
  title,
  description,
  actions,
}: {
  kicker: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0 max-w-3xl">
        <p className={eyebrow}>{kicker}</p>
        <h1 className="mt-1 font-display text-2xl font-bold sm:text-3xl">{title}</h1>
        {description && <p className="mt-1.5 text-sm text-muted sm:text-base">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-start gap-2">{actions}</div>}
    </div>
  );
}

// Tabs that change the page address (?tab=…), so the server renders only the open tab.
export function LinkTabs({
  tabs,
  active,
  className = "",
}: {
  tabs: { key: string; label: string; href: string; count?: number }[];
  active: string;
  className?: string;
}) {
  return (
    <nav className={`flex gap-1 overflow-x-auto border-b border-line ${className}`} aria-label="Sections">
      {tabs.map((t) => {
        const on = t.key === active;
        return (
          <Link
            key={t.key}
            href={t.href}
            scroll={false}
            aria-current={on ? "page" : undefined}
            className={`-mb-px flex shrink-0 items-center gap-1.5 border-b-2 px-3 pb-2.5 pt-1 text-sm font-semibold ${
              on ? "border-accent text-ink" : "border-transparent text-muted hover:text-ink"
            }`}
          >
            {t.label}
            {t.count !== undefined && (
              <span className={`rounded-full px-1.5 py-0.5 text-xs font-medium ${on ? "bg-accent-soft text-ink" : "bg-bg text-muted"}`}>
                {t.count}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}

// "Showing 11–20 of 48" with previous / next and page numbers.
export function Pager({
  page,
  perPage,
  total,
  href,
}: {
  page: number;
  perPage: number;
  total: number;
  href: (page: number) => string;
}) {
  const pages = Math.max(1, Math.ceil(total / perPage));
  if (pages <= 1) return null;
  const start = (page - 1) * perPage + 1;
  const end = Math.min(total, page * perPage);
  const nums = Array.from({ length: pages }, (_, i) => i + 1).filter((n) => n === 1 || n === pages || Math.abs(n - page) <= 1);
  const btn = "inline-flex min-w-8 items-center justify-center rounded-md border px-2 py-1 text-sm";
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-1 text-sm">
      <span className="text-muted">
        Showing {start}–{end} of {total}
      </span>
      <div className="flex items-center gap-1">
        {page > 1 ? (
          <Link href={href(page - 1)} scroll={false} className={`${btn} border-line bg-surface hover:border-muted`}>
            ← Prev
          </Link>
        ) : (
          <span className={`${btn} border-line text-muted opacity-50`}>← Prev</span>
        )}
        {nums.map((n, i) => (
          <span key={n} className="flex items-center gap-1">
            {i > 0 && n - nums[i - 1] > 1 && <span className="text-muted">…</span>}
            <Link
              href={href(n)}
              scroll={false}
              aria-current={n === page ? "page" : undefined}
              className={`${btn} ${n === page ? "border-accent bg-accent-soft font-semibold" : "border-line bg-surface hover:border-muted"}`}
            >
              {n}
            </Link>
          </span>
        ))}
        {page < pages ? (
          <Link href={href(page + 1)} scroll={false} className={`${btn} border-line bg-surface hover:border-muted`}>
            Next →
          </Link>
        ) : (
          <span className={`${btn} border-line text-muted opacity-50`}>Next →</span>
        )}
      </div>
    </div>
  );
}

export function PanelHead({ title, description, actions }: { title: React.ReactNode; description?: React.ReactNode; actions?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line px-4 py-3 sm:px-5">
      <div className="min-w-0">
        <h2 className="font-display text-lg font-bold">{title}</h2>
        {description && <p className="mt-0.5 text-sm text-muted">{description}</p>}
      </div>
      {actions}
    </div>
  );
}

export function Empty({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-line bg-surface p-8 text-center">
      <p className="font-semibold">{title}</p>
      {children && <div className="mx-auto mt-1 max-w-md text-sm text-muted">{children}</div>}
    </div>
  );
}

// Builds "/path?a=1&b=2" from a base and params, dropping empty values.
export function withParams(path: string, params: Record<string, string | number | undefined | null>) {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== null && v !== "") p.set(k, String(v));
  const q = p.toString();
  return q ? `${path}?${q}` : path;
}

export const pageNum = (v: string | undefined) => Math.max(1, Math.floor(Number(v) || 1));
