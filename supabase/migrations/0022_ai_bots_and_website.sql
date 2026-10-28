-- Riposte · AI bot visits and your website
-- Run this once in Supabase: SQL Editor → New query → paste → Run.
--
-- Adds:
--   profiles.website   your own website, so AI visibility can show when AI answers cite it
--   bot_visits         each visit to useriposte.com by an AI crawler (GPTBot, ClaudeBot, PerplexityBot…)
--                      or a search engine bot. Only the bot's name, the page and the time are kept.

alter table public.profiles add column if not exists website text;

create table if not exists public.bot_visits (
  id bigint generated always as identity primary key,
  bot text not null,            -- e.g. "GPTBot"
  company text not null,        -- e.g. "OpenAI"
  purpose text not null,        -- training, search, user (fetched while answering someone), search-engine
  path text not null,
  created_at timestamptz not null default now()
);
create index if not exists bot_visits_time on public.bot_visits (created_at desc);
create index if not exists bot_visits_path on public.bot_visits (path, created_at);

-- Row level security on, with no policies: only the server (secret key) can read or write it.
alter table public.bot_visits enable row level security;
grant select, insert on public.bot_visits to service_role;
