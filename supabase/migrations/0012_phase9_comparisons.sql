-- Riposte · phase 9 database setup (living comparison pages)
-- Run this once in Supabase: SQL Editor → New query → paste → Run.
--
-- Adds comparisons: one "You vs competitor" page draft per competitor, written from your profile and
-- what Riposte has read on their site. It is marked out of date when that competitor changes pricing,
-- product or positioning, and keeps the previous version so changes can be highlighted.

create table if not exists public.comparisons (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  competitor_id uuid not null unique references public.competitors (id) on delete cascade,
  generated_at timestamptz not null default now(),
  content jsonb not null,
  previous_content jsonb,
  previous_generated_at timestamptz,
  signal_ids uuid[] not null default '{}'   -- the signals the current version took into account
);
create index if not exists comparisons_user_idx on public.comparisons (user_id);

alter table public.comparisons enable row level security;

drop policy if exists "Users manage their own comparisons" on public.comparisons;
create policy "Users manage their own comparisons"
  on public.comparisons for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

grant select, insert, update, delete on public.comparisons to authenticated;
grant select, insert, update, delete on public.comparisons to service_role;
