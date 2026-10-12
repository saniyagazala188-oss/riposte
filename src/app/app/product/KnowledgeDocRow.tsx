"use client";

import { useRef } from "react";
import { deleteKnowledgeFile } from "./knowledge-actions";

export type KnowledgeDoc = {
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

// One compact row per file. Clicking it opens a pop-up with what Riposte read, so the
// page layout never changes.
export function KnowledgeDocRow({ d }: { d: KnowledgeDoc }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const facts = [
    d.file_type === "pdf" ? "PDF" : "Word",
    d.pages ? `${d.pages} ${d.pages === 1 ? "page" : "pages"}` : null,
    `${d.words.toLocaleString("en")} words`,
  ].filter(Boolean);
  const ok = d.status === "ready";
  const badge = (
    <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${ok ? "bg-accent-soft text-accent" : "bg-signal-soft text-signal"}`}>
      {ok ? "Looks good" : "Check this"}
    </span>
  );

  return (
    <li>
      <button
        type="button"
        onClick={() => dialog.current?.showModal()}
        className="flex w-full items-center gap-3 rounded-xl border border-line bg-surface px-3 py-2.5 text-left hover:border-accent"
      >
        <span aria-hidden className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-bg text-[10px] font-bold uppercase tracking-wide text-muted">
          {d.file_type === "pdf" ? "PDF" : "DOC"}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold">{d.file_name}</span>
          <span className="block truncate text-xs text-muted">{facts.join(" · ")}</span>
        </span>
        {badge}
        <svg aria-hidden viewBox="0 0 20 20" className="h-4 w-4 shrink-0 text-muted">
          <path d="M7.5 5l5 5-5 5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      <dialog
        ref={dialog}
        onClick={(e) => e.target === dialog.current && dialog.current?.close()}
        className="m-auto w-[min(36rem,calc(100vw-2rem))] rounded-2xl border border-line bg-surface p-0 text-ink shadow-xl backdrop:bg-black/40"
      >
        <div className="flex max-h-[85vh] flex-col">
          <div className="flex items-start gap-3 border-b border-line px-5 py-4">
            <div className="min-w-0 flex-1">
              <p className="break-words font-display text-lg font-bold">{d.file_name}</p>
              <p className="text-xs text-muted">
                {facts.join(" · ")} · {d.method === "ocr" ? "read by Google's AI (scanned)" : "read directly"}
              </p>
            </div>
            {badge}
            <button
              type="button"
              onClick={() => dialog.current?.close()}
              aria-label="Close"
              className="-mr-1 grid h-8 w-8 shrink-0 place-items-center rounded-lg text-muted hover:bg-bg hover:text-ink"
            >
              <svg aria-hidden viewBox="0 0 20 20" className="h-4 w-4">
                <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          <div className="flex flex-col gap-4 overflow-y-auto px-5 py-4 text-sm">
            {d.warning && <p className="rounded-lg bg-signal-soft px-3 py-2">{d.warning}</p>}
            {d.summary && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">What Riposte understood{d.doc_kind ? ` · ${d.doc_kind}` : ""}</p>
                <p className="mt-1">{d.summary}</p>
              </div>
            )}
            {d.key_points && d.key_points.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">Key points</p>
                <ul className="mt-1 list-disc space-y-1 pl-5">
                  {d.key_points.map((k) => (
                    <li key={k}>{k}</li>
                  ))}
                </ul>
              </div>
            )}
            {d.excerpt && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">First lines, to compare with your file</p>
                <p className="mt-1 italic text-muted">&ldquo;{d.excerpt}&rdquo;</p>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between gap-3 border-t border-line px-5 py-3">
            <form action={deleteKnowledgeFile} onSubmit={() => dialog.current?.close()}>
              <input type="hidden" name="id" value={d.id} />
              <button type="submit" className="text-sm font-semibold text-danger hover:underline">
                Delete file
              </button>
            </form>
            <button
              type="button"
              onClick={() => dialog.current?.close()}
              className="rounded-lg border border-line px-3 py-1.5 text-sm font-semibold hover:bg-bg"
            >
              Close
            </button>
          </div>
        </div>
      </dialog>
    </li>
  );
}
