import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { card } from "@/components/styles";
import { timeAgo } from "@/lib/time";
import { briefMarkdown, type Brief } from "@/lib/briefs/prompt";
import { CopyButton } from "@/app/app/compare/CompareButtons";
import { SubmitButton } from "@/components/FormButtons";
import { PageHeader } from "@/components/ui";
import { deleteBrief, setBriefStatus } from "../actions";

export const metadata = { title: "Content brief · Riposte" };

const STATUS = { new: "New", writing: "Writing", published: "Published" } as const;

export default async function BriefPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await requireUser();
  const { data: row } = await supabase.from("content_briefs").select("id, created_at, source, topic, content, status").eq("id", id).maybeSingle();
  if (!row) notFound();
  const b = row.content as Brief;
  const status = row.status as keyof typeof STATUS;

  return (
    <div>
      <Link href="/app/content" className="text-sm text-muted hover:text-ink">
        ← Content intel
      </Link>
      <div className="mt-2">
        <PageHeader
          kicker={row.source === "trend" ? "Content brief · from a trend" : "Content brief · to win an AI answer"}
          title={b.title}
          description={`For: ${row.topic} · written ${timeAgo(row.created_at)}`}
          actions={<CopyButton text={briefMarkdown(b)} />}
        />
      </div>

      <div className="mt-5 grid items-start gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <article className={`${card} p-5 sm:p-6`}>
          <section className="rounded-xl border border-accent bg-accent-soft p-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-accent">Quick answer · top of the page</p>
            <p className="mt-1.5">{b.quick_answer}</p>
          </section>

          <h2 className="mt-6 font-display text-lg font-bold">Outline</h2>
          <ol className="mt-2 flex flex-col gap-3">
            {b.outline.map((o, i) => (
              <li key={o.heading} className="rounded-xl bg-bg p-3">
                <p className="font-semibold">
                  <span className="mr-2 font-mono text-xs text-muted">H2 · {i + 1}</span>
                  {o.heading}
                </p>
                <ul className="mt-1 list-disc pl-5 text-sm text-muted">
                  {o.points.map((p) => (
                    <li key={p}>{p}</li>
                  ))}
                </ul>
              </li>
            ))}
          </ol>

          <h2 className="mt-6 font-display text-lg font-bold">FAQs to answer</h2>
          <ul className="mt-2 list-disc pl-5 text-sm">
            {b.faqs.map((q) => (
              <li key={q}>{q}</li>
            ))}
          </ul>

          <h2 className="mt-6 font-display text-lg font-bold">Call to action</h2>
          <p className="mt-1 text-sm">{b.cta}</p>
        </article>

        <aside className="flex flex-col gap-4 lg:sticky lg:top-6">
          <section className={`${card} p-5 text-sm`}>
            <dl className="flex flex-col gap-3">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wider text-muted">Target keyword</dt>
                <dd className="mt-0.5 font-semibold">{b.target_keyword}</dd>
              </div>
              {b.secondary_keywords.length > 0 && (
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wider text-muted">Also cover</dt>
                  <dd className="mt-1 flex flex-wrap gap-1">
                    {b.secondary_keywords.map((k) => (
                      <span key={k} className="rounded-full bg-bg px-2 py-0.5 text-xs">
                        {k}
                      </span>
                    ))}
                  </dd>
                </div>
              )}
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wider text-muted">Meta title</dt>
                <dd className="mt-0.5">
                  {b.meta_title} <span className="text-xs text-muted">({b.meta_title.length} characters)</span>
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wider text-muted">Search intent</dt>
                <dd className="mt-0.5">
                  <span className="font-semibold capitalize">{b.intent}</span>. {b.intent_why}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wider text-muted">Angle</dt>
                <dd className="mt-0.5">{b.angle}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wider text-muted">What competitors cover</dt>
                <dd className="mt-0.5">{b.competitor_notes}</dd>
              </div>
            </dl>
          </section>

          <section className={`${card} p-5`}>
            <p className="text-sm font-semibold">
              Status: <span className="text-accent">{STATUS[status]}</span>
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {(Object.keys(STATUS) as (keyof typeof STATUS)[])
                .filter((s) => s !== status)
                .map((s) => (
                  <form key={s} action={setBriefStatus}>
                    <input type="hidden" name="brief_id" value={row.id} />
                    <input type="hidden" name="status" value={s} />
                    <SubmitButton pendingLabel="…">Mark {STATUS[s].toLowerCase()}</SubmitButton>
                  </form>
                ))}
              <form action={deleteBrief}>
                <input type="hidden" name="brief_id" value={row.id} />
                <SubmitButton pendingLabel="…" className="px-2 text-sm text-muted hover:text-danger">
                  Delete
                </SubmitButton>
              </form>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
