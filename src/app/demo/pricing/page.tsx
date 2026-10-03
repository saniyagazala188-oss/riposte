// A fictional competitor's pricing page, for testing Riposte end to end.
// Its content switches between two versions every 10 minutes, so "Check now"
// a little later produces a real change for the AI to explain.

export const dynamic = "force-dynamic";
export const metadata = { title: "Acme Insights pricing (demo)", robots: { index: false, follow: false } };

const VERSIONS = [
  {
    plans: [
      { name: "Starter", price: "$19 per month", features: ["Track 3 competitors", "Weekly email summary", "Pricing page monitoring"] },
      { name: "Pro", price: "$49 per month", features: ["Track 10 competitors", "Daily alerts", "Blog and changelog monitoring", "Slack integration"] },
      { name: "Team", price: "$99 per month", features: ["Track 25 competitors", "Up to 5 seats", "Shared battlecards", "Priority support"] },
    ],
    note: "All plans include a 14-day free trial. No credit card required.",
  },
  {
    plans: [
      { name: "Starter", price: "$19 per month", features: ["Track 3 competitors", "Weekly email summary", "Pricing page monitoring"] },
      { name: "Pro", price: "$59 per month", features: ["Track 10 competitors", "Daily alerts", "Blog and changelog monitoring", "Slack integration", "New: AI-written battlecards included"] },
      { name: "Team", price: "$99 per month", features: ["Track 25 competitors", "Up to 5 seats", "Shared battlecards", "Priority support"] },
      { name: "Enterprise", price: "Contact sales", features: ["Unlimited competitors", "SSO and audit logs", "Dedicated analyst"] },
    ],
    note: "All plans include a 7-day free trial.",
  },
];

export default function DemoPricing() {
  const version = VERSIONS[Math.floor(Date.now() / (10 * 60 * 1000)) % 2];
  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <p className="rounded-lg border border-line bg-signal-soft px-4 py-2 text-sm">
        Demo page for testing Riposte. Acme Insights is a fictional company.
      </p>
      <h1 className="mt-6 font-display text-3xl font-bold">Acme Insights pricing</h1>
      <p className="mt-2 text-muted">Competitive intelligence for growing marketing teams. Pick the plan that fits your team.</p>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {version.plans.map((p) => (
          <section key={p.name} className="rounded-2xl border border-line bg-surface p-5">
            <h2 className="text-xl font-bold">{p.name}</h2>
            <p className="mt-1 text-lg">{p.price}</p>
            <ul className="mt-3 list-disc pl-5 text-sm">
              {p.features.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
          </section>
        ))}
      </div>
      <p className="mt-6 text-sm text-muted">{version.note}</p>
    </main>
  );
}
