import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { card, eyebrow, primaryButton } from "@/components/styles";

export const metadata = { title: "Feed · Riposte" };

// The signed-in home. Shows setup progress until the signal feed arrives in phase 4.
export default async function AppHome() {
  const { supabase, user } = await requireUser();

  const [{ data: profile }, { count: competitorCount }, { count: sourceCount }] = await Promise.all([
    supabase.from("profiles").select("product_name").eq("id", user.id).maybeSingle(),
    supabase.from("competitors").select("id", { count: "exact", head: true }),
    supabase.from("sources").select("id", { count: "exact", head: true }),
  ]);

  const steps = [
    {
      done: Boolean(profile?.product_name),
      title: "Tell Riposte about your product",
      body: "Your product, what it does and who you sell to. Every signal is judged against this.",
      href: "/app/product",
      cta: "Add your product",
    },
    {
      done: (competitorCount ?? 0) > 0,
      title: "Add your competitors",
      body: "Type their website. Riposte finds their release notes, blog, feed and pricing page.",
      href: "/app/competitors",
      cta: "Add competitors",
    },
    {
      done: false,
      title: "Get your first signals",
      body: "Daily checks and AI-written signals arrive in the next phases.",
      href: null,
      cta: null,
    },
  ];
  const next = steps.find((s) => !s.done && s.href);

  return (
    <div>
      <p className={eyebrow}>Your workspace</p>
      <h1 className="mt-1 font-display text-3xl font-bold">
        {profile?.product_name ? `${profile.product_name}'s feed` : "Welcome to Riposte"}
      </h1>
      <p className="mt-2 text-muted">
        {competitorCount
          ? `Watching ${sourceCount ?? 0} pages across ${competitorCount} ${competitorCount === 1 ? "competitor" : "competitors"}.`
          : "Set up your workspace in two steps."}
      </p>

      <ol className={`${card} mt-6 divide-y divide-line`}>
        {steps.map((s, i) => (
          <li key={s.title} className="flex flex-wrap items-start gap-4 px-5 py-4">
            <span
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
                s.done ? "bg-accent text-accent-ink" : "border border-line text-muted"
              }`}
              aria-label={s.done ? "Done" : "Not done yet"}
            >
              {s.done ? "✓" : i + 1}
            </span>
            <div className="min-w-0 flex-1">
              <p className={`font-semibold ${s.done ? "text-muted line-through" : ""}`}>{s.title}</p>
              <p className="text-sm text-muted">{s.body}</p>
            </div>
            {s.href && !s.done && s === next && (
              <Link href={s.href} className={primaryButton}>
                {s.cta}
              </Link>
            )}
            {s.href && s.done && (
              <Link href={s.href} className="text-sm text-muted hover:text-ink">
                Edit
              </Link>
            )}
          </li>
        ))}
      </ol>

      <div className="mt-6 rounded-2xl border border-dashed border-line bg-surface p-8 text-center">
        <p className="font-semibold">Your signal feed will appear here.</p>
        <p className="mx-auto mt-1 max-w-md text-sm text-muted">
          Once checks are running, every real change from your competitors shows up here with what it means and what to
          do.
        </p>
      </div>
    </div>
  );
}
