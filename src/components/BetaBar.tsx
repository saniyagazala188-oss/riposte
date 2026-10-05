import Link from "next/link";

// What beta users get, and how much they've used. Shown at the top of every page in /app
// for everyone except admins. Before they add a competitor it's a fuller welcome.
export function BetaBar({
  competitors,
  prompts,
  limits,
}: {
  competitors: number;
  prompts: number;
  limits: { competitors: number; trackedPrompts: number };
}) {
  const meter = (label: string, used: number, max: number) => (
    <span className={used >= max ? "font-semibold text-signal" : ""}>
      {label} <span className="font-semibold text-ink">{used}</span> of {max}
    </span>
  );

  if (competitors === 0) {
    return (
      <div className="mb-6 rounded-xl border border-accent bg-accent-soft p-4 text-sm sm:p-5">
        <p className="font-display text-lg font-bold">Welcome to the Riposte beta</p>
        <p className="mt-1 text-muted">It&apos;s free for as long as the beta runs, and you&apos;ll get 30 days&apos; notice before any pricing. Here&apos;s what&apos;s included:</p>
        <ul className="mt-2 grid gap-x-6 gap-y-1 sm:grid-cols-2">
          <li>• Watch up to {limits.competitors} competitors</li>
          <li>• Track up to {limits.trackedPrompts} AI search prompts</li>
          <li>• Every competitor checked each morning, plus Check now</li>
          <li>• Alerts by email, and a digest every Monday</li>
        </ul>
        <p className="mt-3 text-muted">
          Start with <Link href="/app/product" className="font-semibold text-accent hover:underline">Your product</Link>, then
          add your competitors. Something missing or confusing?{" "}
          <Link href="/app/feedback" className="font-semibold text-accent hover:underline">Tell me</Link>.
        </p>
      </div>
    );
  }

  return (
    <div className="mb-6 flex flex-wrap items-center gap-x-4 gap-y-1 rounded-lg border border-line bg-surface px-4 py-2 text-xs text-muted">
      <span className="rounded-full bg-accent-soft px-2 py-0.5 font-semibold text-ink">Free beta</span>
      {meter("Competitors", competitors, limits.competitors)}
      {meter("Tracked prompts", prompts, limits.trackedPrompts)}
      <span>Checked every morning</span>
      <Link href="/app/feedback" className="ml-auto font-semibold text-accent hover:underline">
        Give feedback →
      </Link>
    </div>
  );
}
