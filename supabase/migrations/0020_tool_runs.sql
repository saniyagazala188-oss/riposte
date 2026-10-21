-- Riposte · free tools usage limits
-- Run this once in Supabase: SQL Editor → New query → paste → Run.
--
-- The free tools on the website (first: the battlecard generator) use AI, which costs money.
-- Each run is logged here so one visitor can't use it hundreds of times.
-- Only a scrambled (hashed) version of the visitor's IP address is kept, never the address itself.
-- Nobody can read or write this table from the browser: only the server, with the secret key.

create table if not exists public.tool_runs (
  id bigint generated always as identity primary key,
  tool text not null,          -- e.g. "battlecard"
  ip_hash text not null,       -- scrambled IP address, used only to count runs
  target text,                 -- the competitor domain asked about
  ok boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists tool_runs_ip_time on public.tool_runs (tool, ip_hash, created_at desc);
create index if not exists tool_runs_time on public.tool_runs (tool, created_at desc);

-- Row level security on, with no policies: the browser can't touch it at all.
alter table public.tool_runs enable row level security;
