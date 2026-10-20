-- Riposte · beta survey
-- Run this once in Supabase: SQL Editor → New query → paste → Run.
--
-- 7 days after someone is approved, the app asks them 6 short questions.
-- One row per person: their answers, or that they said "Not now", and whether the reminder email went out.

create table if not exists public.beta_survey (
  user_id uuid primary key references auth.users (id) on delete cascade,
  email text,
  created_at timestamptz not null default now(),
  answered_at timestamptz,
  dismissed_at timestamptz,
  emailed_at timestamptz,
  before_tool text,      -- how they kept up with competitors before Riposte
  most_useful text,      -- which part helps most
  disappointment text,   -- very / somewhat / not (if they could no longer use Riposte)
  missing text,          -- what confused them or is missing
  fair_price text,       -- under_19 / 19_49 / 49_99 / 99_plus
  call_ok boolean        -- happy to do a 15-minute call
);

alter table public.beta_survey enable row level security;

drop policy if exists "Users read their own survey" on public.beta_survey;
create policy "Users read their own survey"
  on public.beta_survey for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users add their own survey" on public.beta_survey;
create policy "Users add their own survey"
  on public.beta_survey for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users update their own survey" on public.beta_survey;
create policy "Users update their own survey"
  on public.beta_survey for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

grant select, insert, update on public.beta_survey to authenticated;
grant select, insert, update, delete on public.beta_survey to service_role;

-- When was the signed-in person approved? Reads only their own waitlist row.
create or replace function public.my_approved_at()
returns timestamptz
language sql
stable
security definer
set search_path = ''
as $$
  select w.approved_at from public.waitlist w
  where lower(w.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  limit 1;
$$;
revoke all on function public.my_approved_at() from public;
grant execute on function public.my_approved_at() to authenticated;

notify pgrst, 'reload schema';
