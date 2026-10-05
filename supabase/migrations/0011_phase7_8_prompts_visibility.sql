-- Riposte · phases 7 and 8 database setup (Prompt Studio and AI visibility)
-- Run this once in Supabase: SQL Editor → New query → paste → Run.
--
-- Adds:
--   profiles.aeo_keywords / aeo_priorities   what Prompt Studio starts from
--   ai_prompts          buyer prompts grouped into Shield and Spear topics; "tracked" ones are checked in AI search
--   visibility_answers  one AI search answer per tracked prompt per run: who was named, which sites were cited

alter table public.profiles add column if not exists aeo_keywords text;
alter table public.profiles add column if not exists aeo_priorities text;

create table if not exists public.ai_prompts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  topic text not null,
  kind text not null default 'shield' check (kind in ('shield', 'spear')),
  dimension text not null default '',
  text text not null,
  position int not null default 0,
  source text not null default 'ai' check (source in ('ai', 'manual')),
  tracked boolean not null default false
);
create index if not exists ai_prompts_user_idx on public.ai_prompts (user_id, position);

create table if not exists public.visibility_answers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  prompt_id uuid not null references public.ai_prompts (id) on delete cascade,
  run_at timestamptz not null default now(),
  engine text not null default 'gemini-google-search',
  answer text not null default '',
  queries text[] not null default '{}',              -- the searches the AI ran (query fan-out)
  mentions jsonb not null default '[]'::jsonb,         -- [{ key: 'you' | competitor id, name, position }]
  citations jsonb not null default '[]'::jsonb,        -- [{ domain, title }]
  you_mentioned boolean not null default false,
  you_position int
);
-- Google's search suggestions widget, which must be shown next to a search-grounded answer.
alter table public.visibility_answers add column if not exists search_entry text;
create index if not exists visibility_user_idx on public.visibility_answers (user_id, run_at desc);
create index if not exists visibility_prompt_idx on public.visibility_answers (prompt_id, run_at desc);

alter table public.ai_prompts enable row level security;
alter table public.visibility_answers enable row level security;

drop policy if exists "Users manage their own prompts" on public.ai_prompts;
create policy "Users manage their own prompts"
  on public.ai_prompts for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

drop policy if exists "Users manage their own visibility answers" on public.visibility_answers;
create policy "Users manage their own visibility answers"
  on public.visibility_answers for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

grant select, insert, update, delete on public.ai_prompts, public.visibility_answers to authenticated;
grant select, insert, update, delete on public.ai_prompts, public.visibility_answers to service_role;
