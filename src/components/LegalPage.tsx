import { SiteFooter, SiteHeader } from "@/components/SiteChrome";

export const CONTACT_EMAIL = "saniyagazala188@gmail.com";
export const LEGAL_UPDATED = "16 October 2026";

export type LegalSection = { heading: string; body: React.ReactNode };

export function LegalPage({ kicker, title, intro, sections }: { kicker: string; title: string; intro: React.ReactNode; sections: LegalSection[] }) {
  return (
    <div className="min-h-dvh">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 pt-8 pb-16">
        <p className="text-xs font-semibold uppercase tracking-widest text-accent">{kicker}</p>
        <h1 className="mt-1 font-display text-4xl font-extrabold tracking-tight">{title}</h1>
        <p className="mt-2 text-sm text-muted">Last updated {LEGAL_UPDATED}</p>
        <div className="prose-riposte mt-6">
          <p>{intro}</p>
          {sections.map((s) => (
            <section key={s.heading}>
              <h2>{s.heading}</h2>
              {s.body}
            </section>
          ))}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
