-- Riposte · phase 5 database setup (action kit)
-- Run this once in Supabase: SQL Editor → New query → paste → Run.
-- (Phases 1 to 4 must already be set up.)
--
-- Adds:
--   action_items   for each signal: what to create, where to share it, who owns it,
--                  how soon, and a first draft. Each item can be ticked off as done.
--
-- Row Level Security: every item belongs to one user, and users only see their own.

create table if not exists public.action_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  signal_id uuid not null references public.signals (id) on delete cascade,
  competitor_id uuid not null references public.competitors (id) on delete cascade,
  created_at timestamptz not null default now(),
  position integer not null default 0,
  kind text not null default 'other' check (kind in (
    'battlecard', 'talk_track', 'comparison_page', 'blog_post', 'social_post',
    'customer_email', 'internal_update', 'web_copy', 'other')),
  title text not null,
  why text not null default '',
  channel text not null default '',
  owner text not null default 'PMM' check (owner in (
    'PMM', 'Sales', 'Content & SEO', 'Product', 'Leadership', 'Customer success')),
  priority text not null default 'this_week' check (priority in ('now', 'this_week', 'later')),
  draft text not null default '',
  status text not null default 'open' check (status in ('open', 'done'))
);

create index if not exists action_items_user_idx on public.action_items (user_id, status, created_at desc);
create index if not exists action_items_signal_idx on public.action_items (signal_id, position);

alter table public.action_items enable row level security;

drop policy if exists "Users manage their own action items" on public.action_items;
create policy "Users manage their own action items"
  on public.action_items for all
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

grant select, insert, update, delete on public.action_items to authenticated;
grant select, insert, update, delete on public.action_items to service_role;
