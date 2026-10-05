-- Riposte · invite-only beta
-- Run this once in Supabase: SQL Editor → New query → paste → Run.
--
-- 1. The waitlist gets an "approved" date. Only approved emails can use the app.
-- 2. Everyone who already has an account is approved, so nobody gets locked out.
-- 3. A feedback table for the in-app "Give feedback" form.

-- ---------- approvals ----------
alter table public.waitlist add column if not exists approved_at timestamptz;
alter table public.waitlist add column if not exists invited_at timestamptz;

insert into public.waitlist (email, source, approved_at)
select lower(email), 'existing account', now()
from auth.users
where email is not null
on conflict (email) do update set approved_at = coalesce(public.waitlist.approved_at, now());

-- Is the signed-in person approved? Reads only their own row, so the list stays private.
create or replace function public.is_approved()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.waitlist w
    where lower(w.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
      and w.approved_at is not null
  );
$$;
revoke all on function public.is_approved() from public;
grant execute on function public.is_approved() to authenticated;

-- ---------- feedback ----------
create table if not exists public.feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  email text,
  created_at timestamptz not null default now(),
  uses_for text,      -- what they use Riposte for
  miss_most text,     -- which part they'd miss most
  missing text,       -- what's missing or confusing
  would_pay text,     -- yes / maybe / no
  pay_amount text     -- what they'd pay, in their words
);

alter table public.feedback enable row level security;

drop policy if exists "Users add their own feedback" on public.feedback;
create policy "Users add their own feedback"
  on public.feedback for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users read their own feedback" on public.feedback;
create policy "Users read their own feedback"
  on public.feedback for select to authenticated
  using ((select auth.uid()) = user_id);

grant select, insert on public.feedback to authenticated;
grant select, insert, update, delete on public.feedback to service_role;
grant select, insert, update on public.waitlist to service_role;
grant select on public.profiles to service_role;

notify pgrst, 'reload schema';
