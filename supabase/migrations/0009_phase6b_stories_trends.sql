-- Riposte · phase 6b database setup (linked signals and trend alerts)
-- Run this once in Supabase: SQL Editor → New query → paste → Run.
--
-- Adds:
--   stories   related moves by ONE competitor joined into one insight
--             (for example a price change + a launch post + a changelog entry on the same theme)
--   trends    a topic that SEVERAL competitors started publishing about recently

create table if not exists public.stories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  competitor_id uuid not null references public.competitors (id) on delete cascade,
  created_at timestamptz not null default now(),
  title text not null,
  summary text not null default '',
  so_what text not null default '',
  action text not null default '',
  signal_ids uuid[] not null default '{}',
  status text not null default 'new' check (status in ('new', 'reviewed', 'dismissed'))
);
create index if not exists stories_user_idx on public.stories (user_id, created_at desc);
create index if not exists stories_competitor_idx on public.stories (competitor_id, created_at desc);

create table if not exists public.trends (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  topic text not null,
  summary text not null default '',
  so_what text not null default '',
  action text not null default '',
  competitors jsonb not null default '[]'::jsonb,   -- [{ id, name, titles: [..] }]
  status text not null default 'new' check (status in ('new', 'reviewed', 'dismissed'))
);
create index if not exists trends_user_idx on public.trends (user_id, created_at desc);

alter table public.stories enable row level security;
alter table public.trends enable row level security;

drop policy if exists "Users manage their own stories" on public.stories;
create policy "Users manage their own stories"
  on public.stories for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

drop policy if exists "Users manage their own trends" on public.trends;
create policy "Users manage their own trends"
  on public.trends for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

grant select, insert, update, delete on public.stories, public.trends to authenticated;
grant select, insert, update, delete on public.stories, public.trends to service_role;
