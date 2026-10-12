-- Riposte · knowledge base
-- Run this once in Supabase: SQL Editor → New query → paste → Run.
--
-- 1. knowledge_docs: one row per uploaded PDF or Word file, with what Riposte read from it
--    (pages, words, a short AI summary, the first lines) so the user can check it worked.
-- 2. profiles.knowledge_summary: all file summaries joined together. Every AI step reads this,
--    next to the four product fields, so judgments use the user's own content.
-- 3. A private storage bucket "knowledge". Files go straight from the browser into a folder
--    named after the user, so each person can only see and delete their own files.

-- ---------- files ----------
create table if not exists public.knowledge_docs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  file_name text not null,
  file_type text not null check (file_type in ('pdf', 'docx')),
  size_bytes integer not null default 0,
  storage_path text,
  pages integer,
  words integer not null default 0,
  method text not null default 'text' check (method in ('text', 'ocr')),
  status text not null default 'ready' check (status in ('ready', 'warning')),
  warning text,
  doc_kind text,          -- e.g. "One-pager", "Blog post", "Positioning doc"
  summary text,           -- 2-3 sentences
  key_points text[],      -- main claims, features, proof points
  excerpt text,           -- first lines, to compare with the file
  body text               -- the text read from the file (capped)
);
create index if not exists knowledge_docs_user_idx on public.knowledge_docs (user_id, created_at desc);

alter table public.knowledge_docs enable row level security;

drop policy if exists "Users manage their own knowledge" on public.knowledge_docs;
create policy "Users manage their own knowledge"
  on public.knowledge_docs for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

grant select, insert, update, delete on public.knowledge_docs to authenticated;
grant select, insert, update, delete on public.knowledge_docs to service_role;

-- ---------- combined summary used by every AI step ----------
alter table public.profiles add column if not exists knowledge_summary text;

-- ---------- private file storage ----------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'knowledge', 'knowledge', false, 10485760,
  array['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
on conflict (id) do update
  set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Knowledge: upload own files" on storage.objects;
create policy "Knowledge: upload own files"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'knowledge' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists "Knowledge: read own files" on storage.objects;
create policy "Knowledge: read own files"
  on storage.objects for select to authenticated
  using (bucket_id = 'knowledge' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists "Knowledge: delete own files" on storage.objects;
create policy "Knowledge: delete own files"
  on storage.objects for delete to authenticated
  using (bucket_id = 'knowledge' and (storage.foldername(name))[1] = (select auth.uid())::text);

notify pgrst, 'reload schema';
