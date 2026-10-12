"use client";

import { useActionState, useRef, useState, startTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { primaryButton } from "@/components/styles";
import { addKnowledgeFile, type KnowledgeState } from "./knowledge-actions";

const MAX = 10 * 1024 * 1024;
const kindOf = (name: string) => (/\.pdf$/i.test(name) ? "pdf" : /\.docx$/i.test(name) ? "docx" : null);
const MIME = {
  pdf: "application/pdf",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
} as const;

// Picks a file, puts it straight into private storage from the browser (big files can't go
// through the server), then asks the server to read it. In local preview the file is sent directly.
export function KnowledgeUpload({ userId, direct, full }: { userId: string; direct: boolean; full: boolean }) {
  const [state, action, pending] = useActionState<KnowledgeState, FormData>(addKnowledgeFile, { status: "idle" });
  const [uploading, setUploading] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);

  async function onPick(file: File | undefined) {
    setProblem(null);
    if (!file) return;
    const kind = kindOf(file.name);
    if (!kind) return setProblem("Only PDF and Word (.docx) files can be added. Old .doc files: save them as .docx first.");
    if (file.size > MAX) return setProblem("Files can be up to 10 MB.");

    const fd = new FormData();
    fd.set("name", file.name);
    if (direct) {
      fd.set("file", file);
    } else {
      const supabase = createClient();
      if (!supabase) return setProblem("Uploads aren't available right now.");
      setUploading(true);
      const safe = file.name.replace(/[^\w.-]+/g, "-").slice(-80);
      const path = `${userId}/${crypto.randomUUID()}-${safe}`;
      const { error } = await supabase.storage.from("knowledge").upload(path, file, { contentType: MIME[kind], upsert: false });
      setUploading(false);
      if (error) {
        return setProblem(
          /bucket/i.test(error.message)
            ? "File storage isn't set up yet (migration 0015)."
            : "The upload didn't go through. Please check your connection and try again.",
        );
      }
      fd.set("path", path);
    }
    startTransition(() => action(fd));
    if (input.current) input.current.value = "";
  }

  const busy = uploading || pending;
  const message = problem ?? (state.status === "error" ? state.message : null);

  return (
    <div className="rounded-xl border border-dashed border-line bg-bg p-4">
      <input
        ref={input}
        type="file"
        accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        className="sr-only"
        id="knowledge-file"
        disabled={busy || full}
        onChange={(e) => onPick(e.target.files?.[0])}
      />
      <div className="flex flex-wrap items-center gap-3">
        <label
          htmlFor="knowledge-file"
          className={`${primaryButton} cursor-pointer ${busy || full ? "pointer-events-none opacity-60" : ""}`}
          aria-disabled={busy || full}
        >
          {uploading ? "Uploading…" : pending ? "Reading your file…" : "Upload a file"}
        </label>
        <p className="text-xs text-muted">PDF or Word (.docx), up to 10 MB.</p>
      </div>
      {pending && (
        <p className="mt-3 text-sm text-muted" role="status">
          Reading the text and writing a short summary. This can take up to a minute.
        </p>
      )}
      {full && !busy && <p className="mt-3 text-sm text-signal">You&apos;ve reached the beta limit. Delete a file to add another.</p>}
      {message && !busy && (
        <p className="mt-3 text-sm text-danger" role="alert">
          {message}
        </p>
      )}
      {state.status === "done" && !busy && !message && (
        <p className="mt-3 text-sm text-accent" role="status">
          Added {state.name}. Check what Riposte read below.
        </p>
      )}
    </div>
  );
}
