import { requireUser } from "@/lib/auth";
import { card } from "@/components/styles";
import { PageHeader } from "@/components/ui";
import { ProductForm } from "./ProductForm";
import { KnowledgeUpload } from "./KnowledgeUpload";
import { KnowledgeDocRow, type KnowledgeDoc } from "./KnowledgeDocRow";
import { limitsFor } from "@/lib/access";
import { mockEnabled } from "@/lib/supabase/mock";

export const maxDuration = 90;


export const metadata = { title: "Your product · Riposte" };

const USES = [
  { title: "Signals", body: "Every competitor change is judged against your product and buyers: the same price rise can be noise or a threat." },
  { title: "Action kits", body: "Battlecards, talk tracks and posts lead with what makes you different, not generic lines." },
  { title: "Content intel", body: "Briefs use your angle, and build on topics you already cover instead of repeating them." },
  { title: "Comparisons", body: "Your side of each comparison page comes only from your profile and files; anything missing becomes a [placeholder]." },
  { title: "Prompt Studio", body: "Buyer prompts match your category, buyers and the niches you want to win." },
  { title: "AI visibility", body: "\"Why they're winning\" compares what AI says about competitors with what you claim." },
  { title: "Knowledge base", body: "Your uploaded files add detail to all of the above." },
];

export default async function ProductPage() {
  const { supabase, user } = await requireUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("product_name, product_pitch, ideal_customer, differentiators")
    .eq("id", user.id)
    .maybeSingle();
  const { data: docRows } = await supabase
    .from("knowledge_docs")
    .select("id, created_at, file_name, file_type, pages, words, method, status, warning, doc_kind, summary, key_points, excerpt")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
  const docs = (docRows ?? []) as KnowledgeDoc[];
  const limit = limitsFor(user.email).knowledgeFiles;
  const filled = [profile?.product_name, profile?.product_pitch, profile?.ideal_customer, profile?.differentiators].filter(Boolean).length;

  return (
    <div>
      <PageHeader
        kicker="Your product"
        title="Tell Riposte what you sell"
        description="Every signal, draft and comparison is written for your product. The more specific this is, the sharper the advice."
      />
      <div className="mt-5 grid grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <section className={`${card} p-5 sm:p-6`}>
          <ProductForm
            product_name={profile?.product_name ?? ""}
            product_pitch={profile?.product_pitch ?? ""}
            ideal_customer={profile?.ideal_customer ?? ""}
            differentiators={profile?.differentiators ?? ""}
          />
        </section>
        <aside className="flex min-w-0 flex-col gap-4">
          <section className={`${card} p-5`}>
            <div className="flex items-baseline justify-between gap-2">
              <h2 className="font-display text-lg font-bold">Knowledge base</h2>
              <span className="text-sm text-muted">
                {docs.length} of {limit} files
              </span>
            </div>
            <p className="mt-1 text-sm text-muted">
              Add one-pagers, positioning docs, case studies or past posts. Riposte judges every change against your own content too.
            </p>
            <div className="mt-3">
              <KnowledgeUpload userId={user.id} direct={mockEnabled()} full={docs.length >= limit} />
            </div>
            {docs.length > 0 ? (
              <>
                <ul className="mt-3 flex max-h-[26rem] flex-col gap-2 overflow-y-auto pr-0.5">
                  {docs.map((d) => (
                    <KnowledgeDocRow key={d.id} d={d} />
                  ))}
                </ul>
                <p className="mt-2 text-xs text-muted">Click a file to see what Riposte read from it.</p>
              </>
            ) : (
              <p className="mt-3 text-sm text-muted">No files yet. After each upload you&apos;ll see what Riposte read, so you can check it worked.</p>
            )}
          </section>
          <section className={`${card} p-5`}>
            <div className="flex items-baseline justify-between">
              <h2 className="font-display text-lg font-bold">Profile</h2>
              <span className={`text-sm font-semibold ${filled === 4 ? "text-accent" : "text-signal"}`}>{filled} of 4 filled</span>
            </div>
            <div className="mt-2 h-2 rounded-full bg-bg" aria-hidden>
              <div className="h-2 rounded-full bg-accent" style={{ width: `${(filled / 4) * 100}%` }} />
            </div>
            <details className="group mt-3">
              <summary className="cursor-pointer list-none text-sm font-semibold text-accent [&::-webkit-details-marker]:hidden">
                Where Riposte uses this <span className="inline-block transition-transform group-open:rotate-90">›</span>
              </summary>
              <ul className="mt-3 flex flex-col gap-3 text-sm">
                {USES.map((u) => (
                  <li key={u.title}>
                    <p className="font-semibold">{u.title}</p>
                    <p className="text-muted">{u.body}</p>
                  </li>
                ))}
              </ul>
            </details>
          </section>
        </aside>
      </div>
    </div>
  );
}
