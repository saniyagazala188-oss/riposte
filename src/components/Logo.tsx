import Link from "next/link";

// The Riposte mark: a parry (the bar) and the reply (the arrow).
export function Logo({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="inline-flex items-center gap-2 font-display text-lg font-bold tracking-tight text-ink">
      <svg width="26" height="26" viewBox="0 0 26 26" aria-hidden="true">
        <rect x="3" y="4" width="3" height="18" rx="1.5" fill="var(--muted)" />
        <path d="M9 18 L20 7" stroke="var(--accent)" strokeWidth="3" strokeLinecap="round" />
        <path d="M14 7 H20 V13" fill="none" stroke="var(--accent)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      Riposte
    </Link>
  );
}
