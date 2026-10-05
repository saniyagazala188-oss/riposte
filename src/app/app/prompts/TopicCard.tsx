"use client";

import { useState } from "react";

// A topic with its prompts: the first few are shown, the rest one click away.
export function TopicCard({
  header,
  rows,
  initial = 4,
}: {
  header: React.ReactNode;
  rows: React.ReactNode[];
  initial?: number;
}) {
  const [all, setAll] = useState(false);
  const shown = all ? rows : rows.slice(0, initial);
  return (
    <section className="rounded-2xl border border-line bg-surface">
      {header}
      <ul className="divide-y divide-line">{shown}</ul>
      {rows.length > initial && (
        <button
          type="button"
          onClick={() => setAll((v) => !v)}
          className="w-full border-t border-line px-4 py-2.5 text-sm font-semibold text-accent hover:bg-bg"
        >
          {all ? "Show fewer" : `Show all ${rows.length} prompts`}
        </button>
      )}
    </section>
  );
}
