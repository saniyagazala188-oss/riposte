-- Riposte · YouTube (Social media)
-- Run this once in Supabase: SQL Editor → New query → paste → Run.
--
-- 1. A new kind of source, "youtube": a competitor's YouTube channel
--    (saved as https://www.youtube.com/channel/UC…).
-- 2. A new kind of change, "video": new videos on that channel.

alter table public.sources drop constraint if exists sources_type_check;
alter table public.sources add constraint sources_type_check
  check (type in ('changelog', 'blog', 'feed', 'pricing', 'sitemap', 'other', 'news', 'youtube'));

alter table public.changes drop constraint if exists changes_kind_check;
alter table public.changes add constraint changes_kind_check
  check (kind in ('content', 'new_posts', 'new_pages', 'rewrite', 'news', 'video'));

notify pgrst, 'reload schema';
