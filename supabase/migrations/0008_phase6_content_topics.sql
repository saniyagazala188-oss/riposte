-- Riposte · phase 6a database setup (content intelligence)
-- Run this once in Supabase: SQL Editor → New query → paste → Run.
--
-- Adds:
--   content_topics   for each competitor, the topics its content is building,
--                    grouped by AI from its post titles and blog addresses.
-- Publishing pace and page mix need no new tables: they are worked out from the
-- blog feed and sitemap that Riposte already reads every day.

create table if not exists public.content_topics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  competitor_id uuid not null unique references public.competitors (id) on delete cascade,
  generated_at timestamptz not null default now(),
  source_count integer not null default 0,
  summary text not null default '',
  topics jsonb not null default '[]'::jsonb
);

alter table public.content_topics enable row level security;

drop policy if exists "Users manage their own content topics" on public.content_topics;
create policy "Users manage their own content topics"
  on public.content_topics for all
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

grant select, insert, update, delete on public.content_topics to authenticated;
grant select, insert, update, delete on public.content_topics to service_role;
