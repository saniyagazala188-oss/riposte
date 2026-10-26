"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

// Keeps Google Analytics off inside the app and on devices marked "don't track me",
// also when someone moves between pages without a full reload.
export function AnalyticsGate({ id }: { id: string }) {
  const path = usePathname();
  const [note, setNote] = useState<"" | "off" | "on">("");

  useEffect(() => {
    let mine = false;
    try {
      const q = new URLSearchParams(window.location.search);
      if (q.has("notrack")) { localStorage.setItem("riposte_notrack", "1"); setNote("off"); }
      if (q.has("track")) { localStorage.removeItem("riposte_notrack"); setNote("on"); }
      mine = localStorage.getItem("riposte_notrack") === "1";
    } catch {}
    (window as unknown as Record<string, boolean>)[`ga-disable-${id}`] = mine || /^\/app(\/|$)/.test(path);
  }, [path, id]);

  useEffect(() => {
    if (!note) return;
    const t = setTimeout(() => setNote(""), 5000);
    return () => clearTimeout(t);
  }, [note]);

  if (!note) return null;
  return (
    <div role="status" className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-xl bg-[#12171c] px-4 py-2.5 text-sm text-white shadow-lg">
      {note === "off" ? "Analytics is off for your visits on this device." : "Analytics is back on for this device."}
    </div>
  );
}
