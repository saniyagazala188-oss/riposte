// Local preview only: a stand-in for the Supabase client that serves sample data, so every page
// can be opened and screenshotted without a database. Switched on with RIPOSTE_MOCK=1 in
// development; it is never used on the live site.
import { mockTables } from "./mock-data";

type Row = Record<string, unknown>;
type Filter = (r: Row) => boolean;

export const mockEnabled = () => process.env.RIPOSTE_MOCK === "1" && process.env.NODE_ENV !== "production";

function builder(table: string) {
  const filters: Filter[] = [];
  let sort: { col: string; asc: boolean }[] = [];
  let lim: number | null = null;
  let from = 0;
  let head = false;
  let wantCount = false;
  let single = false;
  let write = false;

  const rows = () => {
    let out = (mockTables()[table] ?? []).filter((r) => filters.every((f) => f(r)));
    for (const s of [...sort].reverse()) {
      out = [...out].sort((a, b) => {
        const x = a[s.col] as string | number | boolean;
        const y = b[s.col] as string | number | boolean;
        if (x === y) return 0;
        return (x > y ? 1 : -1) * (s.asc ? 1 : -1);
      });
    }
    return out;
  };

  const api: Record<string, unknown> = {
    select(_cols?: string, opts?: { count?: string; head?: boolean }) {
      if (opts?.count) wantCount = true;
      if (opts?.head) head = true;
      return api;
    },
    eq: (c: string, v: unknown) => (c.includes(".") || filters.push((r) => r[c] === v), api),
    neq: (c: string, v: unknown) => (filters.push((r) => r[c] !== v), api),
    in: (c: string, v: unknown[]) => (filters.push((r) => v.includes(r[c])), api),
    gt: (c: string, v: string) => (filters.push((r) => String(r[c]) > v), api),
    gte: (c: string, v: string) => (filters.push((r) => String(r[c]) >= v), api),
    lt: (c: string, v: string) => (filters.push((r) => String(r[c]) < v), api),
    lte: (c: string, v: string) => (filters.push((r) => String(r[c]) <= v), api),
    not: (c: string) => (filters.push((r) => r[c] != null), api),
    is: (c: string, v: unknown) => (filters.push((r) => (r[c] ?? null) === v), api),
    ilike: (c: string, v: string) => {
      const needle = v.replace(/%/g, "").toLowerCase();
      filters.push((r) => String(r[c] ?? "").toLowerCase().includes(needle));
      return api;
    },
    or: () => api,
    order: (c: string, o?: { ascending?: boolean }) => (sort.push({ col: c, asc: o?.ascending ?? true }), api),
    limit: (n: number) => ((lim = n), api),
    range: (a: number, b: number) => ((from = a), (lim = b - a + 1), api),
    maybeSingle: () => ((single = true), api),
    single: () => ((single = true), api),
    insert: () => ((write = true), api),
    update: () => ((write = true), api),
    upsert: () => ((write = true), api),
    delete: () => ((write = true), api),
    then(resolve: (v: unknown) => void) {
      if (write) return resolve({ data: null, error: null });
      const all = rows();
      const page = all.slice(from, lim === null ? undefined : from + lim);
      const count = wantCount ? all.length : null;
      if (head) return resolve({ data: null, count, error: null });
      if (single) return resolve({ data: page[0] ?? null, error: null });
      return resolve({ data: page, count, error: null });
    },
  };
  sort = [];
  return api;
}

export function createMockClient() {
  return {
    from: (table: string) => builder(table),
    auth: {
      getUser: async () => ({ data: { user: { id: "u1", email: "saniyagazala188@gmail.com" } }, error: null }),
      signOut: async () => ({ error: null }),
      exchangeCodeForSession: async () => ({ error: null }),
      updateUser: async () => ({ error: null }),
    },
  } as never;
}
