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

function DocCard({ d }: { d: Doc }) {
  const facts = [
    d.file_type === "pdf" ? "PDF" : "Word",
    d.pages ? `${d.pages} ${d.pages === 1 ? "page" : "pages"}` : null,
    `${d.words.toLocaleString("en")} words`,
    d.method === "ocr" ? "read by Google's AI (scanned)" : "read directly",
  ].filter(Boolean);
  return (
    <li className="rounded-xl border border-line bg-surface p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="break-words font-semibold">{d.file_name}</p>
          <p className="text-xs text-muted">{facts.join(" · ")}</p>
        </div>
        <span
          className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
            d.status === "ready" ? "bg-accent-soft text-accent" : "bg-signal-soft text-signal"
          }`}
        >
          {d.status === "ready" ? "Looks good" : "Check this"}
        </span>
      </div>
      {d.warning && <p className="mt-3 rounded-lg bg-signal-soft px-3 py-2 text-sm text-ink">{d.warning}</p>}
      {d.summary && (
        <div className="mt-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">What Riposte understood{d.doc_kind ? ` · ${d.doc_kind}` : ""}</p>
          <p className="mt-1 text-sm">{d.summary}</p>
        </div>
      )}
      {d.key_points && d.key_points.length > 0 && (
        <details className="mt-2 text-sm">
          <summary className="cursor-pointer font-semibold text-accent">Key points ({d.key_points.length})</summary>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {d.key_points.map((k) => (
              <li key={k}>{k}</li>
            ))}
          </ul>
        </details>
      )}
      {d.excerpt && (
        <div className="mt-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">First lines, to compare with your file</p>
          <p className="mt-1 text-sm italic text-muted">&ldquo;{d.excerpt}&rdquo;</p>
        </div>
      )}
      <form action={deleteKnowledgeFile} className="mt-3">
        <input type="hidden" name="id" value={d.id} />
        <button type="submit" className="text-sm font-semibold text-danger hover:underline">
          Delete
        </button>
      </form>
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
      <div className="mt-5 grid items-start gap-5 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <section className={`${card} p-5 sm:p-6`}>
          <ProductForm
            product_name={profile?.product_name ?? ""}
            product_pitch={profile?.product_pitch ?? ""}
            ideal_customer={profile?.ideal_customer ?? ""}
            differentiators={profile?.differentiators ?? ""}
          />
        </section>
        <section className={`${card} p-5 sm:p-6 lg:col-start-1`}>
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="font-display text-lg font-bold">Knowledge base</h2>
            <span className="text-sm text-muted">
              {docs.length} of {limit} files
            </span>
          </div>
          <p className="mt-1 text-sm text-muted">
            Upload what you already have about your product: one-pagers, product pages, positioning docs, case studies, past blog posts.
            Every signal, brief and comparison is then judged against your own content, not just the four fields above.
          </p>
          <div className="mt-4">
            <KnowledgeUpload userId={user.id} direct={mockEnabled()} full={docs.length >= limit} />
          </div>
          {docs.length > 0 ? (
            <ul className="mt-4 flex flex-col gap-3">
              {docs.map((d) => (
                <DocCard key={d.id} d={d} />
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-muted">No files yet. After each upload you&apos;ll see what Riposte read, so you can check it worked.</p>
          )}
        </section>
        <aside className="flex flex-col gap-4 lg:col-start-2 lg:row-span-2 lg:row-start-1">
          <section className={`${card} p-5`}>
            <div className="flex items-baseline justify-between">
              <h2 className="font-display text-lg font-bold">Profile</h2>
              <span className={`text-sm font-semibold ${filled === 4 ? "text-accent" : "text-signal"}`}>{filled} of 4 filled</span>
            </div>
            <div className="mt-2 h-2 rounded-full bg-bg" aria-hidden>
              <div className="h-2 rounded-full bg-accent" style={{ width: `${(filled / 4) * 100}%` }} />
            </div>
          </section>
          <section className={`${card} p-5`}>
            <h2 className="font-display text-lg font-bold">Where Riposte uses this</h2>
            <ul className="mt-3 flex flex-col gap-3 text-sm">
              {USES.map((u) => (
                <li key={u.title}>
                  <p className="font-semibold">{u.title}</p>
                  <p className="text-muted">{u.body}</p>
                </li>
              ))}
            </ul>
          </section>
        </aside>
      </div>
    </div>
  );
}
