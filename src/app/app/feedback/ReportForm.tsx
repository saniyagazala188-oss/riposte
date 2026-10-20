"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { inputClass, primaryButton } from "@/components/styles";
import { sendFeedback } from "./actions";

const MAX = 5 * 1024 * 1024;
const TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"];
const label = "text-sm font-semibold";

type Shot = { name: string; path: string; preview: string };

// The report form. Screenshots go straight from the browser into the person's own folder in the
// private "reports" bucket; only their paths are sent with the form. Page and browser are filled in quietly.
export function ReportForm({ userId, direct, error, empty }: { userId: string; direct: boolean; error: boolean; empty: boolean }) {
  const [shots, setShots] = useState<Shot[]>([]);
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [page, setPage] = useState("");
  const [browser, setBrowser] = useState("");
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setPage(document.referrer && new URL(document.referrer).origin === location.origin ? new URL(document.referrer).pathname : "");
    setBrowser(`${navigator.userAgent.slice(0, 250)} · ${window.innerWidth}×${window.innerHeight}`);
  }, []);

  async function add(files: FileList | null) {
    setProblem(null);
    if (!files?.length) return;
    const room = 3 - shots.length;
    for (const file of Array.from(files).slice(0, room)) {
      if (!TYPES.includes(file.type)) {
        setProblem("Screenshots can be PNG, JPG, WebP or GIF.");
        continue;
      }
      if (file.size > MAX) {
        setProblem("Each screenshot can be up to 5 MB.");
        continue;
      }
      const preview = URL.createObjectURL(file);
      if (direct) {
        setShots((s) => [...s, { name: file.name, path: `${userId}/preview-${file.name}`, preview }]);
        continue;
      }
      const supabase = createClient();
      if (!supabase) return setProblem("Uploads aren't available right now. You can still send the report without screenshots.");
      setBusy(true);
      const ext = file.type.split("/")[1].replace("jpeg", "jpg");
      const path = `${userId}/${crypto.randomUUID()}.${ext}`;
      const { error: up } = await supabase.storage.from("reports").upload(path, file, { contentType: file.type, upsert: false });
      setBusy(false);
      if (up) {
        setProblem(`A screenshot didn't upload (${up.message}). You can still send the report.`);
        continue;
      }
      setShots((s) => [...s, { name: file.name, path, preview }]);
    }
    if (input.current) input.current.value = "";
  }

  return (
    <form action={sendFeedback} onSubmit={() => setSending(true)} className="flex flex-col gap-5">
      {error && <p className="text-sm text-danger">Couldn&apos;t send your report. Please try again.</p>}
      {empty && <p className="text-sm text-danger">Tell me what went wrong first.</p>}
      <input type="hidden" name="page_url" value={page} />
      <input type="hidden" name="browser" value={browser} />
      {shots.map((s) => (
        <input key={s.path} type="hidden" name="shot" value={s.path} />
      ))}

      <div className="flex flex-col gap-1.5">
        <label htmlFor="missing" className={label}>
          What went wrong?
        </label>
        <textarea
          id="missing"
          name="missing"
          rows={4}
          required
          className={inputClass}
          placeholder="What did you do, and what happened? For example: I clicked Build action kit and the page showed an error."
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="expected" className={label}>
          What did you expect to happen? <span className="font-normal text-muted">(optional)</span>
        </label>
        <textarea id="expected" name="expected" rows={2} className={inputClass} placeholder="For example: the action kit with three drafts" />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="uses_for" className={label}>
          Where did it happen? <span className="font-normal text-muted">(optional)</span>
        </label>
        <input id="uses_for" name="uses_for" className={inputClass} placeholder="For example: the Feed, Comparisons, Slack alerts" />
      </div>

      <div className="flex flex-col gap-2">
        <p className={label}>
          Screenshots <span className="font-normal text-muted">(up to 3, they help a lot)</span>
        </p>
        <div className="flex flex-wrap gap-3">
          {shots.map((s) => (
            <div key={s.path} className="relative h-24 w-36 overflow-hidden rounded-lg border border-line bg-bg">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={s.preview} alt={s.name} className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => setShots((all) => all.filter((x) => x.path !== s.path))}
                className="absolute right-1 top-1 rounded-full bg-ink/80 px-2 text-xs font-bold text-white"
                aria-label={`Remove ${s.name}`}
              >
                ×
              </button>
            </div>
          ))}
          {shots.length < 3 && (
            <label
              htmlFor="report-shot"
              className={`grid h-24 w-36 cursor-pointer place-items-center rounded-lg border border-dashed border-line bg-bg text-center text-sm text-muted hover:border-muted ${busy ? "pointer-events-none opacity-60" : ""}`}
            >
              {busy ? "Uploading…" : "+ Add screenshot"}
            </label>
          )}
        </div>
        <input ref={input} id="report-shot" type="file" accept={TYPES.join(",")} multiple className="sr-only" onChange={(e) => add(e.target.files)} />
        {problem && <p className="text-sm text-danger">{problem}</p>}
        <p className="text-xs text-muted">Your browser and the page you came from are added automatically, so I can find the problem faster.</p>
      </div>

      <div>
        <button type="submit" disabled={busy || sending} className={primaryButton}>
          {sending ? "Sending…" : "Send report"}
        </button>
      </div>
      <p className="text-sm text-muted">
        Want to tell me what you think of Riposte instead?{" "}
        <Link href="/app/survey" className="font-semibold text-accent hover:underline">
          Help shape Riposte
        </Link>
        .
      </p>
    </form>
  );
}
