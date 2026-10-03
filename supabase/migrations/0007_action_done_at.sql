-- Riposte · when each action was finished
-- Run this once in Supabase: SQL Editor → New query → paste → Run.
--
-- Adds action_items.done_at, so the weekly digest can report the responses
-- the team shipped that week.

alter table public.action_items add column if not exists done_at timestamptz;
update public.action_items set done_at = now() where status = 'done' and done_at is null;
