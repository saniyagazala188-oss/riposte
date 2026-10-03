-- Riposte · phase 4 database setup (AI signals and alerts)
-- Run this once in Supabase: SQL Editor → New query → paste → Run.
-- (Phases 1 to 3 must already be set up.)
--
-- Adds:
--   signals      one AI-written explanation per detected change: what changed,
--                why it matters to you, what to do, and how important it is
--   changes.*    a retry counter, so a change the AI can't read isn't retried forever
--   profiles.*   alert settings: email alerts, weekly digest, Slack
--
-- Row Level Security: every signal belongs to one user, and users only see their own.

-- ---------- changes: AI retry counter ----------
alter table public.changes add column if not exists ai_attempts integer not null default 0;
create index if not exists changes_unprocessed_idx on public.changes (detected_at) where processed = false;

-- ---------- profiles: alert settings ----------
alter table public.profiles add column if not exists email_alerts boolean not null default true;
alter table public.profiles add column if not exists weekly_digest boolean not null default true;
alter table public.profiles add column if not exists slack_webhook_url text
  check (slack_webhook_url is null or slack_webhook_url ~ '^https://hooks\.slack\.com/');
alter table public.profiles add column if not exists last_digest_at timestamptz;

-- ---------- signals ----------
create table if not exists public.signals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  competitor_id uuid not null references public.competitors (id) on delete cascade,
  change_id uuid not null unique references public.changes (id) on delete cascade,
  created_at timestamptz not null default now(),
  title text not null,
  what_changed text not null,
  so_what text not null,
  action text not null,
  impact text not null check (impact in ('high', 'medium', 'low')),
  category text not null default 'other'
    check (category in ('pricing', 'product', 'content', 'positioning', 'other')),
  noise boolean not null default false,
  status text not null default 'new' check (status in ('new', 'reviewed', 'dismissed')),
  alerted_at timestamptz
);

create index if not exists signals_user_idx on public.signals (user_id, created_at desc);
create index if not exists signals_competitor_idx on public.signals (competitor_id, created_at desc);

alter table public.signals enable row level security;

drop policy if exists "Users manage their own signals" on public.signals;
create policy "Users manage their own signals"
  on public.signals for all
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- ---------- access ----------
grant select, insert, update, delete on public.signals to authenticated;
grant select, insert, update, delete on public.signals to service_role;
