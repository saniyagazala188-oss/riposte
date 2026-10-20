-- Riposte · better problem reports
-- Run this once in Supabase: SQL Editor → New query → paste → Run.
--
-- 1. "Report a problem" also saves what they expected, the page they were on, their browser,
--    and up to 3 screenshots.
-- 2. A private storage bucket "reports" for those screenshots. Each person can only upload to
--    and read their own folder; the admin page reads them with the server key.

alter table public.feedback add column if not exists expected text;
alter table public.feedback add column if not exists page_url text;
alter table public.feedback add column if not exists browser text;
alter table public.feedback add column if not exists screenshot_paths text[];

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('reports', 'reports', false, 5242880, array['image/png', 'image/jpeg', 'image/webp', 'image/gif'])
on conflict (id) do update
  set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Reports: upload own screenshots" on storage.objects;
create policy "Reports: upload own screenshots"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'reports' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists "Reports: read own screenshots" on storage.objects;
create policy "Reports: read own screenshots"
  on storage.objects for select to authenticated
  using (bucket_id = 'reports' and (storage.foldername(name))[1] = (select auth.uid())::text);

notify pgrst, 'reload schema';
