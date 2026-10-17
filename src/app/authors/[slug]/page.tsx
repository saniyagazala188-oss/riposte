import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { allAuthors, authorSchema, getAuthor, type Author } from "@/lib/authors";
import { allPosts, formatDate } from "@/lib/blog";
import { SITE_URL } from "@/lib/site";
import { JsonLd, SiteFooter, SiteHeader } from "@/components/SiteChrome";

export const dynamicParams = false;

export function generateStaticParams() {
  return allAuthors().map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const a = getAuthor((await params).slug);
  if (!a) return {};
  const title = `${a.name}, ${a.role.split("·")[0].trim()} · Riposte`;
  return {
    title,
    description: a.headline,
    alternates: { canonical: a.url },
    openGraph: {
      title,
      description: a.headline,
      url: a.url,
      type: "profile",
      ...(a.image ? { images: [{ url: `${SITE_URL}${a.image}`, alt: a.imageAlt }] } : {}),
    },
  };
}

const ICON: Record<string, string> = {
  linkedin:
    "M4.98 3.5a2.5 2.5 0 11-.01 5 2.5 2.5 0 01.01-5zM3 9h4v12H3zM9 9h3.8v1.7h.05c.53-1 1.83-2.05 3.77-2.05C20.6 8.65 21 11.2 21 14.5V21h-4v-5.8c0-1.4-.03-3.2-1.95-3.2-1.95 0-2.25 1.52-2.25 3.1V21H9z",
  medium: "M4 6.5c0-.3.1-.5.3-.7L6 4V3.8h5.4l4.2 9.2L19.3 3.8h5V4l-1.5 1.4c-.1.1-.2.3-.2.4v12.4c0 .2.1.3.2.4l1.5 1.4v.2h-7.3v-.2l1.5-1.5c.2-.2.2-.2.2-.4V8.1l-4.2 10.6H14L9.1 8.1v7.1c0 .3.1.6.3.8l2 2.4v.3H5.8v-.3l2-2.4c.2-.2.3-.5.3-.8V6.9z",
};
const iconFor = (label: string) => ICON[label.toLowerCase().split(" ")[0]];

export default async function AuthorPage({ params }: { params: Promise<{ slug: string }> }) {
  const a = getAuthor((await params).slug);
  if (!a) notFound();
  const posts = allPosts().filter((p) => p.author === a.slug);
  const first = a.name.split(" ")[0];
  // Topics they write about, from their posts' tags, most used first.
  const topics = Object.entries(
    posts.flatMap((p) => p.tags).reduce<Record<string, number>>((m, t) => ((m[t] = (m[t] ?? 0) + 1), m), {}),
  )
    .sort((x, y) => y[1] - x[1])
    .map(([t]) => t)
    .slice(0, 5);
  const current = a.experience.find((j) => /present/i.test(j.dates ?? ""));

  return (
    <div className="min-h-dvh">
      <SiteHeader />

      {/* Poster */}
      <section className="relative overflow-hidden border-b border-line bg-[linear-gradient(160deg,var(--accent-soft)_0%,var(--bg)_55%,var(--signal-soft)_100%)]">
        <div aria-hidden className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-accent/10 blur-2xl" />
        <div aria-hidden className="pointer-events-none absolute -bottom-32 left-1/3 h-72 w-72 rounded-full bg-signal/10 blur-2xl" />
        <div className="relative mx-auto max-w-6xl px-4 pt-8 pb-14">
          <nav className="flex items-center gap-1.5 text-sm text-muted" aria-label="Breadcrumb">
            <Link href="/blog" className="hover:text-ink">
              Blog
            </Link>
            <span aria-hidden>/</span>
            <Link href="/authors" className="hover:text-ink">
              Authors
            </Link>
            <span aria-hidden>/</span>
            <span className="text-ink">{a.name}</span>
          </nav>

          <div className="mt-10 grid items-center gap-10 md:grid-cols-[auto_minmax(0,1fr)]">
            <div className="relative mx-auto md:mx-0">
              <div aria-hidden className="absolute -inset-3 rotate-6 rounded-[2.2rem] border-2 border-dashed border-accent/40" />
              <div className="relative overflow-hidden rounded-[2rem] border-4 border-surface bg-surface shadow-[0_30px_60px_-30px_rgba(14,60,58,0.55)]">
                {a.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={a.image} alt={a.imageAlt} width={280} height={320} className="block h-80 w-64 object-cover sm:w-72" />
                ) : (
                  <div className="flex h-80 w-64 items-center justify-center bg-[linear-gradient(160deg,var(--accent),#0a4f4b)] sm:w-72">
                    <span className="font-display text-7xl font-extrabold text-accent-ink">{a.initials}</span>
                  </div>
                )}
              </div>
              {a.location && (
                <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border border-line bg-surface px-3.5 py-1.5 text-xs font-semibold shadow-sm">
                  📍 {a.location}
                </span>
              )}
            </div>

            <div className="text-center md:text-left">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">Author</p>
              <h1 className="mt-3 font-display text-5xl font-extrabold leading-none tracking-tight sm:text-7xl">{a.name}</h1>
              {a.role && <p className="mt-4 text-lg font-semibold text-signal">{a.role}</p>}
              {a.headline && <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted sm:text-xl">{a.headline}</p>}
              <div className="mt-7 flex flex-wrap justify-center gap-2.5 md:justify-start">
                {a.links.map((l) => (
                  <a
                    key={l.url}
                    href={l.url}
                    target="_blank"
                    rel="noopener noreferrer me"
                    className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-4 py-2 text-sm font-semibold transition hover:border-accent hover:text-accent"
                  >
                    {iconFor(l.label) && (
                      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
                        <path d={iconFor(l.label)} />
                      </svg>
                    )}
                    {l.label}
                  </a>
                ))}
                {posts.length > 0 && (
                  <a href="#posts" className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-accent-ink">
                    {posts.length} {posts.length === 1 ? "post" : "posts"} ↓
                  </a>
                )}
              </div>
            </div>
          </div>

          {a.highlights.length > 0 && (
            <dl className="mt-14 grid grid-cols-2 gap-3 md:grid-cols-4">
              {a.highlights.map((h) => (
                <div key={h.label} className="rounded-2xl border border-line bg-surface/90 p-5 backdrop-blur">
                  <dd className="font-display text-4xl font-extrabold text-accent">{h.value}</dd>
                  <dt className="mt-1.5 text-sm leading-snug text-muted">{h.label}</dt>
                </div>
              ))}
            </dl>
          )}
        </div>
      </section>

      <div className="blog-canvas">
        <main className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:py-16 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="flex min-w-0 flex-col gap-8">
            {a.html && (
              <section className="rounded-3xl border border-line bg-surface px-5 py-7 sm:px-10 sm:py-9">
                <div className="prose-riposte author-story" dangerouslySetInnerHTML={{ __html: a.html }} />
              </section>
            )}

            {a.experience.length > 0 && <Experience a={a} />}

            {a.sections.map((s) => (
              <section key={s.title} className="rounded-3xl border border-line bg-surface px-5 py-7 sm:px-10 sm:py-9">
                <h2 className="font-display text-2xl font-bold">{s.title}</h2>
                <ul className="mt-5 grid gap-3 sm:grid-cols-2">
                  {s.items.map((it) => (
                    <li key={it.title} className="rounded-2xl border border-line bg-bg p-4">
                      <p className="font-semibold">
                        {it.url ? (
                          <a href={it.url} target="_blank" rel="noopener noreferrer" className="hover:text-accent hover:underline">
                            {it.title} ↗
                          </a>
                        ) : (
                          it.title
                        )}
                      </p>
                      {it.meta && <p className="mt-0.5 text-xs text-muted">{it.meta}</p>}
                      {it.text && <p className="mt-1.5 text-sm leading-relaxed text-muted">{it.text}</p>}
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>

          <aside className="flex flex-col gap-5 lg:sticky lg:top-24 lg:self-start">
            {/* Plain facts in one place: easy for readers to scan and for AI answers to quote. */}
            <Card title="Quick facts">
              <dl className="flex flex-col gap-3 text-sm">
                {current && (
                  <div>
                    <dt className="text-xs text-muted">Works on</dt>
                    <dd className="font-semibold">
                      {current.role}, {current.company}
                    </dd>
                  </div>
                )}
                {a.location && (
                  <div>
                    <dt className="text-xs text-muted">Based in</dt>
                    <dd className="font-semibold">{a.location}</dd>
                  </div>
                )}
                {topics.length > 0 && (
                  <div>
                    <dt className="text-xs text-muted">Writes about</dt>
                    <dd className="font-semibold">{topics.join(", ")}</dd>
                  </div>
                )}
                {posts.length > 0 && (
                  <div>
                    <dt className="text-xs text-muted">On this blog</dt>
                    <dd className="font-semibold">
                      {posts.length} {posts.length === 1 ? "post" : "posts"}, latest {formatDate(posts[0].updated)}
                    </dd>
                  </div>
                )}
              </dl>
            </Card>
            {a.skills.length > 0 && (
              <Card title="Skills">
                <ul className="flex flex-wrap gap-2">
                  {a.skills.map((s) => (
                    <li key={s} className="rounded-full border border-accent/20 bg-accent-soft px-3 py-1 text-xs font-semibold text-accent">
                      {s}
                    </li>
                  ))}
                </ul>
              </Card>
            )}
            {a.learning.length > 0 && (
              <Card title="Courses & certifications">
                <ul className="flex flex-col gap-3">
                  {a.learning.map((l) => (
                    <li key={l.title} className="flex gap-3">
                      <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-signal" aria-hidden />
                      <span>
                        <span className="block text-sm font-semibold leading-snug">
                          {l.url ? (
                            <a href={l.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                              {l.title}
                            </a>
                          ) : (
                            l.title
                          )}
                        </span>
                        <span className="block text-xs text-muted">{[l.place, l.status ?? l.dates].filter(Boolean).join(" · ")}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              </Card>
            )}
            {a.education.length > 0 && (
              <Card title="Education">
                <ul className="flex flex-col gap-3">
                  {a.education.map((e) => (
                    <li key={e.title}>
                      <p className="text-sm font-semibold leading-snug">{e.title}</p>
                      <p className="text-xs text-muted">{[e.place, e.dates].filter(Boolean).join(" · ")}</p>
                    </li>
                  ))}
                </ul>
              </Card>
            )}
          </aside>

          {posts.length > 0 && (
            <section id="posts" className="scroll-mt-24 lg:col-span-2">
              <h2 className="font-display text-2xl font-bold sm:text-3xl">Posts by {first}</h2>
              <ul className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {posts.map((p) => (
                  <li key={p.slug}>
                    <article className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-[0_24px_50px_-40px_rgba(14,60,58,0.55)] transition hover:-translate-y-0.5 hover:border-accent">
                      {p.cover && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.cover} alt="" loading="lazy" width={1200} height={630} className="block aspect-[1200/630] w-full border-b border-line object-cover" />
                      )}
                      <div className="flex flex-1 flex-col p-5">
                        <p className="text-xs font-semibold text-accent">{p.tags[0]}</p>
                        <h3 className="mt-1.5 font-display text-lg font-bold leading-snug group-hover:text-accent">
                          <Link href={`/blog/${p.slug}`} className="after:absolute after:inset-0">
                            {p.title}
                          </Link>
                        </h3>
                        <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted">{p.description}</p>
                        <p className="mt-auto pt-4 text-xs text-muted">
                          <time dateTime={p.date}>{formatDate(p.date)}</time> · {p.readingMinutes} min read
                        </p>
                      </div>
                    </article>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </main>
      </div>

      <SiteFooter />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "ProfilePage",
              url: a.url,
              name: `${a.name} · Riposte`,
              ...(posts[0] ? { dateModified: posts[0].updated } : {}),
              mainEntity: authorSchema(a),
              hasPart: posts.map((p) => ({ "@type": "BlogPosting", headline: p.title, url: `${SITE_URL}/blog/${p.slug}` })),
            },
            {
              "@type": "BreadcrumbList",
              itemListElement: [
                { "@type": "ListItem", position: 1, name: "Blog", item: `${SITE_URL}/blog` },
                { "@type": "ListItem", position: 2, name: "Authors", item: `${SITE_URL}/authors` },
                { "@type": "ListItem", position: 3, name: a.name, item: a.url },
              ],
            },
          ],
        }}
      />
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-line bg-surface p-5">
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted">{title}</h2>
      {children}
    </section>
  );
}

function Experience({ a }: { a: Author }) {
  return (
    <section className="rounded-3xl border border-line bg-surface px-5 py-7 sm:px-10 sm:py-9">
      <h2 className="font-display text-2xl font-bold">Experience</h2>
      <ol className="mt-6 border-l-2 border-dashed border-line">
        {a.experience.map((j, i) => (
          <li key={j.role + j.company} className="relative pb-7 pl-7 last:pb-0">
            <span
              className={`absolute -left-[9px] top-1 h-4 w-4 rounded-full border-[3px] border-surface ${i === 0 ? "bg-signal" : "bg-accent"}`}
              aria-hidden
            />
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
              <h3 className="font-display text-lg font-bold leading-snug">{j.role}</h3>
              {j.dates && <span className="rounded-full bg-bg px-2.5 py-0.5 font-mono text-xs text-muted">{j.dates}</span>}
            </div>
            <p className="text-sm font-semibold text-accent">{j.company}</p>
            {j.summary && <p className="mt-2 leading-relaxed text-muted">{j.summary}</p>}
            {j.points && j.points.length > 0 && (
              <ul className="mt-2.5 flex flex-col gap-1.5">
                {j.points.map((p) => (
                  <li key={p} className="flex gap-2.5 text-[0.95rem] leading-relaxed">
                    <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" aria-hidden />
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ol>
    </section>
  );
}
