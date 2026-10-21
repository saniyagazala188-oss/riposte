import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { AUTHOR, SITE_URL, organizationSchema, personSchema } from "@/lib/site";
import { JsonLd, SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { WaitlistForm } from "@/components/WaitlistForm";
import { TourButton } from "@/components/TourButton";
import { CONTACT_EMAIL } from "@/components/LegalPage";
import { ALTERNATIVES, CHECKED, CHECKED_LABEL, HOW_TO_CHOOSE, TOOLS, getAlt } from "@/lib/alternatives";

export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return ALTERNATIVES.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const alt = getAlt((await params).slug);
  if (!alt) return {};
  const url = `${SITE_URL}/alternatives/${alt.slug}`;
  return {
    title: alt.title,
    description: alt.description,
    alternates: { canonical: url },
    openGraph: { title: alt.title, description: alt.description, url, siteName: "Riposte", type: "article", images: [{ url: alt.img.src }] },
  };
}

function Band({ text }: { text: string }) {
  return (
    <section className="mx-auto max-w-6xl px-4">
      <div className="flex flex-col items-start gap-4 rounded-2xl bg-accent px-6 py-6 text-accent-ink sm:flex-row sm:items-center sm:justify-between">
        <p className="font-display text-xl font-bold">{text}</p>
        <a href="#join" className="rounded-lg bg-surface px-4 py-2.5 font-semibold text-accent hover:opacity-90">
          Join the free beta
        </a>
      </div>
    </section>
  );
}

const h2 = "font-display text-3xl font-bold";

export default async function AlternativePage({ params }: { params: Promise<{ slug: string }> }) {
  const alt = getAlt((await params).slug);
  if (!alt) notFound();
  const url = `${SITE_URL}/alternatives/${alt.slug}`;

  return (
    <div className="blog-canvas min-h-dvh">
      <SiteHeader />
      <main>
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mx-auto max-w-6xl px-4 pt-6 text-sm text-muted">
          <Link href="/alternatives" className="hover:text-ink">
            Compare
          </Link>{" "}
          / <span className="text-ink">{alt.name} alternatives</span>
        </nav>

        {/* 1. Hero: the answer on the left, the product on the right */}
        <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 pt-6 pb-14 lg:grid-cols-[1.05fr_1fr] lg:pt-10">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-widest text-accent">{alt.name} alternatives</p>
            <h1 className="mt-3 font-display text-4xl leading-[1.05] font-extrabold tracking-tight sm:text-5xl">{alt.h1}</h1>
            <div className="mt-5 rounded-xl border-l-4 border-accent bg-accent-soft px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-widest text-accent">Short answer</p>
              <p className="mt-1 text-lg">{alt.shortAnswer}</p>
            </div>
            <div className="mt-6">
              <WaitlistForm id="hero-email" />
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
              <TourButton />
              <span className="text-muted">Free during the beta · no sales call</span>
            </div>
            <p className="mt-5 text-xs text-muted">
              By{" "}
              <Link href={`/authors/${AUTHOR.slug}`} className="font-semibold hover:underline">
                {AUTHOR.name}
              </Link>
              , who builds Riposte · Facts last checked {CHECKED_LABEL} on each company&apos;s own website
            </p>
          </div>
          <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-sm">
            <Image src={alt.img.src} alt={alt.img.alt} width={1500} height={780} priority className="h-auto w-full" />
          </div>
        </section>

        {/* 2. What the tool is, fairly */}
        <section className="mx-auto max-w-3xl px-4 pb-12" aria-labelledby="about">
          <h2 id="about" className={h2}>
            What is {alt.name}?
          </h2>
          <p className="mt-4 text-lg text-muted">{alt.about}</p>
        </section>

        {/* 3. Why teams look elsewhere */}
        <section className="mx-auto max-w-6xl px-4 pb-12" aria-labelledby="why">
          <h2 id="why" className={h2}>
            Why small teams look for {alt.name} alternatives
          </h2>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {alt.why.map(([t, b]) => (
              <div key={t} className="rounded-2xl border border-line bg-surface p-5">
                <h3 className="font-display text-lg font-bold">{t}</h3>
                <p className="mt-1.5 text-muted">{b}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 4. The comparison */}
        <section className="mx-auto max-w-6xl px-4 pb-12" aria-labelledby="compare">
          <h2 id="compare" className={h2}>
            {alt.name} vs Riposte at a glance
          </h2>
          <p className="mt-2 text-muted">From each company&apos;s own website, checked {CHECKED_LABEL}.</p>
          <div className="mt-6 overflow-x-auto rounded-2xl border border-line bg-surface">
            <table className="w-full min-w-[620px] text-left text-sm">
              <thead>
                <tr className="border-b border-line text-xs uppercase tracking-wider text-muted">
                  <th className="w-1/4 px-4 py-3" />
                  <th scope="col" className="px-4 py-3">
                    {alt.name}
                  </th>
                  <th scope="col" className="bg-accent-soft px-4 py-3 text-accent">
                    Riposte
                  </th>
                </tr>
              </thead>
              <tbody>
                {alt.table.map(([label, theirs, ours]) => (
                  <tr key={label} className="border-b border-line transition-colors last:border-0 hover:bg-signal-soft">
                    <th scope="row" className="px-4 py-3 font-semibold">
                      {label}
                    </th>
                    <td className="px-4 py-3">{theirs}</td>
                    <td className="bg-accent-soft/70 px-4 py-3 font-semibold">{ours}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-right">
            <Link href="/competitor-tracking-tool" className="font-semibold text-accent hover:underline">
              Why choose Riposte? See how it works →
            </Link>
          </p>
        </section>

        <Band text="See it on your own competitors. It takes 5 minutes." />

        {/* 5. Where Riposte fits, and where it doesn't */}
        <section className="mx-auto grid max-w-6xl gap-4 px-4 py-16 md:grid-cols-2" aria-labelledby="fit">
          <h2 id="fit" className={`${h2} md:col-span-2`}>
            Is Riposte the right {alt.name} alternative for you?
          </h2>
          <div className="rounded-2xl border border-line bg-surface p-5">
            <h3 className="font-display text-lg font-bold">Choose Riposte if</h3>
            <ul className="mt-3 flex flex-col gap-2">
              {alt.fits.map((f) => (
                <li key={f} className="flex gap-2.5">
                  <span className="text-accent" aria-hidden>
                    ✓
                  </span>
                  {f}
                </li>
              ))}
            </ul>
            <a href="#join" className="mt-4 inline-block font-semibold text-accent hover:underline">
              Try it free →
            </a>
          </div>
          <div className="rounded-2xl border border-line bg-surface p-5">
            <h3 className="font-display text-lg font-bold">Stay with {alt.name} if</h3>
            <ul className="mt-3 flex flex-col gap-2">
              {alt.notFit.map((f) => (
                <li key={f} className="flex gap-2.5">
                  <span className="text-muted" aria-hidden>
                    →
                  </span>
                  {f}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* 6. Every option, in short */}
        <section className="mx-auto max-w-6xl px-4 pb-12" aria-labelledby="options">
          <h2 id="options" className={h2}>
            The {alt.name} alternatives, in short
          </h2>
          <ol className="mt-6 flex flex-col gap-4">
            {alt.others.map((k, i) => {
              const t = TOOLS[k];
              const external = t.href.startsWith("http");
              return (
                <li key={k} className={`rounded-2xl border bg-surface p-5 ${k === "riposte" ? "border-accent" : "border-line"}`}>
                  <h3 className="font-display text-xl font-bold">
                    {i + 1}. {t.name}
                    {k === "riposte" && <span className="ml-2 rounded-full bg-accent-soft px-2.5 py-0.5 align-middle text-xs font-semibold text-accent">Ours</span>}
                  </h3>
                  <p className="mt-1.5 text-muted">{t.what}</p>
                  <p className="mt-2">
                    <span className="font-semibold">Pick it if</span> {t.pick}
                  </p>
                  {k === "riposte" ? (
                    <a href="#join" className="mt-3 inline-block font-semibold text-accent hover:underline">
                      Join the free beta →
                    </a>
                  ) : external ? null : (
                    <Link href={t.href} className="mt-3 inline-block text-sm font-semibold text-accent hover:underline">
                      {t.name} alternatives →
                    </Link>
                  )}
                </li>
              );
            })}
          </ol>
        </section>

        {/* 7. How to choose */}
        <section className="mx-auto max-w-6xl px-4 pb-16" aria-labelledby="choose">
          <h2 id="choose" className={h2}>
            How to choose
          </h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {HOW_TO_CHOOSE.map(([q, a]) => (
              <div key={q} className="rounded-2xl border border-line bg-surface p-5">
                <h3 className="font-display text-lg font-bold">{q}</h3>
                <p className="mt-1.5 text-muted">{a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 8. Questions (FAQ schema below) */}
        <section className="mx-auto max-w-3xl px-4 pb-16" aria-labelledby="faq">
          <h2 id="faq" className={h2}>
            Questions about {alt.name} alternatives
          </h2>
          <div className="mt-6 flex flex-col gap-3">
            {alt.faqs.map((f) => (
              <details key={f.q} className="group rounded-2xl border border-line bg-surface px-5 py-4">
                <summary className="cursor-pointer list-none font-semibold marker:hidden">
                  <h3 className="inline">{f.q}</h3>
                  <span className="float-right text-accent transition group-open:rotate-45" aria-hidden>
                    +
                  </span>
                </summary>
                <p className="mt-3 text-muted">{f.a}</p>
              </details>
            ))}
          </div>
          <div className="mt-8 text-sm text-muted">
            <p className="font-semibold text-ink">Sources</p>
            <ul className="mt-2 flex flex-col gap-1">
              {alt.sources.map(([label, href]) => (
                <li key={href}>
                  <a href={href} rel="nofollow noopener" target="_blank" className="hover:text-ink hover:underline">
                    {label}
                  </a>
                </li>
              ))}
            </ul>
            <p className="mt-3">
              Product names belong to their owners. Spotted something out of date?{" "}
              <a href={`mailto:${CONTACT_EMAIL}`} className="font-semibold text-accent hover:underline">
                Tell me
              </a>{" "}
              and I&apos;ll fix it.
            </p>
          </div>
        </section>

        {/* 9. Final call to action */}
        <section id="join" className="scroll-mt-20 bg-accent-soft">
          <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-4 py-14 text-center">
            <h2 className="font-display text-3xl font-bold">Every competitor move deserves a sharp reply.</h2>
            <p className="max-w-xl text-muted">Join the free beta. I let people in a few at a time, and you&apos;ll get an email when you&apos;re in.</p>
            <WaitlistForm id="join-email" />
            <TourButton />
          </div>
        </section>
      </main>
      <SiteFooter />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            { ...organizationSchema, "@id": `${SITE_URL}/#org` },
            {
              "@type": "WebPage",
              "@id": `${url}#page`,
              url,
              name: alt.title,
              description: alt.description,
              dateModified: CHECKED,
              author: personSchema,
              breadcrumb: {
                "@type": "BreadcrumbList",
                itemListElement: [
                  { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
                  { "@type": "ListItem", position: 2, name: "Compare", item: `${SITE_URL}/alternatives` },
                  { "@type": "ListItem", position: 3, name: `${alt.name} alternatives`, item: url },
                ],
              },
            },
            {
              "@type": "ItemList",
              name: `${alt.name} alternatives`,
              itemListElement: alt.others.map((k, i) => ({ "@type": "ListItem", position: i + 1, name: TOOLS[k].name })),
            },
            {
              "@type": "FAQPage",
              mainEntity: alt.faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
            },
          ],
        }}
      />
    </div>
  );
}
