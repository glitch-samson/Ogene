-- ONE-TIME MIGRATION — paste this whole file into the Supabase SQL editor and
-- run it. Adds manuscripts.cover_image and lets authors (not just staff)
-- upload to the covers storage bucket. Already merged into supabase_setup.sql;
-- this is a clean copy to paste without scrolling. Delete once run.
--
-- Look for "OGENE: optional cover images ready." in the output.


-- ═══════════════════════════════════════════════════════════════════════════
-- OPTIONAL AUTHOR-PROVIDED COVER IMAGES
--
-- Authors may optionally attach a cover image at submission time; it carries
-- through to the published article (see the publish action in the app,
-- which copies manuscripts.cover_image onto the new articles row). When
-- absent, the UI falls back to a plain branded placeholder — that fallback
-- is a pure rendering choice and needs no database support.
-- ═══════════════════════════════════════════════════════════════════════════
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'manuscripts' and column_name = 'cover_image'
  ) then
    alter table public.manuscripts add column cover_image text;
  end if;
end $$;

-- Widen the covers bucket so any signed-in author can upload their own cover
-- image, not just staff. Low stakes: it's a public-read decorative-image
-- bucket, not sensitive content, and staff can still remove anything
-- inappropriate through the existing admin tooling.
drop policy if exists "Covers Admin Write" on storage.objects;
drop policy if exists "Covers Authenticated Write" on storage.objects;
create policy "Covers Authenticated Write"
  on storage.objects for insert
  with check (bucket_id = 'covers' and auth.uid() is not null);

do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'manuscripts' and column_name = 'cover_image'
  ) then
    raise exception 'FAIL: manuscripts.cover_image column is missing.';
  end if;
  raise notice 'OGENE: optional cover images ready.';
end $$;
