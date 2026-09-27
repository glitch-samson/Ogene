-- ONE-TIME MIGRATION — paste this whole file into the Supabase SQL editor and
-- run it. This is the section of supabase_setup.sql (the project's main,
-- idempotent bootstrap script) that hasn't been applied to the live database
-- yet. It's split out here only so you have something clean to paste instead
-- of scrolling chat — supabase_setup.sql already contains this same content
-- merged in, and is the file to read/edit going forward. Once this has run
-- successfully, this standalone file has no further purpose and can be
-- deleted.
--
-- Look for "OGENE: chief editor & production pipeline checks passed." in the
-- output when you run it. Anything else means something failed.

-- CHIEF EDITOR & PRODUCTION PIPELINE
--
-- Adds a third editorial tier on top of the base manuscript pipeline:
--
--   1. A chief_editor role, who alone may desk-reject, send a manuscript to
--      review, record the post-review accept/revise/reject decision, and give
--      the final publish stamp. Regular editors do not get these gates.
--   2. Peer review becomes a sequential relay of exactly 2 reviewers per round
--      instead of parallel: reviewer 2's assignment is invisible — at both the
--      view layer AND the base table layer — until reviewer 1 completes.
--   3. Production editing (graphics / wording / proofreading, or whatever
--      split the newsroom uses) is a free-form relay across regular editors:
--      any editor holding an open task may forward it to any other editor, or
--      redirect it for input and have it automatically return to them (with
--      the redirected editor's notes attached) once that side-task completes.
--
-- This runs against a database that already has the base manuscript pipeline
-- applied — every statement here is additive/guarded, same idempotent
-- philosophy as the rest of this file, so re-running is safe.
-- ═══════════════════════════════════════════════════════════════════════════

-- ── Role vocabulary ─────────────────────────────────────────────────────────
do $$
declare unexpected text;
begin
  select string_agg(distinct role, ', ')
  into unexpected
  from public.profiles
  where role not in ('admin', 'editor', 'chief_editor', 'reviewer', 'user');

  if unexpected is not null then
    raise exception
      'profiles contains unexpected role value(s): %. Reassign these to admin, editor, chief_editor, reviewer or user, then re-run.',
      unexpected;
  end if;
end $$;

alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check
  check (role in ('admin', 'editor', 'chief_editor', 'reviewer', 'user'));

-- is_staff() now also covers chief_editor — every existing policy built on
-- is_staff() (broad manuscript/file visibility) automatically extends to them
-- without touching those policies individually.
create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin', 'editor', 'chief_editor')
  );
$$;

create or replace function public.is_chief_editor()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'chief_editor'
  );
$$;

-- ── Manuscript status vocabulary ────────────────────────────────────────────
do $$
declare unexpected text;
begin
  select string_agg(distinct status, ', ')
  into unexpected
  from public.manuscripts
  where status not in (
    'submitted', 'desk_rejected', 'under_review', 'revisions_requested',
    'resubmitted', 'accepted', 'in_production', 'ready_for_final_approval',
    'rejected', 'published'
  );

  if unexpected is not null then
    raise exception
      'manuscripts contains unexpected status value(s): %. Reassign these, then re-run.',
      unexpected;
  end if;
end $$;

alter table public.manuscripts drop constraint if exists manuscripts_status_check;
alter table public.manuscripts add constraint manuscripts_status_check
  check (status in (
    'submitted', 'desk_rejected', 'under_review', 'revisions_requested',
    'resubmitted', 'accepted', 'in_production', 'ready_for_final_approval',
    'rejected', 'published'
  ));

-- ── Sequential peer review ───────────────────────────────────────────────────
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'manuscript_reviewers' and column_name = 'sequence'
  ) then
    alter table public.manuscript_reviewers add column sequence int not null default 1;
  end if;
end $$;

-- Single source of truth for "is it this reviewer's turn yet" — used by the
-- queue view and by the base-table policies below, so a reviewer can't learn
-- anything about their round-2 assignment (not even that it exists) by
-- querying manuscript_reviewers directly instead of going through the view.
create or replace function public.is_reviewer_turn(p_manuscript_id uuid, p_round int, p_sequence int)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select p_sequence = 1 or exists (
    select 1 from public.manuscript_reviewers prev
    where prev.manuscript_id = p_manuscript_id
      and prev.round = p_round
      and prev.sequence = p_sequence - 1
      and prev.status = 'completed'
  );
$$;

-- Dropped and recreated rather than CREATE OR REPLACE: Postgres only allows
-- REPLACE to append new trailing columns to a view, not insert one in the
-- middle (adding `sequence` between `round` and `assignment_status` shifts
-- every column after it, which Postgres reads as renaming them). Dropping
-- first sidesteps that restriction entirely, now and for any future reshape.
drop view if exists public.manuscript_review_queue;

create view public.manuscript_review_queue as
select
  m.id,
  m.title,
  m.abstract,
  m.category,
  m.keywords,
  m.status,
  m.current_round,
  mr.id as assignment_id,
  mr.round,
  mr.sequence,
  mr.status as assignment_status,
  mr.due_date,
  mr.recommendation,
  mr.comments_to_author,
  mr.comments_to_editor,
  mf.file_path
from public.manuscripts m
join public.manuscript_reviewers mr on mr.manuscript_id = m.id
left join public.manuscript_files mf on mf.manuscript_id = m.id and mf.round = mr.round
where mr.reviewer_id = auth.uid()
  and public.is_reviewer_turn(mr.manuscript_id, mr.round, mr.sequence);

revoke all on public.manuscript_review_queue from public, anon;
grant select on public.manuscript_review_queue to authenticated;

-- Base-table policies also respect sequencing (defense in depth — the view
-- is not the only thing standing between a reviewer and an out-of-turn row).
drop policy if exists "Reviewers view own assignments" on public.manuscript_reviewers;
create policy "Reviewers view own assignments"
  on public.manuscript_reviewers for select
  using (
    reviewer_id = auth.uid()
    and public.is_reviewer_turn(manuscript_id, round, sequence)
  );

drop policy if exists "Reviewers update own verdict" on public.manuscript_reviewers;
create policy "Reviewers update own verdict"
  on public.manuscript_reviewers for update
  using (
    reviewer_id = auth.uid()
    and public.is_reviewer_turn(manuscript_id, round, sequence)
  )
  with check (reviewer_id = auth.uid());

-- Reviewer assignment is now a chief-editor action specifically (regular
-- editors run production, not peer review).
drop policy if exists "Staff manage reviewer assignments" on public.manuscript_reviewers;
drop policy if exists "Chief editor manages reviewer assignments" on public.manuscript_reviewers;
create policy "Chief editor manages reviewer assignments"
  on public.manuscript_reviewers for all
  using (public.is_chief_editor() or public.is_admin())
  with check (public.is_chief_editor() or public.is_admin());

-- ── Manuscript status transitions now require the chief editor ─────────────
--
-- Regular editors reach a manuscript only as production-task holders (below);
-- the one manuscripts-level transition they trigger directly is flagging
-- production complete. Every other editorial call — desk-reject, send to
-- review, the post-review accept/revise/reject decision, and the publish
-- stamp — requires public.is_chief_editor() (or admin).
create or replace function public.guard_manuscript_client_update()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if current_user not in ('authenticated', 'anon') then
    return new;
  end if;

  if public.is_chief_editor() or public.is_admin() then
    return new;
  end if;

  if public.is_staff() then
    if old.status = 'in_production' and new.status = 'ready_for_final_approval'
       and new.current_round is not distinct from old.current_round
       and new.published_article_id is not distinct from old.published_article_id
       and new.submitting_author_id is not distinct from old.submitting_author_id then
      return new;
    end if;
    raise exception 'this manuscript transition requires the chief editor';
  end if;

  if new.submitting_author_id is distinct from old.submitting_author_id then
    raise exception 'manuscripts.submitting_author_id is immutable';
  end if;

  if new.published_article_id is distinct from old.published_article_id then
    raise exception 'manuscripts.published_article_id can only be set by staff';
  end if;

  if new.current_round is distinct from old.current_round then
    raise exception 'manuscripts.current_round can only be advanced by staff';
  end if;

  if new.status is distinct from old.status
     and not (old.status = 'revisions_requested' and new.status = 'resubmitted') then
    raise exception 'manuscripts.status can only move from revisions_requested to resubmitted from a client session';
  end if;

  return new;
end;
$$;

-- ── Production tasks ─────────────────────────────────────────────────────────
--
-- One row per "turn" a manuscript spends with a production editor. A normal
-- hand-off (forward) closes the current task and opens a fresh one for the
-- next editor. A redirect instead pauses the current task (status →
-- 'redirected') and opens a CHILD task (parent_task_id set) for whoever's
-- input is needed; when that child is marked completed, a trigger below
-- automatically reopens the parent so the original holder gets it back, with
-- the child's notes attached in its own row.
create table if not exists public.manuscript_production_tasks (
  id uuid default uuid_generate_v4() primary key,
  manuscript_id uuid references public.manuscripts(id) on delete cascade not null,
  assigned_to uuid references public.profiles(id) not null,
  assigned_by uuid references public.profiles(id) not null,
  parent_task_id uuid references public.manuscript_production_tasks(id),
  status text not null default 'open' check (status in ('open', 'redirected', 'completed')),
  comments text,
  created_at timestamp with time zone default now(),
  completed_at timestamp with time zone
);

alter table public.manuscript_production_tasks enable row level security;

-- Assignment fields are immutable for everyone, staff included — reassignment
-- always happens by creating a new row (forward/redirect), never by mutating
-- who a task belongs to. Only the fields a task holder actually needs to
-- update to do their job are grantable.
revoke update on public.manuscript_production_tasks from authenticated, anon;
grant update (status, comments, completed_at) on public.manuscript_production_tasks to authenticated;

create or replace function public.guard_production_task_update()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if current_user not in ('authenticated', 'anon') then
    return new;
  end if;

  if new.manuscript_id is distinct from old.manuscript_id
     or new.assigned_to is distinct from old.assigned_to
     or new.assigned_by is distinct from old.assigned_by
     or new.parent_task_id is distinct from old.parent_task_id then
    raise exception 'manuscript_production_tasks assignment fields are immutable';
  end if;

  return new;
end;
$$;

drop trigger if exists guard_production_task_update on public.manuscript_production_tasks;
create trigger guard_production_task_update
  before update on public.manuscript_production_tasks
  for each row execute function public.guard_production_task_update();

drop policy if exists "Staff view all production tasks" on public.manuscript_production_tasks;
create policy "Staff view all production tasks"
  on public.manuscript_production_tasks for select
  using (public.is_staff());

drop policy if exists "Staff create production tasks" on public.manuscript_production_tasks;
create policy "Staff create production tasks"
  on public.manuscript_production_tasks for insert
  with check (public.is_staff() and assigned_by = auth.uid());

drop policy if exists "Assignee updates own production task" on public.manuscript_production_tasks;
create policy "Assignee updates own production task"
  on public.manuscript_production_tasks for update
  using (assigned_to = auth.uid() or public.is_admin())
  with check (assigned_to = auth.uid() or public.is_admin());

-- Every task creation and every redirect-return is logged automatically —
-- same "the database records its own history" principle as the base pipeline
-- triggers above; there is no client insert path into manuscript_events.
create or replace function public.log_production_task_event()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.manuscript_events (manuscript_id, actor_id, event_type)
  values (
    new.manuscript_id,
    new.assigned_by,
    case when new.parent_task_id is not null then 'production_task_redirected' else 'production_task_assigned' end
  );
  return new;
end;
$$;

drop trigger if exists log_production_task_event on public.manuscript_production_tasks;
create trigger log_production_task_event
  after insert on public.manuscript_production_tasks
  for each row execute function public.log_production_task_event();

create or replace function public.reopen_parent_production_task()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'completed' and old.status is distinct from 'completed' and new.parent_task_id is not null then
    update public.manuscript_production_tasks
      set status = 'open'
      where id = new.parent_task_id;

    insert into public.manuscript_events (manuscript_id, actor_id, event_type, note)
    values (new.manuscript_id, new.assigned_to, 'production_task_returned', new.comments);
  end if;
  return new;
end;
$$;

drop trigger if exists reopen_parent_production_task on public.manuscript_production_tasks;
create trigger reopen_parent_production_task
  after update of status on public.manuscript_production_tasks
  for each row execute function public.reopen_parent_production_task();


-- ═══════════════════════════════════════════════════════════════════════════
-- VERIFICATION — CHIEF EDITOR & PRODUCTION PIPELINE
-- ═══════════════════════════════════════════════════════════════════════════
do $$
declare
  reviewers_policies integer;
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'profiles_role_check'
      and pg_get_constraintdef(oid) like '%chief_editor%'
  ) then
    raise exception 'FAIL: profiles_role_check does not permit chief_editor.';
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'manuscript_reviewers' and column_name = 'sequence'
  ) then
    raise exception 'FAIL: manuscript_reviewers.sequence column is missing.';
  end if;

  if not exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'manuscript_production_tasks'
  ) then
    raise exception 'FAIL: manuscript_production_tasks table is missing.';
  end if;

  if not coalesce((
    select relrowsecurity from pg_class where relname = 'manuscript_production_tasks'
  ), false) then
    raise exception 'FAIL: RLS is not enabled on manuscript_production_tasks.';
  end if;

  -- Only the chief-editor-managed policy should exist on manuscript_reviewers'
  -- write path — if the old broad "Staff manage reviewer assignments" policy
  -- is still present, regular editors could still assign reviewers.
  select count(*) into reviewers_policies
  from pg_policies
  where schemaname = 'public' and tablename = 'manuscript_reviewers' and cmd = 'ALL';
  if reviewers_policies <> 1 then
    raise exception 'FAIL: expected exactly 1 all-commands policy on manuscript_reviewers, found %.', reviewers_policies;
  end if;

  if not exists (select 1 from pg_trigger where tgname = 'log_production_task_event') then
    raise exception 'FAIL: log_production_task_event trigger missing.';
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'reopen_parent_production_task') then
    raise exception 'FAIL: reopen_parent_production_task trigger missing.';
  end if;

  raise notice 'OGENE: chief editor & production pipeline checks passed.';
end $$;


-- ═══════════════════════════════════════════════════════════════════════════
-- DEFERRED CLEANUP — read before running
--
-- The paywall is gone from the application, but these columns still exist and
-- still hold data. They are left in place deliberately: dropping columns in the
-- same change that removes the feature gives you nothing to roll back to.
-- Ship the open-access build, confirm it behaves, then run this block.
--
-- `subscriptions` is NOT dropped, now or later. It records money that real
-- people actually paid, which you may need for refunds, disputes or accounts.
-- It stays as a read-only historical record.
--
-- Uncomment and run once you are satisfied:
--
--   alter table public.articles drop column if exists is_premium;
--   alter table public.articles drop column if exists price;
--   alter table public.profiles drop column if exists is_premium;
--   alter table public.profiles drop column if exists premium_until;
--
-- Then remove the matching checks from guard_profile_privileges() above, and
-- delete the two profiles entries in the COLUMN MIGRATIONS block at the top —
-- otherwise re-running this file will helpfully add them straight back.
-- ═══════════════════════════════════════════════════════════════════════════
