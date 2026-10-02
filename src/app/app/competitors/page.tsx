import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { card, eyebrow } from "@/components/styles";
import { AddCompetitorForm } from "./AddCompetitorForm";

export const metadata = { title: "Competitors · Riposte" };
export const maxDuration = 30;

export default async function CompetitorsPage() {
  const { supabase } = await requireUser();
  const { data: competitors } = await supabase
    .from("competitors")
    .select("id, name, domain, check_frequency, sources(count)")
    .order("created_at", { ascending: true });

  const list = (competitors ?? []) as {
    id: string;
    name: string;
    domain: string;
    check_frequency: string;
    sources: { count: number }[];
  }[];

  return (
    <div>
      <p className={eyebrow}>Competitors</p>
      <h1 className="mt-1 font-display text-3xl font-bold">Who you&apos;re watching</h1>
      <p className="mt-2 max-w-2xl text-muted">
        Add a competitor by its website. Riposte finds their release notes, blog, blog feed and pricing page for you.
        Start with the 3 to 5 you lose deals to.
      </p>

      <div className={`${card} mt-6 p-5 sm:p-6`}>
        <AddCompetitorForm />
      </div>

      <div className="mt-8">
        {list.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-line bg-surface p-8 text-center">
            <p className="font-semibold">No competitors yet.</p>
            <p className="mt-1 text-sm text-muted">Add your first one above, for example the company you lose the most deals to.</p>
          </div>
        ) : (
          <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
            {list.map((c) => {
              const count = c.sources?.[0]?.count ?? 0;
              return (
                <li key={c.id}>
                  <Link href={`/app/competitors/${c.id}`} className="flex flex-wrap items-center justify-between gap-2 px-5 py-4 hover:bg-bg">
                    <div className="min-w-0">
                      <p className="font-semibold">{c.name}</p>
                      <p className="truncate font-mono text-sm text-muted">{c.domain}</p>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-muted">
                      <span>
                        {count} {count === 1 ? "page" : "pages"} watched
                      </span>
                      <span className="rounded-full border border-line px-2 py-0.5 text-xs">checks {c.check_frequency}</span>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
