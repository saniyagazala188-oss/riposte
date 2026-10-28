import { card } from "@/components/styles";

type Cited = { prompt: string; title: string; run_at: string };

const fmt = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "Asia/Kolkata" });

// When AI answers cite your own website: how often in the latest run, and the first time it happened.
export function YourSiteCard({
  site,
  latestCited,
  latestTotal,
  first,
  prompts,
  runs,
}: {
  site: string;
  latestCited: number;
  latestTotal: number;
  first: Cited | null;
  prompts: { prompt: string; first: string; times: number }[];
  runs: number;
}) {
  return (
    <section className={`${card} mt-5`}>
      <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-line px-5 py-4">
        <div>
          <h2 className="font-display text-xl font-bold">Your site in AI answers</h2>
          <p className="mt-0.5 text-sm text-muted">When answers use {site} as a source, even if they don&apos;t name you.</p>
        </div>
        <p className="font-mono text-sm">
          {latestCited}/{latestTotal} <span className="text-muted">in the latest run</span>
        </p>
      </div>
      <div className="px-5 py-4 text-sm">
        {first ? (
          <>
            <p>
              <span className="font-semibold">First cited {fmt(first.run_at)}</span>{" "}
              <span className="text-muted">
                for &ldquo;{first.prompt}&rdquo;.
              </span>
            </p>
            {prompts.length > 0 && (
              <ul className="mt-3 flex flex-col gap-1.5">
                {prompts.map((p) => (
                  <li key={p.prompt} className="flex flex-wrap justify-between gap-2">
                    <span>&ldquo;{p.prompt}&rdquo;</span>
                    <span className="text-muted">
                      cited {p.times}× · first {fmt(p.first)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </>
        ) : (
          <p className="text-muted">
            Not cited yet in {runs} saved answer{runs === 1 ? "" : "s"}. That&apos;s normal: most new pages aren&apos;t cited by AI in their first two
            months. Getting listed on the sites below, and pages that answer a buyer&apos;s question in the first line, help most.
          </p>
        )}
      </div>
    </section>
  );
}
