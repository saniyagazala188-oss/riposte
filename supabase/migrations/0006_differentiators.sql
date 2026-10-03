-- Riposte · "What makes you different" on the product profile
-- Run this once in Supabase: SQL Editor → New query → paste → Run.
--
-- Adds profiles.differentiators: 2-3 short points on what makes the product different.
-- Signals and action kits use them, so talk tracks and battlecards pivot to real strengths.

alter table public.profiles add column if not exists differentiators text;
