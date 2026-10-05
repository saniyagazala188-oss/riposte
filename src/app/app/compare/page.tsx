import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { card, eyebrow } from "@/components/styles";
import { timeAgo } from "@/lib/time";
import { loadComparisons } from "@/lib/compare/stale";
import { changedRows, comparisonMarkdown } from "@/lib/compare/prompt";
import { CopyButton, WriteButton } from "./CompareButtons";

export const metadata = { title: "Comparisons · Riposte" };
export const maxDuration = 90;

const clean = (n: string) => n.replace(/\(.*?\)/g, "").trim();

export default async function ComparePage({ searchParams }: { searchParams: Promise<{ c?: string }> }) {
  const { supabase, user } = await requireUser();
  const [{ data: comps }, { data: profile }] = await Promise.all([
    supabase.from("competitors").select("id, name").order("name"),
    supabase.from("profiles").select("product_name").eq("id", user.id).maybeSingle(),
  ]);
  const list = comps ?? [];
  const { pages, stale } = await loadComparisons(supabase);
  const { c } = await searchParams;
  const selected = list.find((x) => x.id === c) ?? list.find((x) => pages.has(x.id)) ?? list[0];
  const page = selected ? pages.get(selected.id) : undefined;
  const changes = selected ? stale.get(selected.id) ?? [] : [];
  const you = profile?.product_name || "You";
  const them = selected ? clean(selected.name) : "";
  const updated = page ? changedRows(page.content, page.previous_content) : new Set<string>();

  return (
    <div>
      <p className={eyebrow}>Living comparisons</p>
      <h1 className="mt-1 font-display text-3xl font-bold">Comparison pages that stay true</h1>
      <p className="mt-2 max-w-2xl text-muted">
        A fair &quot;{you} vs competitor&quot; page, written from your profile and what Riposte reads on their site. When
        they change pricing, product or positioning, the page is flagged out of date and updates in one click.
      </p>

      {!list.length ? (
        <p className="mt-6 text-muted">
          Add a competitor first on the <Link href="/app/competitors" className="text-accent hover:underline">Competitors</Link> page.
        </p>
      ) : (
        <>
          <nav className="mt-6 flex flex-wrap gap-2" aria-label="Competitors">
            {list.map((x) => {
              const active = x.id === selected?.id;
              const status = !pages.has(x.id) ? "not written" : stale.has(x.id) ? "out of date" : "up to date";
              return (
                <Link
                  key={x.id}
                  href={`/app/compare?c=${x.id}`}
                  aria-current={active ? "page" : undefined}
                  className={`rounded-xl border px-3 py-2 text-sm ${active ? "border-accent bg-accent-soft" : "border-line bg-surface hover:border-muted"}`}
                >
                  <span className="font-semibold">vs {clean(x.name)}</span>
                  <span className={`ml-2 text-xs ${status === "out of date" ? "font-semibold text-signal" : status === "up to date" ? "text-accent" : "text-muted"}`}>
                    {status === "up to date" ? "✓ up to date" : status}
                  </span>
                </Link>
              );
            })}
          </nav>

          {selected && !page && (
            <section className={`${card} mt-5 p-6`}>
              <h2 className="font-display text-xl font-bold">
                {you} vs {them}
              </h2>
              <p className="mb-4 mt-1 text-sm text-muted">
                Riposte uses their pricing page, release notes and the changes it detected, plus your product profile. Anything
                it doesn&apos;t know is left as a [placeholder] or &quot;Not published&quot;, never guessed.
              </p>
              <WriteButton competitorId={selected.id} mode="new" />
            </section>
          )}

          {selected && page && (
            <>
              {changes.length > 0 && (
                <section className="mt-5 rounded-2xl border border-signal bg-signal-soft p-5">
                  <h2 className="font-semibold">
                    Out of date: {them} changed {changes.length === 1 ? "something" : `${changes.length} things`} since this page was written
                  </h2>
                  <ul className="mb-4 mt-2 list-disc pl-5 text-sm">
                    {changes.slice(0, 5).map((s) => (
                      <li key={s.id}>
                        <Link href={`/app#signal-${s.id}`} className="hover:underline">
                          {s.title}
                        </Link>{" "}
                        <span className="text-muted">· {timeAgo(s.created_at)}</span>
                      </li>
                    ))}
                  </ul>
                  <WriteButton competitorId={selected.id} mode="update" />
                </section>
              )}

              <article className={`${card} mt-5`}>
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-3 text-sm">
                  <span className="text-muted">
                    Written {timeAgo(page.generated_at)}
                    {page.previous_generated_at && ` · previous version ${timeAgo(page.previous_generated_at)}`}
                    {updated.size > 0 && <span className="ml-1 font-semibold text-accent">· {updated.size} rows updated</span>}
                  </span>
                  <div className="flex flex-wrap items-start gap-2">
                    <CopyButton text={comparisonMarkdown(page.content, you, them)} />
                    {!changes.length && <WriteButton competitorId={selected.id} mode="redo" />}
                  </div>
                </div>

                <div className="px-5 py-6 md:px-8">
                  <h2 className="font-display text-2xl font-bold leading-snug">{page.content.title}</h2>
                  <p className="mt-1 text-xs text-muted">Meta description: {page.content.meta_description}</p>
                  <p className="mt-4">{page.content.intro}</p>

                  <div className="mt-5 overflow-x-auto">
                    <table className="w-full min-w-[520px] border-collapse text-sm">
                      <thead>
                        <tr className="border-b border-line text-left">
                          <th className="w-1/5 py-2 pr-3" />
                          <th className="py-2 pr-3 font-display text-base">{you}</th>
                          <th className="py-2 font-display text-base">{them}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {page.content.rows.map((r) => (
                          <tr key={r.criterion} className={`border-b border-line align-top ${updated.has(r.criterion) ? "bg-accent-soft" : ""}`}>
                            <th className="py-2.5 pr-3 text-left font-semibold">
                              {r.criterion}
                              {updated.has(r.criterion) && <span className="mt-0.5 block text-xs font-normal text-accent">Updated</span>}
                            </th>
                            <td className="py-2.5 pr-3">{r.you}</td>
                            <td className="py-2.5">{r.them}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="mt-6 grid gap-4 md:grid-cols-2">
                    <div className="rounded-lg bg-accent-soft p-4">
                      <h3 className="font-semibold">Choose {you} if</h3>
                      <ul className="mt-2 list-disc pl-5 text-sm">
                        {page.content.choose_you.map((x) => (
                          <li key={x}>{x}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="rounded-lg bg-bg p-4">
                      <h3 className="font-semibold">Choose {them} if</h3>
                      <ul className="mt-2 list-disc pl-5 text-sm">
                        {page.content.choose_them.map((x) => (
                          <li key={x}>{x}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <h3 className="mt-6 font-display text-lg font-bold">The verdict</h3>
                  <p className="mt-1">{page.content.verdict}</p>

                  <h3 className="mt-6 font-display text-lg font-bold">FAQ</h3>
                  <dl className="mt-2 flex flex-col gap-3 text-sm">
                    {page.content.faq.map((f) => (
                      <div key={f.q}>
                        <dt className="font-semibold">{f.q}</dt>
                        <dd className="mt-0.5">{f.a}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              </article>
            </>
          )}
        </>
      )}
    </div>
  );
}
