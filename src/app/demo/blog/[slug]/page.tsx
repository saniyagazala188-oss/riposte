import { notFound } from "next/navigation";
import { demoArticle, demoVersion } from "../../version";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const a = demoArticle(slug, demoVersion());
  return a
    ? { title: a.title, description: a.description, robots: { index: false, follow: false } }
    : { title: "Not found" };
}

// A fictional Acme Insights blog post (demo only).
export default async function DemoArticle({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const a = demoArticle(slug, demoVersion());
  if (!a) notFound();
  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <p className="rounded-lg border border-line bg-signal-soft px-4 py-2 text-sm">
        Demo page for testing Riposte. Acme Insights is a fictional company.
      </p>
      <h1 className="mt-6 font-display text-3xl font-bold">{a.title}</h1>
      <p className="mt-2 text-muted">{a.description}</p>
      {a.sections.map((s) => (
        <section key={s} className="mt-6">
          <h2 className="text-xl font-bold">{s}</h2>
          <p className="mt-2">Sample text for this section of the demo article.</p>
        </section>
      ))}
    </main>
  );
}
