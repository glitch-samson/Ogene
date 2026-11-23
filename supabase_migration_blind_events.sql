-- ═══════════════════════════════════════════════════════════════════════════
-- DOUBLE-BLIND FIX: AUTHORS' VIEW OF THE MANUSCRIPT TIMELINE
--
-- Same section as in supabase_setup.sql — paste-once copy for an existing
-- database. Idempotent: safe to re-run.
--
-- The problem: authors could SELECT their manuscripts' rows in
-- manuscript_events directly. For a 'review_submitted' event, actor_id is the
-- reviewer's profile id and note is their recommendation — and profiles are
-- public, so an author could identify who reviewed them.
--
-- The fix: authors lose direct access to the table. They read their timeline
-- through author_manuscript_events(), which never returns actor_id or note,
-- and leaves out internal production-staff steps. Staff access is unchanged.
-- ═══════════════════════════════════════════════════════════════════════════

drop policy if exists "Authors view own manuscript events" on public.manuscript_events;

create or replace function public.author_manuscript_events(p_manuscript_id uuid default null)
returns table(
  id uuid,
  manuscript_id uuid,
  event_type text,
  from_status text,
  to_status text,
  created_at timestamp with time zone
)
language sql
stable
security definer
set search_path = public
as $$
  select e.id, e.manuscript_id, e.event_type, e.from_status, e.to_status, e.created_at
  from public.manuscript_events e
  join public.manuscripts m on m.id = e.manuscript_id
  where m.submitting_author_id = auth.uid()
    and (p_manuscript_id is null or e.manuscript_id = p_manuscript_id)
    and (e.to_status is not null or e.event_type in ('reviewer_assigned', 'review_submitted'))
  order by e.created_at;
$$;

revoke execute on function public.author_manuscript_events(uuid) from public, anon;
grant execute on function public.author_manuscript_events(uuid) to authenticated;

do $$
declare
  event_policies integer;
begin
  -- Only the staff policy may remain on manuscript_events; any other policy
  -- could hand authors the reviewer's id again.
  select count(*) into event_policies
  from pg_policies
  where schemaname = 'public' and tablename = 'manuscript_events';
  if event_policies <> 1 or not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'manuscript_events'
      and qual ilike '%is_staff%'
  ) then
    raise exception 'FAIL: manuscript_events should have exactly one (staff-only) policy, found %. Double-blind review depends on it.', event_policies;
  end if;

  if not exists (select 1 from pg_proc where proname = 'author_manuscript_events') then
    raise exception 'FAIL: author_manuscript_events() is missing.';
  end if;

  raise notice 'OGENE: manuscript timeline is double-blind safe.';
end $$;
