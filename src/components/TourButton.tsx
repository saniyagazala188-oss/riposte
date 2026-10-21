"use client";

import { useEffect, useState } from "react";

// "Watch the 2-min tour": opens the full product tour in a light box. Esc or a click outside closes it.
export function TourButton({ label = "Watch the 2-min tour" }: { label?: string }) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) return;
    const close = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [open]);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="inline-flex items-center gap-2 font-semibold text-accent hover:underline">
        <span className="grid h-7 w-7 place-items-center rounded-full bg-accent text-xs text-accent-ink" aria-hidden>
          ▶
        </span>
        {label}
      </button>
      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Riposte product tour"
          className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4"
          onClick={() => setOpen(false)}
        >
          <div className="w-full max-w-4xl" onClick={(e) => e.stopPropagation()}>
            <video src="/video/riposte-tour.mp4" poster="/video/riposte-hero-poster.jpg" controls autoPlay playsInline className="w-full rounded-xl bg-black" />
            <button type="button" onClick={() => setOpen(false)} className="mt-3 w-full text-center text-sm font-semibold text-white">
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}
