-- Riposte · phase 2 database setup
-- Run this once in Supabase: SQL Editor → New query → paste → Run.
-- (Phase 1 must already be set up.)
--
-- Adds two tables:
--   competitors  the companies a user tracks
--   sources      the pages Riposte watches for each competitor
--                (changelog, blog, blog feed, pricing page, sitemap)
--
-- Row Level Security: every row belongs to one user, and users can only
-- see and change their own competitors and sources.

-- ---------- competitors ----------
create table if not exists public.competitors (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  domain text not null check (domain ~ '^[a-z0-9.-]+\.[a-z]{2,}$'),
  check_frequency text not null default 'daily' check (check_frequency in ('daily', 'weekly')),
  discovery_note text,
  created_at timestamptz not null default now(),
  unique (user_id, domain)
);

create index if not exists competitors_user_id_idx on public.competitors (user_id);

alter table public.competitors enable row level security;

drop policy if exists "Users manage their own competitors" on public.competitors;
create policy "Users manage their own competitors"
  on public.competitors for all
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- ---------- sources ----------
create table if not exists public.sources (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  competitor_id uuid not null references public.competitors (id) on delete cascade,
  type text not null check (type in ('changelog', 'blog', 'feed', 'pricing', 'sitemap', 'other')),
  url text not null check (url ~ '^https?://'),
  discovered boolean not null default false,
  last_checked_at timestamptz,
  created_at timestamptz not null default now(),
  unique (competitor_id, url)
);

create index if not exists sources_competitor_id_idx on public.sources (competitor_id);
create index if not exists sources_user_id_idx on public.sources (user_id);

alter table public.sources enable row level security;

drop policy if exists "Users manage their own sources" on public.sources;
create policy "Users manage their own sources"
  on public.sources for all
  to authenticated
  using ((select auth.uid()) = user_id)
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.competitors c
      where c.id = competitor_id and c.user_id = (select auth.uid())
    )
  );

-- ---------- access for the app ----------
grant select, insert, update, delete on public.competitors to authenticated;
grant select, insert, update, delete on public.sources to authenticated;
