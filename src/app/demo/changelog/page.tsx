import { demoChangelog, demoVersion } from "../version";

export const dynamic = "force-dynamic";
export const metadata = { title: "Acme Insights changelog (demo)", robots: { index: false, follow: false } };

export default function DemoChangelog() {
  const entries = demoChangelog(demoVersion());
  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <p className="rounded-lg border border-line bg-signal-soft px-4 py-2 text-sm">
        Demo page for testing Riposte. Acme Insights is a fictional company.
      </p>
      <h1 className="mt-6 font-display text-3xl font-bold">Acme Insights changelog</h1>
      <p className="mt-2 text-muted">New features and improvements to Acme Insights, newest first.</p>
      <ol className="mt-6 flex flex-col gap-4">
        {entries.map((e) => (
          <li key={e.title} className="rounded-2xl border border-line bg-surface p-5">
            <h2 className="text-lg font-bold">{e.title}</h2>
            <p className="mt-1 text-sm text-muted">Released {e.date}</p>
            <p className="mt-2">{e.body}</p>
          </li>
        ))}
      </ol>
    </main>
  );
}
