"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

type Option = { value: string; label: string };

// Filter bar for the Actions board: two dropdowns and a group-by switch.
// Every change updates the address, so a filtered view can be bookmarked or shared.
export function ActionFilters({
  competitors,
  owners,
  showGroup,
}: {
  competitors: Option[];
  owners: Option[];
  showGroup: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const set = (key: string, value: string | null) => {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    const q = next.toString();
    router.push(q ? `${pathname}?${q}` : pathname);
  };

  const competitor = params.get("competitor") ?? "";
  const owner = params.get("owner") ?? "";
  const group = params.get("group") === "competitor" ? "competitor" : "urgency";
  const filtered = Boolean(competitor || owner);

  const select =
    "w-full rounded-lg border border-line bg-bg px-3 py-2.5 text-base outline-none focus:border-accent sm:w-56";
  const seg = (active: boolean) =>
    `rounded-md px-3 py-1.5 text-sm font-medium ${active ? "bg-surface text-ink shadow-sm" : "text-muted hover:text-ink"}`;

  return (
    <div className="rounded-2xl border border-line bg-surface p-4">
      <div className="flex flex-wrap items-end gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-semibold">Competitor</span>
          <select className={select} value={competitor} onChange={(e) => set("competitor", e.target.value || null)}>
            <option value="">All competitors</option>
            {competitors.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-semibold">Owner</span>
          <select className={select} value={owner} onChange={(e) => set("owner", e.target.value || null)}>
            <option value="">Everyone</option>
            {owners.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        {showGroup && (
          <div className="flex flex-col gap-1.5 sm:ml-auto">
            <span className="text-sm font-semibold">Group by</span>
            <div className="inline-flex rounded-lg border border-line bg-bg p-1" role="group" aria-label="Group by">
              <button type="button" className={seg(group === "urgency")} aria-pressed={group === "urgency"} onClick={() => set("group", null)}>
                Urgency
              </button>
              <button type="button" className={seg(group === "competitor")} aria-pressed={group === "competitor"} onClick={() => set("group", "competitor")}>
                Competitor
              </button>
            </div>
          </div>
        )}
      </div>
      {filtered && (
        <button
          type="button"
          className="mt-3 text-sm text-accent hover:underline"
          onClick={() => {
            const next = new URLSearchParams(params.toString());
            next.delete("competitor");
            next.delete("owner");
            const q = next.toString();
            router.push(q ? `${pathname}?${q}` : pathname);
          }}
        >
          Clear filters
        </button>
      )}
    </div>
  );
}
