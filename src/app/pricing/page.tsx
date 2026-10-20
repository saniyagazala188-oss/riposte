import type { Metadata } from "next";
import Link from "next/link";
import { SITE_URL, organizationSchema } from "@/lib/site";
import { JsonLd, SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { PricingTable } from "@/components/PricingTable";
import { WaitlistForm } from "@/components/WaitlistForm";
import { PLANS, PRICING_FAQS } from "@/lib/pricing";

export const dynamic = "force-static";

const DESC =
  "Riposte is free during the beta. After launch: Starter $19, Pro $49 and Team $99 a month, or 2 months free yearly. Prices in USD and INR, with a 7-day free trial.";

export const metadata: Metadata = {
  title: "Pricing · Riposte",
  description: DESC,
  alternates: { canonical: `${SITE_URL}/pricing` },
  openGraph: { title: "Riposte pricing", description: DESC, url: `${SITE_URL}/pricing`, siteName: "Riposte", type: "website" },
};

export default function PricingPage() {
  return (
    <div className="min-h-dvh">
      <SiteHeader />
      <main className="blog-canvas">
        <section className="mx-auto max-w-6xl px-4 pt-14 pb-6 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">Pricing</p>
          <h1 className="mt-3 font-display text-4xl font-extrabold tracking-tight sm:text-5xl">Simple pricing for small teams</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted">Pay for the number of competitors you track. Every feature explains changes for your product, not just lists them.</p>
          <div className="mx-auto mt-7 max-w-2xl rounded-2xl border border-accent bg-accent-soft px-5 py-4 text-left sm:text-center">
            <p className="font-semibold">🎉 Riposte is free during the beta.</p>
            <p className="mt-1 text-sm text-muted">
              These are the prices after launch. Beta users get a lower founding-member price, and 30 days&apos; notice before any pricing starts.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-16" aria-label="Plans">
          <PricingTable />
        </section>

        <section className="mx-auto max-w-3xl px-4 pb-16" aria-labelledby="faq">
          <h2 id="faq" className="text-center font-display text-3xl font-bold">
            Questions about pricing
          </h2>
          <div className="mt-8 flex flex-col gap-3">
            {PRICING_FAQS.map((f) => (
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
          <p className="mt-6 text-center text-sm text-muted">
            Want to know exactly what each feature does? See the{" "}
            <Link href="/docs" className="font-medium text-accent hover:underline">
              docs
            </Link>
            .
          </p>
        </section>

        <section id="join" className="bg-accent-soft scroll-mt-20">
          <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-4 py-14 text-center">
            <h2 className="font-display text-3xl font-bold">Try every feature free during the beta</h2>
            <p className="max-w-xl text-muted">Join the waitlist. I let people in a few at a time, and you&apos;ll get an email when you&apos;re in.</p>
            <WaitlistForm id="pricing-email" />
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
              "@type": "SoftwareApplication",
              name: "Riposte",
              url: SITE_URL,
              applicationCategory: "BusinessApplication",
              operatingSystem: "Web",
              offers: PLANS.map((p) => ({
                "@type": "Offer",
                name: p.name,
                price: p.price.usd.monthly.replace("$", ""),
                priceCurrency: "USD",
                description: `${p.features[0]}. Billed monthly after the beta.`,
              })),
            },
            {
              "@type": "FAQPage",
              mainEntity: PRICING_FAQS.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
            },
          ],
        }}
      />
    </div>
  );
}
