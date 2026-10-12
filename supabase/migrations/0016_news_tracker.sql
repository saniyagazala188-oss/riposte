-- Riposte · news and recognition tracker
-- Run this once in Supabase: SQL Editor → New query → paste → Run.
--
-- 1. A new kind of source, "news": a Google News feed for each competitor's name. It covers
--    tech press (TechCrunch, Forbes…) and press release wires (PR Newswire, Business Wire…).
-- 2. A new kind of change, "news": one story about a competitor (several articles about the
--    same story are grouped into one).
-- 3. New signal labels for news: partnership, recognition (Gartner, Forrester, awards),
--    funding (funding, acquisitions), leadership (executive changes) and trouble (outages,
--    layoffs, security issues, lawsuits). Launches use the existing "product" label.
-- 4. Every competitor you already track gets its news source now.

alter table public.sources drop constraint if exists sources_type_check;
alter table public.sources add constraint sources_type_check
  check (type in ('changelog', 'blog', 'feed', 'pricing', 'sitemap', 'other', 'news'));

alter table public.changes drop constraint if exists changes_kind_check;
alter table public.changes add constraint changes_kind_check
  check (kind in ('content', 'new_posts', 'new_pages', 'rewrite', 'news'));

alter table public.signals drop constraint if exists signals_category_check;
alter table public.signals add constraint signals_category_check
  check (category in ('pricing', 'product', 'content', 'positioning', 'other',
                      'partnership', 'recognition', 'funding', 'leadership', 'trouble'));

-- A Google News search for the exact company name, last 14 days, in English.
create or replace function public.news_feed_url(company text)
returns text
language sql
immutable
as $$
  select 'https://news.google.com/rss/search?q='
    || '%22' || replace(replace(replace(replace(trim(company), '%', '%25'), '&', '%26'), '"', ''), ' ', '+') || '%22'
    || '+when:14d&hl=en-US&gl=US&ceid=US:en';
$$;

insert into public.sources (user_id, competitor_id, type, url, discovered)
select c.user_id, c.id, 'news', public.news_feed_url(c.name), true
from public.competitors c
where not exists (select 1 from public.sources s where s.competitor_id = c.id and s.type = 'news')
on conflict (competitor_id, url) do nothing;

notify pgrst, 'reload schema';
