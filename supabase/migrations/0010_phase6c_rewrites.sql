-- Riposte · phase 6c database setup (intent-change alerts: rewritten pages)
-- Run this once in Supabase: SQL Editor → New query → paste → Run.
--
-- Adds:
--   changes.kind 'rewrite'   an existing competitor page (blog post, guide, comparison page) was rewritten
--   changes.page_url         which page, for rewrites
--   page_outlines            the title, description and headings of recently changed competitor pages,
--                            so the next rewrite can be shown as Before / Now

alter table public.changes drop constraint if exists changes_kind_check;
alter table public.changes add constraint changes_kind_check
  check (kind in ('content', 'new_posts', 'new_pages', 'rewrite'));
alter table public.changes add column if not exists page_url text;

create table if not exists public.page_outlines (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  competitor_id uuid not null references public.competitors (id) on delete cascade,
  url text not null,
  outline jsonb not null default '[]'::jsonb,
  fetched_at timestamptz not null default now(),
  unique (competitor_id, url)
);

alter table public.page_outlines enable row level security;
drop policy if exists "Users manage their own page outlines" on public.page_outlines;
create policy "Users manage their own page outlines"
  on public.page_outlines for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

grant select, insert, update, delete on public.page_outlines to authenticated;
grant select, insert, update, delete on public.page_outlines to service_role;
