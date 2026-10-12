import { requireUser } from "@/lib/auth";
import { card } from "@/components/styles";
import { PageHeader } from "@/components/ui";
import { ProductForm } from "./ProductForm";
import { KnowledgeUpload } from "./KnowledgeUpload";
import { deleteKnowledgeFile } from "./knowledge-actions";
import { limitsFor } from "@/lib/access";
import { mockEnabled } from "@/lib/supabase/mock";

export const maxDuration = 90;

type Doc = {
  id: string;
  created_at: string;
  file_name: string;
  file_type: "pdf" | "docx";
  pages: number | null;
  words: number;
  method: "text" | "ocr";
  status: "ready" | "warning";
  warning: string | null;
  doc_kind: string | null;
  summary: string | null;
  key_points: string[] | null;
  excerpt: string | null;
};

export const metadata = { title: "Your product · Riposte" };

const USES = [
  { title: "Signals", body: "Every competitor change is judged against who you sell to: the same price rise can be noise or a threat." },
  { title: "Action kits", body: "Battlecards, talk tracks and posts pivot to what makes you different, not generic lines." },
  { title: "Prompt Studio", body: "Buyer prompts match your category, buyers and the niches you want to win." },
  { title: "Comparisons", body: "Your side of each comparison page comes only from here; anything missing becomes a [placeholder]." },
  { title: "Knowledge base", body: "Your uploaded files add detail to all of the above, and stop content briefs from suggesting topics you already cover." },
];

function DocRow({ d }: { d: Doc }) {
  const facts = [
    d.file_type === "pdf" ? "PDF" : "Word",
    d.pages ? `${d.pages} ${d.pages === 1 ? "page" : "pages"}` : null,
    `${d.words.toLocaleString("en")} words`,
  ].filter(Boolean);
  const ok = d.status === "ready";
  return (
    <li className="rounded-xl border border-line bg-surface">
      <details className="group">
        <summary className="flex cursor-pointer list-none items-center gap-3 px-3 py-2.5 [&::-webkit-details-marker]:hidden">
          <span
            aria-hidden
            className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-bg text-[10px] font-bold uppercase tracking-wide text-muted"
          >
            {d.file_type === "pdf" ? "PDF" : "DOC"}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold">{d.file_name}</span>
            <span className="block truncate text-xs text-muted">{facts.join(" · ")}</span>
          </span>
          <span
            className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${ok ? "bg-accent-soft text-accent" : "bg-signal-soft text-signal"}`}
          >
            {ok ? "Looks good" : "Check this"}
          </span>
          <svg aria-hidden viewBox="0 0 20 20" className="h-4 w-4 shrink-0 text-muted transition-transform group-open:rotate-180">
            <path d="M5 7.5l5 5 5-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </summary>
        <div className="flex flex-col gap-3 border-t border-line px-3 pb-3 pt-3 text-sm">
          {d.warning && <p className="rounded-lg bg-signal-soft px-3 py-2">{d.warning}</p>}
          {d.summary && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                What Riposte understood{d.doc_kind ? ` · ${d.doc_kind}` : ""}
              </p>
              <p className="mt-1">{d.summary}</p>
            </div>
          )}
          {d.key_points && d.key_points.length > 0 && (
            <ul className="list-disc space-y-1 pl-5">
              {d.key_points.map((k) => (
                <li key={k}>{k}</li>
              ))}
            </ul>
          )}
          {d.excerpt && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                First lines · {d.method === "ocr" ? "read by Google's AI" : "read directly"}
              </p>
              <p className="mt-1 italic text-muted">&ldquo;{d.excerpt}&rdquo;</p>
            </div>
          )}
          <form action={deleteKnowledgeFile}>
            <input type="hidden" name="id" value={d.id} />
            <button type="submit" className="text-sm font-semibold text-danger hover:underline">
              Delete file
            </button>
          </form>
        </div>
      </details>
    </li>
  );
}

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
  const docs = (docRows ?? []) as Doc[];
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
                    <DocRow key={d.id} d={d} />
                  ))}
                </ul>
                <p className="mt-2 text-xs text-muted">Open a file to see what Riposte read from it.</p>
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
