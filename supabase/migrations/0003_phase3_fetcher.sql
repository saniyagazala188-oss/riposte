-- Riposte · phase 3 database setup (the fetcher)
-- Run this once in Supabase: SQL Editor → New query → paste → Run.
-- (Phases 1 and 2 must already be set up.)
--
-- Adds:
--   sources.*    status of the last check for each watched page
--   snapshots    what each page looked like at each check (main content only)
--   changes      what changed between two checks; phase 4 turns these into AI signals
--
-- Row Level Security: every row belongs to one user, and users only see their own.
-- The daily automatic check runs on the server with the service role, which bypasses RLS.

-- ---------- sources: check status ----------
alter table public.sources add column if not exists last_status text;
alter table public.sources add column if not exists last_error text;
alter table public.sources add column if not exists last_changed_at timestamptz;

-- ---------- snapshots ----------
create table if not exists public.snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  source_id uuid not null references public.sources (id) on delete cascade,
  fetched_at timestamptz not null default now(),
  method text not null default 'direct' check (method in ('direct', 'reader')),
  content_hash text not null,
  lines jsonb,
  items jsonb,
  char_count integer not null default 0
);

create index if not exists snapshots_source_idx on public.snapshots (source_id, fetched_at desc);
create index if not exists snapshots_user_idx on public.snapshots (user_id);

alter table public.snapshots enable row level security;

drop policy if exists "Users manage their own snapshots" on public.snapshots;
create policy "Users manage their own snapshots"
  on public.snapshots for all
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- ---------- changes ----------
create table if not exists public.changes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  competitor_id uuid not null references public.competitors (id) on delete cascade,
  source_id uuid not null references public.sources (id) on delete cascade,
  detected_at timestamptz not null default now(),
  kind text not null check (kind in ('content', 'new_posts', 'new_pages')),
  added jsonb not null default '[]'::jsonb,
  removed jsonb not null default '[]'::jsonb,
  processed boolean not null default false
);

create index if not exists changes_user_idx on public.changes (user_id, detected_at desc);
create index if not exists changes_competitor_idx on public.changes (competitor_id, detected_at desc);

alter table public.changes enable row level security;

drop policy if exists "Users manage their own changes" on public.changes;
create policy "Users manage their own changes"
  on public.changes for all
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- ---------- access ----------
grant select, insert, update, delete on public.snapshots to authenticated;
grant select, insert, update, delete on public.changes to authenticated;

-- The daily check runs as the service role. New tables are not exposed
-- automatically in this project, so give it explicit access too.
grant usage on schema public to service_role;
grant select, insert, update, delete on public.profiles, public.competitors, public.sources,
  public.snapshots, public.changes to service_role;
