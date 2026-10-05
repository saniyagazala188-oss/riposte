-- Riposte · content briefs
-- Run this once in Supabase: SQL Editor → New query → paste → Run.
--
-- Adds content_briefs: a ready-to-write brief (title, keyword, intent, angle, quick answer, outline, FAQs)
-- created from a trend across competitors or from an AI answer where competitors are named and you aren't.

create table if not exists public.content_briefs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  source text not null check (source in ('trend', 'visibility')),
  source_id uuid,
  topic text not null,
  content jsonb not null,
  status text not null default 'new' check (status in ('new', 'writing', 'published'))
);
create index if not exists content_briefs_user_idx on public.content_briefs (user_id, created_at desc);

alter table public.content_briefs enable row level security;

drop policy if exists "Users manage their own briefs" on public.content_briefs;
create policy "Users manage their own briefs"
  on public.content_briefs for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

grant select, insert, update, delete on public.content_briefs to authenticated;
grant select, insert, update, delete on public.content_briefs to service_role;
