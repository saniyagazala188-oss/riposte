import Link from "next/link";
import type { Metadata } from "next";
import { allPosts } from "@/lib/blog";
import { AUTHOR, SITE_URL, personSchema } from "@/lib/site";
import { JsonLd, SiteFooter, SiteHeader } from "@/components/SiteChrome";

export const metadata: Metadata = {
  title: "About Saniya Gazala, founder of Riposte",
  description: "Saniya Gazala is a product marketer from Bengaluru who builds. She founded Riposte to help marketers respond to competitor moves, not just watch them.",
  alternates: { canonical: `${SITE_URL}/about` },
  openGraph: { type: "profile", title: "Saniya Gazala, founder of Riposte", url: `${SITE_URL}/about` },
};

const EXPERIENCE = [
  { role: "Product Marketing Manager, KaneAI", org: "TestMu AI (LambdaTest)", when: "2025 – 2026" },
  { role: "Technical Content Writer", org: "TestMu AI (LambdaTest)", when: "2023 – 2025" },
  { role: "Web Solutions Manager", org: "Interstellar Consulting", when: "2021 – 2023" },
  { role: "Associate Software Engineer", org: "Swayaan Digital Solutions", when: "2020 – 2021" },
];

export default function AboutPage() {
  const posts = allPosts().slice(0, 3);
  return (
    <div className="min-h-dvh">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 pt-8 pb-16">
        <div className="flex flex-wrap items-center gap-5">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-accent font-display text-2xl font-bold text-accent-ink">
            SG
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-accent">About</p>
            <h1 className="mt-1 font-display text-4xl font-extrabold tracking-tight">{AUTHOR.name}</h1>
            <p className="mt-1 text-muted">
              {AUTHOR.role} · {AUTHOR.location}
            </p>
          </div>
        </div>

        <div className="prose-riposte mt-8">
          <p>
            I&apos;m a product marketer who builds. For three years I worked at TestMu AI (LambdaTest), first writing technical content
            and then as the product marketing manager for KaneAI, an AI-native testing product. My work covered positioning,
            comparison pages, SEO, AEO (getting content cited in AI answers), newsletters and sales enablement.
          </p>
          <p>
            Every Monday, two to three hours of that went into competitor research by hand. Riposte is the tool I wished I had: it
            watches competitors every day, explains each change for your product, and drafts your response.
          </p>
          <p>
            Before marketing, I worked on the technical side: building websites and CRM features, writing functional specs and doing
            manual testing. I studied Computer Science Engineering at Reva University in Bengaluru, and I&apos;ve completed
            Profound&apos;s Marketing Engineering course.
          </p>
        </div>

        <h2 className="mt-10 font-display text-xl font-bold">Experience</h2>
        <ul className="mt-3 divide-y divide-line rounded-2xl border border-line bg-surface">
          {EXPERIENCE.map((e) => (
            <li key={e.role} className="flex flex-wrap items-baseline justify-between gap-2 px-5 py-3">
              <span>
                <span className="font-semibold">{e.role}</span>
                <span className="text-muted"> · {e.org}</span>
              </span>
              <span className="font-mono text-sm text-muted">{e.when}</span>
            </li>
          ))}
        </ul>

        <h2 className="mt-10 font-display text-xl font-bold">Writing</h2>
        <ul className="mt-3 flex flex-col gap-2">
          {posts.map((p) => (
            <li key={p.slug}>
              <Link href={`/blog/${p.slug}`} className="text-accent hover:underline">
                {p.title}
              </Link>
            </li>
          ))}
        </ul>

        <div className="mt-10 flex flex-wrap gap-3">
          <a href={AUTHOR.linkedin} target="_blank" rel="noopener noreferrer" className="rounded-lg bg-accent px-4 py-2.5 font-semibold text-accent-ink hover:brightness-110">
            Connect on LinkedIn
          </a>
          <Link href="/changelog" className="rounded-lg border border-line px-4 py-2.5 font-semibold hover:border-muted">
            See how Riposte was built
          </Link>
        </div>
      </main>
      <SiteFooter />
      <JsonLd data={{ "@context": "https://schema.org", "@type": "ProfilePage", mainEntity: { ...personSchema, description: AUTHOR.short } }} />
    </div>
  );
}
