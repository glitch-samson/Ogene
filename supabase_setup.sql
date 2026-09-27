-- OGENE — database bootstrap
--
-- Idempotent: safe to run against a fresh project OR re-run against the live
-- database. Every statement guards itself, so re-running repairs drift rather
-- than erroring.
--
-- Run in the Supabase SQL editor.

-- Enable UUID extension
create extension if not exists "uuid-ossp";


-- ═══════════════════════════════════════════════════════════════════════════
-- COLUMN MIGRATIONS (run first so later statements can rely on the columns)
-- ═══════════════════════════════════════════════════════════════════════════
do $$
begin
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'articles' and column_name = 'author_name') then
    alter table public.articles add column author_name text;
  end if;

  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'articles' and column_name = 'is_premium') then
    alter table public.articles add column is_premium boolean default false;
  end if;

  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'profiles' and column_name = 'is_premium') then
    alter table public.profiles add column is_premium boolean default false;
  end if;

  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'profiles' and column_name = 'premium_until') then
    alter table public.profiles add column premium_until timestamp with time zone;
  end if;
end $$;


-- ═══════════════════════════════════════════════════════════════════════════
-- TABLES
-- ═══════════════════════════════════════════════════════════════════════════

-- PROFILES (Users)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  avatar_url text,
  role text default 'user',
  is_premium boolean default false,
  premium_until timestamp with time zone,
  created_at timestamp with time zone default now()
);

-- Role vocabulary. Dropped and recreated so re-running widens an older
-- ('admin','user') constraint to include 'editor' without manual intervention.
--
-- Guarded first: adding a CHECK constraint that an existing row violates aborts
-- the statement, and because the SQL editor runs the whole file as one
-- transaction, that would roll back every policy below it — the exact failure
-- mode that left this database unprotected last time. Fail early with a message
-- that says what to fix instead.
update public.profiles set role = 'user' where role is null;

do $$
declare unexpected text;
begin
  select string_agg(distinct role, ', ')
  into unexpected
  from public.profiles
  where role not in ('admin', 'editor', 'reviewer', 'user');

  if unexpected is not null then
    raise exception
      'profiles contains unexpected role value(s): %. Reassign these to admin, editor, reviewer or user, then re-run.',
      unexpected;
  end if;
end $$;

alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check
  check (role in ('admin', 'editor', 'reviewer', 'user'));

-- ARTICLES
create table if not exists public.articles (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  description text,
  content_html text,
  price numeric default 0,           -- deprecated; removed when the paywall goes
  is_premium boolean default false,  -- deprecated; removed when the paywall goes
  file_path text,
  preview_path text,
  author_id uuid references public.profiles(id),
  author_name text,
  category text,
  is_public boolean default false,
  cover_image text,
  created_at timestamp with time zone default now()
);

-- SUBSCRIPTIONS
create table if not exists public.subscriptions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  amount numeric not null default 1500,
  start_date timestamp with time zone default now(),
  end_date timestamp with time zone not null,
  transaction_id text,
  created_at timestamp with time zone default now()
);

-- FAVOURITES
create table if not exists public.favourites (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  article_id uuid references public.articles(id) on delete cascade,
  created_at timestamp with time zone default now(),
  unique(user_id, article_id)
);

-- LIBRARY
create table if not exists public.library (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  article_id uuid references public.articles(id) on delete cascade,
  created_at timestamp with time zone default now(),
  unique(user_id, article_id)
);


-- ═══════════════════════════════════════════════════════════════════════════
-- MANUSCRIPT PIPELINE (peer review)
--
-- A manuscript is a pre-publication submission that moves through editorial
-- screening, double-blind review and revisions before an editor publishes it
-- into the existing `articles` table/bucket above. No parallel reading
-- infrastructure is created here — publication reuses ReadArticle, Library,
-- Favourites and the `articles` storage bucket unchanged.
-- ═══════════════════════════════════════════════════════════════════════════

-- MANUSCRIPTS
create table if not exists public.manuscripts (
  id uuid default uuid_generate_v4() primary key,
  submitting_author_id uuid references public.profiles(id) not null,
  title text not null,
  abstract text not null,
  category text,
  keywords text,
  cover_letter text,
  status text not null default 'submitted' check (status in (
    'submitted', 'desk_rejected', 'under_review', 'revisions_requested',
    'resubmitted', 'accepted', 'rejected', 'published'
  )),
  current_round int not null default 1,
  published_article_id uuid references public.articles(id),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Reverse link from a published article back to the manuscript it came from.
-- Added here, not in the COLUMN MIGRATIONS block above, because it references
-- manuscripts, which doesn't exist until this point in the script.
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'articles' and column_name = 'manuscript_id'
  ) then
    alter table public.articles add column manuscript_id uuid references public.manuscripts(id);
  end if;
end $$;

-- MANUSCRIPT FILES — versioned per revision round; never overwritten, so an
-- editor/reviewer comment can always be traced to the exact version it was
-- made against.
create table if not exists public.manuscript_files (
  id uuid default uuid_generate_v4() primary key,
  manuscript_id uuid references public.manuscripts(id) on delete cascade not null,
  round int not null,
  file_type text not null default 'manuscript' check (file_type in ('manuscript', 'response_to_reviewers')),
  file_path text not null,
  uploaded_by uuid references public.profiles(id) not null,
  created_at timestamp with time zone default now()
);

-- MANUSCRIPT REVIEWERS — assignment + verdict. comments_to_editor is
-- confidential and must never be exposed to the submitting author.
create table if not exists public.manuscript_reviewers (
  id uuid default uuid_generate_v4() primary key,
  manuscript_id uuid references public.manuscripts(id) on delete cascade not null,
  reviewer_id uuid references public.profiles(id) not null,
  round int not null default 1,
  assigned_by uuid references public.profiles(id) not null,
  assigned_at timestamp with time zone default now(),
  due_date date,
  status text not null default 'invited' check (status in ('invited', 'accepted', 'declined', 'completed')),
  recommendation text check (recommendation in ('accept', 'minor_revisions', 'major_revisions', 'reject')),
  comments_to_author text,
  comments_to_editor text,
  submitted_at timestamp with time zone,
  unique (manuscript_id, reviewer_id, round)
);

-- MANUSCRIPT EVENTS — append-only audit/timeline powering the status history
-- shown to both the author and editorial staff.
create table if not exists public.manuscript_events (
  id uuid default uuid_generate_v4() primary key,
  manuscript_id uuid references public.manuscripts(id) on delete cascade not null,
  actor_id uuid references public.profiles(id),
  event_type text not null,
  from_status text,
  to_status text,
  note text,
  created_at timestamp with time zone default now()
);

-- EDITORIAL BOARD — content for the public editorial board page/homepage
-- teaser. Deliberately not tied to `profiles`: board members are a content
-- concept, not necessarily logins.
create table if not exists public.editorial_board (
  id uuid default uuid_generate_v4() primary key,
  full_name text not null,
  title text,
  bio text,
  photo_url text,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamp with time zone default now()
);

-- SITE SETTINGS — small key/value store for homepage figures that can't be
-- honestly computed yet (e.g. impact factor, which needs citation tracking
-- Ogene doesn't have).
create table if not exists public.site_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamp with time zone default now()
);


-- ═══════════════════════════════════════════════════════════════════════════
-- HELPERS
-- ═══════════════════════════════════════════════════════════════════════════

-- Role lookups previously inlined `auth.uid() in (select id from profiles
-- where role = 'admin')` into every policy. That subquery reads `profiles`,
-- which is itself RLS-protected, so it depends on the reader's own visibility.
-- A security-definer function sidesteps that and keeps the policies readable.
create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin', 'editor')
  );
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- Reviewers are deliberately NOT staff — is_staff() above stays admin/editor
-- only, so a reviewer never gains editorial powers over manuscripts.
create or replace function public.is_reviewer()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'reviewer'
  );
$$;


-- ═══════════════════════════════════════════════════════════════════════════
-- PROFILE PROVISIONING
--
-- Replaces three racing client-side "create the profile if it's missing"
-- fallbacks. Runs as the database, so it works before the user's first request.
-- ═══════════════════════════════════════════════════════════════════════════
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Only id and full_name are taken from signup metadata. `role` is deliberately
  -- NOT read from raw_user_meta_data: that blob is attacker-controlled at signup,
  -- so trusting it would hand out admin to anyone who passed {"role":"admin"}.
  -- It falls to the column default of 'user'.
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- The trigger only fires for NEW signups. Anyone who registered before it
-- existed may have no profile row (the old client-side fallback could fail
-- silently), and dropping the client INSERT path below would strand them.
insert into public.profiles (id, full_name)
select u.id, u.raw_user_meta_data ->> 'full_name'
from auth.users u
on conflict (id) do nothing;


-- ═══════════════════════════════════════════════════════════════════════════
-- PRIVILEGE ESCALATION LOCKDOWN
--
-- Previously `profiles` had a single UPDATE policy — `using (auth.uid() = id)`
-- with no WITH CHECK and no column restriction. Since `role` lives on that row,
-- any signed-in user could run this from the browser console and become admin:
--
--   supabase.from('profiles').update({ role: 'admin' }).eq('id', myUserId)
--
-- Two independent layers now stop that. Either alone would suffice; both are
-- cheap, and the blast radius of this particular hole is the whole application.
-- ═══════════════════════════════════════════════════════════════════════════

-- Layer 1 — column privileges.
-- A table-level UPDATE grant implies every column, so it must be revoked before
-- a per-column grant means anything. Whitelist: users may edit only these.
revoke update on public.profiles from authenticated, anon;
grant update (full_name, avatar_url) on public.profiles to authenticated;

-- Layer 2 — a trigger, in case a future table-level grant silently re-widens
-- layer 1.
-- Deliberately SECURITY INVOKER (the default — note the absence of `security
-- definer` here, unlike the helpers above). SECURITY DEFINER would rebind
-- current_user to the function owner for the body's duration, so the check
-- below would read 'postgres' on every call and wave every update through.
-- This function needs no elevated privileges: it only compares NEW to OLD.
create or replace function public.guard_profile_privileges()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  -- PostgREST switches role per request, so current_user identifies the caller:
  -- 'authenticated'/'anon' for browser sessions, 'service_role' for Edge
  -- Functions and serverless, 'postgres' for the SQL editor. Only browsers are
  -- untrusted.
  if current_user not in ('authenticated', 'anon') then
    return new;
  end if;

  if new.role is distinct from old.role then
    raise exception 'profiles.role cannot be changed from a client session';
  end if;

  if new.is_premium is distinct from old.is_premium
     or new.premium_until is distinct from old.premium_until then
    raise exception 'entitlement columns cannot be changed from a client session';
  end if;

  if new.id is distinct from old.id then
    raise exception 'profiles.id is immutable';
  end if;

  return new;
end;
$$;

drop trigger if exists guard_profile_privileges on public.profiles;
create trigger guard_profile_privileges
  before update on public.profiles
  for each row execute function public.guard_profile_privileges();


-- ═══════════════════════════════════════════════════════════════════════════
-- MANUSCRIPT CLIENT-UPDATE LOCKDOWN
--
-- Postgres has no per-app-role grant: every signed-in session — author,
-- reviewer, editor, admin alike — reaches the database as the single
-- `authenticated` role, so a column-level GRANT can't be scoped to "editors
-- only" the way it can be scoped to "browsers" vs "the SQL editor" in the
-- profiles lockdown above. The grant below therefore has to stay wide enough
-- for staff to do their job, and public.is_staff() inside the trigger becomes
-- the actual enforcement point, not a backup layer.
--
-- An author may edit their own manuscript's metadata and, in one specific
-- case, its status: when an editor has requested revisions and the author
-- re-uploads, that is a legitimate client-driven transition. Staff may change
-- anything, including current_round and published_article_id, as part of
-- desk-reject / send-to-review / decision / publish actions.
-- ═══════════════════════════════════════════════════════════════════════════

revoke update on public.manuscripts from authenticated, anon;
grant update (title, abstract, category, keywords, cover_letter, status, current_round, published_article_id)
  on public.manuscripts to authenticated;

create or replace function public.guard_manuscript_client_update()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if current_user not in ('authenticated', 'anon') then
    return new;
  end if;

  if public.is_staff() then
    return new;
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

drop trigger if exists guard_manuscript_client_update on public.manuscripts;
create trigger guard_manuscript_client_update
  before update on public.manuscripts
  for each row execute function public.guard_manuscript_client_update();


-- ═══════════════════════════════════════════════════════════════════════════
-- REVIEWER ASSIGNMENT LOCKDOWN
--
-- Without this, a reviewer holding column-scoped UPDATE on their own verdict
-- fields could still rewrite manuscript_id/reviewer_id on their row to point
-- at a different manuscript or hand their assignment to someone else. Locked
-- the same way: revoke the table grant, whitelist the verdict columns, then a
-- trigger blocks the assignment fields specifically.
-- ═══════════════════════════════════════════════════════════════════════════

revoke update on public.manuscript_reviewers from authenticated, anon;
grant update (status, recommendation, comments_to_author, comments_to_editor, submitted_at)
  on public.manuscript_reviewers to authenticated;

create or replace function public.guard_reviewer_assignment()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if current_user not in ('authenticated', 'anon') then
    return new;
  end if;

  if new.manuscript_id is distinct from old.manuscript_id
     or new.reviewer_id is distinct from old.reviewer_id
     or new.assigned_by is distinct from old.assigned_by
     or new.round is distinct from old.round
     or new.due_date is distinct from old.due_date then
    raise exception 'manuscript_reviewers assignment fields cannot be changed from a client session';
  end if;

  return new;
end;
$$;

drop trigger if exists guard_reviewer_assignment on public.manuscript_reviewers;
create trigger guard_reviewer_assignment
  before update on public.manuscript_reviewers
  for each row execute function public.guard_reviewer_assignment();


-- ═══════════════════════════════════════════════════════════════════════════
-- MANUSCRIPT EVENT LOGGING (automatic)
--
-- manuscript_events has no client INSERT policy at all (see below) — every row
-- is written here, by the database, from the actual state transition that
-- just happened. This is deliberately stronger than trusting a client to call
-- a second insert after its first one succeeds: a dropped network request
-- after the manuscript insert would otherwise leave a manuscript with no
-- "submitted" event and a timeline that silently starts blank.
--
-- All three functions are SECURITY DEFINER: manuscript_events grants no
-- INSERT to authenticated/anon, so an author's own submission still needs to
-- reach this table, which only a definer-privileged function can do.
-- ═══════════════════════════════════════════════════════════════════════════

create or replace function public.log_manuscript_status_event()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.manuscript_events (manuscript_id, actor_id, event_type, from_status, to_status)
    values (new.id, new.submitting_author_id, 'submitted', null, new.status);
  elsif tg_op = 'UPDATE' and new.status is distinct from old.status then
    insert into public.manuscript_events (manuscript_id, actor_id, event_type, from_status, to_status)
    values (new.id, auth.uid(), new.status, old.status, new.status);
  end if;
  return new;
end;
$$;

drop trigger if exists log_manuscript_status_event on public.manuscripts;
create trigger log_manuscript_status_event
  after insert or update of status on public.manuscripts
  for each row execute function public.log_manuscript_status_event();

create or replace function public.log_reviewer_assignment_event()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.manuscript_events (manuscript_id, actor_id, event_type)
  values (new.manuscript_id, new.assigned_by, 'reviewer_assigned');
  return new;
end;
$$;

drop trigger if exists log_reviewer_assignment_event on public.manuscript_reviewers;
create trigger log_reviewer_assignment_event
  after insert on public.manuscript_reviewers
  for each row execute function public.log_reviewer_assignment_event();

create or replace function public.log_review_submitted_event()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'completed' and old.status is distinct from 'completed' then
    insert into public.manuscript_events (manuscript_id, actor_id, event_type, note)
    values (new.manuscript_id, new.reviewer_id, 'review_submitted', new.recommendation);
  end if;
  return new;
end;
$$;

drop trigger if exists log_review_submitted_event on public.manuscript_reviewers;
create trigger log_review_submitted_event
  after update of status on public.manuscript_reviewers
  for each row execute function public.log_review_submitted_event();


-- ═══════════════════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY
--
-- NOTE: the previous version of this file ran `alter table purchases enable row
-- level security` against a table whose CREATE had been deleted. In the SQL
-- editor the whole script runs as one transaction, so that line aborted it and
-- rolled back EVERY policy below it — leaving articles and profiles with RLS
-- enabled and no policies at all. The orphaned purchases block is gone.
-- ═══════════════════════════════════════════════════════════════════════════

alter table public.profiles      enable row level security;
alter table public.articles      enable row level security;
alter table public.subscriptions enable row level security;
alter table public.favourites    enable row level security;
alter table public.library       enable row level security;
alter table public.manuscripts          enable row level security;
alter table public.manuscript_files     enable row level security;
alter table public.manuscript_reviewers enable row level security;
alter table public.manuscript_events    enable row level security;
alter table public.editorial_board      enable row level security;
alter table public.site_settings        enable row level security;

-- ── Profiles ───────────────────────────────────────────────────────────────
drop policy if exists "Public profiles are viewable by everyone." on public.profiles;
create policy "Public profiles are viewable by everyone."
  on public.profiles for select using (true);

drop policy if exists "Users can update own profile." on public.profiles;
create policy "Users can update own profile."
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);   -- WITH CHECK was missing; without it the
                                  -- post-update row was never re-validated.

-- No client INSERT path, by design.
--
-- The old policy was `with check (auth.uid() = id)`, which validated the id but
-- said nothing about the other columns — so a user with no profile row yet could
-- insert {id: me, role: 'admin'} and self-promote. Revoking UPDATE on `role`
-- alone would not have closed that; it would just have moved the hole from
-- UPDATE to INSERT.
--
-- Profiles are now created exclusively by the on_auth_user_created trigger
-- above, which runs as the database and never reads a client-supplied role.
drop policy if exists "New users can insert their profile" on public.profiles;
revoke insert on public.profiles from authenticated, anon;

-- ── Articles ───────────────────────────────────────────────────────────────
drop policy if exists "Articles are viewable by everyone if public" on public.articles;
create policy "Articles are viewable by everyone if public"
  on public.articles for select using (is_public = true or public.is_staff());

drop policy if exists "Admins can insert articles" on public.articles;
create policy "Admins can insert articles"
  on public.articles for insert with check (public.is_staff());

drop policy if exists "Admins can update articles" on public.articles;
create policy "Admins can update articles"
  on public.articles for update using (public.is_staff()) with check (public.is_staff());

drop policy if exists "Admins can delete articles" on public.articles;
create policy "Admins can delete articles"
  on public.articles for delete using (public.is_admin());

-- ── Subscriptions ──────────────────────────────────────────────────────────
drop policy if exists "Users can see own subscriptions" on public.subscriptions;
create policy "Users can see own subscriptions"
  on public.subscriptions for select using (auth.uid() = user_id or public.is_staff());

-- Deliberately NO insert policy for clients. The browser used to write its own
-- subscription row after a payment it alone judged successful. Subscription
-- writes belong to a server-side verifier holding the service-role key.

-- ── Favourites ─────────────────────────────────────────────────────────────
drop policy if exists "Users can view own favourites" on public.favourites;
create policy "Users can view own favourites"
  on public.favourites for select using (auth.uid() = user_id);

drop policy if exists "Users can add favourites" on public.favourites;
create policy "Users can add favourites"
  on public.favourites for insert with check (auth.uid() = user_id);

drop policy if exists "Users can remove favourites" on public.favourites;
create policy "Users can remove favourites"
  on public.favourites for delete using (auth.uid() = user_id);

-- ── Library ────────────────────────────────────────────────────────────────
drop policy if exists "Users can view own library" on public.library;
create policy "Users can view own library"
  on public.library for select using (auth.uid() = user_id);

drop policy if exists "Users can add to library" on public.library;
create policy "Users can add to library"
  on public.library for insert with check (auth.uid() = user_id);

drop policy if exists "Users can remove from library" on public.library;
create policy "Users can remove from library"
  on public.library for delete using (auth.uid() = user_id);

-- ── Manuscripts ────────────────────────────────────────────────────────────
-- Reviewers get NO policy here at all, by design — their only path to a
-- manuscript's content is the manuscript_review_queue view below, which never
-- exposes submitting_author_id/author identity, so there is no row-level
-- grant that could leak it.
drop policy if exists "Authors and staff can view manuscripts" on public.manuscripts;
create policy "Authors and staff can view manuscripts"
  on public.manuscripts for select
  using (submitting_author_id = auth.uid() or public.is_staff());

drop policy if exists "Authors can submit manuscripts" on public.manuscripts;
create policy "Authors can submit manuscripts"
  on public.manuscripts for insert
  with check (submitting_author_id = auth.uid());

drop policy if exists "Authors and staff can update manuscripts" on public.manuscripts;
create policy "Authors and staff can update manuscripts"
  on public.manuscripts for update
  using (submitting_author_id = auth.uid() or public.is_staff())
  with check (submitting_author_id = auth.uid() or public.is_staff());

-- ── Manuscript Files ───────────────────────────────────────────────────────
-- Reviewers get no direct table policy either — file access during review
-- goes through the 'manuscripts' storage bucket policy below, gated on an
-- accepted assignment, not through this table.
drop policy if exists "Staff full access to manuscript files" on public.manuscript_files;
create policy "Staff full access to manuscript files"
  on public.manuscript_files for all
  using (public.is_staff()) with check (public.is_staff());

drop policy if exists "Authors view own manuscript files" on public.manuscript_files;
create policy "Authors view own manuscript files"
  on public.manuscript_files for select
  using (exists (
    select 1 from public.manuscripts m
    where m.id = manuscript_id and m.submitting_author_id = auth.uid()
  ));

drop policy if exists "Authors upload own manuscript files" on public.manuscript_files;
create policy "Authors upload own manuscript files"
  on public.manuscript_files for insert
  with check (
    uploaded_by = auth.uid()
    and exists (
      select 1 from public.manuscripts m
      where m.id = manuscript_id
        and m.submitting_author_id = auth.uid()
        and m.status in ('submitted', 'revisions_requested')
    )
  );

-- ── Manuscript Reviewers ───────────────────────────────────────────────────
drop policy if exists "Staff manage reviewer assignments" on public.manuscript_reviewers;
create policy "Staff manage reviewer assignments"
  on public.manuscript_reviewers for all
  using (public.is_staff()) with check (public.is_staff());

drop policy if exists "Reviewers view own assignments" on public.manuscript_reviewers;
create policy "Reviewers view own assignments"
  on public.manuscript_reviewers for select
  using (reviewer_id = auth.uid());

drop policy if exists "Reviewers update own verdict" on public.manuscript_reviewers;
create policy "Reviewers update own verdict"
  on public.manuscript_reviewers for update
  using (reviewer_id = auth.uid())
  with check (reviewer_id = auth.uid());

-- ── Manuscript Events ──────────────────────────────────────────────────────
drop policy if exists "Staff manage manuscript events" on public.manuscript_events;
create policy "Staff manage manuscript events"
  on public.manuscript_events for all
  using (public.is_staff()) with check (public.is_staff());

drop policy if exists "Authors view own manuscript events" on public.manuscript_events;
create policy "Authors view own manuscript events"
  on public.manuscript_events for select
  using (exists (
    select 1 from public.manuscripts m
    where m.id = manuscript_id and m.submitting_author_id = auth.uid()
  ));

-- No client INSERT path, by design — same reasoning as profiles. Every event
-- is generated by the triggers below, from the database's own view of what
-- changed, not from a client's claim about what happened.

-- ── Editorial Board ────────────────────────────────────────────────────────
drop policy if exists "Editorial board is public" on public.editorial_board;
create policy "Editorial board is public"
  on public.editorial_board for select using (true);

drop policy if exists "Staff manage editorial board" on public.editorial_board;
create policy "Staff manage editorial board"
  on public.editorial_board for all
  using (public.is_staff()) with check (public.is_staff());

-- ── Site Settings ──────────────────────────────────────────────────────────
drop policy if exists "Site settings are public" on public.site_settings;
create policy "Site settings are public"
  on public.site_settings for select using (true);

drop policy if exists "Staff manage site settings" on public.site_settings;
create policy "Staff manage site settings"
  on public.site_settings for all
  using (public.is_staff()) with check (public.is_staff());


-- ═══════════════════════════════════════════════════════════════════════════
-- DOUBLE-BLIND VIEWS
--
-- RLS is row-level, not column-level: a reviewer who could see a manuscripts
-- row at all would see every column their grant covers, including
-- submitting_author_id. Reviewers are given NO policy on manuscripts,
-- manuscript_files or manuscript_reviewers above — their only path in is
-- through the views below.
--
-- These views are created by the same role that owns the underlying tables
-- (postgres, via the SQL editor). A view with no `security_invoker` option
-- (the default) executes with its OWNER's privileges, so it bypasses RLS on
-- the base tables entirely — the view's own WHERE clause becomes the only
-- access control. Author/reviewer identity columns are simply never selected,
-- so there is no column left for a future policy bug to leak.
-- ═══════════════════════════════════════════════════════════════════════════

create or replace view public.manuscript_review_queue as
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
  mr.status as assignment_status,
  mr.due_date,
  mr.recommendation,
  mr.comments_to_author,
  mr.comments_to_editor,
  mf.file_path
from public.manuscripts m
join public.manuscript_reviewers mr on mr.manuscript_id = m.id
left join public.manuscript_files mf on mf.manuscript_id = m.id and mf.round = mr.round
where mr.reviewer_id = auth.uid();

revoke all on public.manuscript_review_queue from public, anon;
grant select on public.manuscript_review_queue to authenticated;

-- Author-facing view: reviewer identity is replaced with a synthetic
-- "Reviewer 1" / "Reviewer 2" number and comments_to_editor (confidential) is
-- excluded entirely — only ever visible to staff via the raw table.
create or replace view public.manuscript_review_feedback as
select
  mr.manuscript_id,
  dense_rank() over (partition by mr.manuscript_id, mr.round order by mr.assigned_at) as reviewer_number,
  mr.round,
  mr.status,
  mr.recommendation,
  mr.comments_to_author,
  mr.submitted_at
from public.manuscript_reviewers mr
join public.manuscripts m on m.id = mr.manuscript_id
where mr.status = 'completed'
  and (m.submitting_author_id = auth.uid() or public.is_staff());

revoke all on public.manuscript_review_feedback from public, anon;
grant select on public.manuscript_review_feedback to authenticated;


-- ═══════════════════════════════════════════════════════════════════════════
-- STORAGE
-- ═══════════════════════════════════════════════════════════════════════════

insert into storage.buckets (id, name, public)
values ('articles', 'articles', false)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('covers', 'covers', true)
on conflict (id) do nothing;

-- Covers: public read, staff write
drop policy if exists "Covers Public Read" on storage.objects;
create policy "Covers Public Read"
  on storage.objects for select using (bucket_id = 'covers');

drop policy if exists "Covers Admin Write" on storage.objects;
create policy "Covers Admin Write"
  on storage.objects for insert with check (bucket_id = 'covers' and public.is_staff());

-- Article files — OPEN ACCESS.
--
-- Anything attached to a published article is readable by anyone, signed in or
-- not. Entitlement no longer enters into it; the only distinction is published
-- vs. not-yet-published, so unreleased work stays with staff until it is out.
drop policy if exists "Articles Admin All" on storage.objects;
drop policy if exists "Articles Access" on storage.objects;
create policy "Articles Access"
  on storage.objects for select using (
    bucket_id = 'articles' and (
      public.is_staff()
      or name in (select file_path from public.articles where is_public = true)
    )
  );

drop policy if exists "Articles Admin Write" on storage.objects;
create policy "Articles Admin Write"
  on storage.objects for insert with check (bucket_id = 'articles' and public.is_staff());

drop policy if exists "Articles Admin Update" on storage.objects;
create policy "Articles Admin Update"
  on storage.objects for update using (bucket_id = 'articles' and public.is_staff());

drop policy if exists "Articles Admin Delete" on storage.objects;
create policy "Articles Admin Delete"
  on storage.objects for delete using (bucket_id = 'articles' and public.is_admin());

-- Manuscripts bucket — private. Path convention: {manuscript_id}/round-{n}/…
-- so the object name itself never contains the author's name, and reviewer
-- access depends only on an accepted assignment row, not a separate flag that
-- could drift out of sync.
insert into storage.buckets (id, name, public)
values ('manuscripts', 'manuscripts', false)
on conflict (id) do nothing;

drop policy if exists "Manuscript files staff access" on storage.objects;
create policy "Manuscript files staff access"
  on storage.objects for all
  using (bucket_id = 'manuscripts' and public.is_staff())
  with check (bucket_id = 'manuscripts' and public.is_staff());

drop policy if exists "Manuscript files author read" on storage.objects;
create policy "Manuscript files author read"
  on storage.objects for select
  using (
    bucket_id = 'manuscripts' and exists (
      select 1 from public.manuscript_files mf
      join public.manuscripts m on m.id = mf.manuscript_id
      where mf.file_path = name and m.submitting_author_id = auth.uid()
    )
  );

drop policy if exists "Manuscript files author upload" on storage.objects;
create policy "Manuscript files author upload"
  on storage.objects for insert
  with check (
    bucket_id = 'manuscripts' and exists (
      select 1 from public.manuscripts m
      where m.submitting_author_id = auth.uid()
        and name like m.id::text || '/%'
    )
  );

drop policy if exists "Manuscript files reviewer read" on storage.objects;
create policy "Manuscript files reviewer read"
  on storage.objects for select
  using (
    bucket_id = 'manuscripts' and exists (
      select 1 from public.manuscript_files mf
      join public.manuscript_reviewers mr on mr.manuscript_id = mf.manuscript_id
      where mf.file_path = name
        and mr.reviewer_id = auth.uid()
        and mr.status in ('accepted', 'completed')
    )
  );


-- ═══════════════════════════════════════════════════════════════════════════
-- VERIFICATION
--
-- Raises if anything above failed to take effect. Look for "OGENE: all checks
-- passed" in the SQL editor output — if you do not see it, something is wrong
-- and the security fixes are NOT in place.
-- ═══════════════════════════════════════════════════════════════════════════
do $$
declare
  table_level_update  boolean;
  can_insert          boolean;
  policy_count        integer;
  manuscripts_policies integer;
begin
  -- 1. `authenticated` must NOT hold a blanket UPDATE on profiles; a table-level
  --    grant implies every column, including role.
  select has_table_privilege('authenticated', 'public.profiles', 'UPDATE')
    into table_level_update;
  if table_level_update then
    raise exception 'FAIL: authenticated still holds table-level UPDATE on profiles — role is writable.';
  end if;

  -- 2. But the whitelisted columns must still work, or users cannot edit their name.
  if not has_column_privilege('authenticated', 'public.profiles', 'full_name', 'UPDATE') then
    raise exception 'FAIL: authenticated cannot update profiles.full_name — the profile form is broken.';
  end if;

  -- 3. No client INSERT path into profiles.
  select has_table_privilege('authenticated', 'public.profiles', 'INSERT')
    into can_insert;
  if can_insert then
    raise exception 'FAIL: authenticated can still INSERT into profiles — self-promotion via insert is open.';
  end if;

  -- 4. Both triggers present.
  if not exists (select 1 from pg_trigger where tgname = 'on_auth_user_created') then
    raise exception 'FAIL: on_auth_user_created missing — new signups will have no profile.';
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'guard_profile_privileges') then
    raise exception 'FAIL: guard_profile_privileges missing.';
  end if;

  -- 5. Policies actually landed. The old script aborted partway and left tables
  --    with RLS enabled and zero policies, which is what made this necessary.
  select count(*) into policy_count
  from pg_policies
  where schemaname = 'public'
    and tablename in ('profiles', 'articles', 'favourites', 'library', 'subscriptions');
  if policy_count < 12 then
    raise exception 'FAIL: only % policies found on public tables; expected 12+. Script did not complete.', policy_count;
  end if;

  -- 6. Every profile has a valid role.
  if exists (select 1 from public.profiles where role not in ('admin', 'editor', 'reviewer', 'user')) then
    raise exception 'FAIL: profiles contains an invalid role.';
  end if;

  -- 7. 'reviewer' is accepted by the widened role constraint.
  if not exists (
    select 1 from pg_constraint
    where conname = 'profiles_role_check'
      and pg_get_constraintdef(oid) like '%reviewer%'
  ) then
    raise exception 'FAIL: profiles_role_check does not permit the reviewer role.';
  end if;

  -- 8. RLS is enabled on every manuscript-pipeline table.
  if exists (
    select t.tablename
    from pg_tables t
    left join pg_class c on c.relname = t.tablename
    left join pg_namespace n on n.oid = c.relnamespace and n.nspname = t.schemaname
    where t.schemaname = 'public'
      and t.tablename in ('manuscripts', 'manuscript_files', 'manuscript_reviewers',
                           'manuscript_events', 'editorial_board', 'site_settings')
      and coalesce(c.relrowsecurity, false) = false
  ) then
    raise exception 'FAIL: RLS is not enabled on one or more manuscript-pipeline tables.';
  end if;

  -- 9. The double-blind views exist.
  if not exists (select 1 from information_schema.views where table_schema = 'public' and table_name = 'manuscript_review_queue') then
    raise exception 'FAIL: manuscript_review_queue view is missing.';
  end if;
  if not exists (select 1 from information_schema.views where table_schema = 'public' and table_name = 'manuscript_review_feedback') then
    raise exception 'FAIL: manuscript_review_feedback view is missing.';
  end if;

  -- 10. Reviewer isolation on manuscripts. There is no dedicated Postgres role
  --     per app-role (every signed-in user is 'authenticated'), so double-blind
  --     hinges entirely on manuscripts carrying no policy a non-author,
  --     non-staff row could satisfy. Pin the policy count so a manual add
  --     doesn't silently widen reviewer access to the base table.
  select count(*) into manuscripts_policies
  from pg_policies
  where schemaname = 'public' and tablename = 'manuscripts';
  if manuscripts_policies <> 3 then
    raise exception 'FAIL: expected exactly 3 policies on manuscripts, found %. Reviewer isolation depends on no additional policy existing.', manuscripts_policies;
  end if;

  -- 11. Automatic event-logging triggers are present. manuscript_events has no
  --     client INSERT policy, so a missing trigger here means the pipeline
  --     silently stops recording its own history.
  if not exists (select 1 from pg_trigger where tgname = 'log_manuscript_status_event') then
    raise exception 'FAIL: log_manuscript_status_event trigger missing.';
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'log_reviewer_assignment_event') then
    raise exception 'FAIL: log_reviewer_assignment_event trigger missing.';
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'log_review_submitted_event') then
    raise exception 'FAIL: log_review_submitted_event trigger missing.';
  end if;

  raise notice 'OGENE: all checks passed — % policies active on public tables.', policy_count;
end $$;


-- ═══════════════════════════════════════════════════════════════════════════
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
-- PUBLIC JOURNAL STATS (homepage)
--
-- Real, computed numbers for the homepage stats strip — never a fabricated
-- "impact factor" or similar. Acceptance rate and decision time are derived
-- from actual manuscript history; anything that can't be honestly computed
-- (e.g. a citation-based impact factor) belongs in site_settings as a
-- manually-set, clearly-labeled figure instead, not invented here.
-- ═══════════════════════════════════════════════════════════════════════════
create or replace function public.journal_stats()
returns table(published_count bigint, acceptance_rate numeric, avg_decision_days numeric)
language sql
stable
security definer
set search_path = public
as $$
  select
    (select count(*) from public.articles where is_public = true) as published_count,
    (
      select round(
        100.0 * count(*) filter (where status in ('in_production', 'ready_for_final_approval', 'published'))
        / nullif(count(*) filter (where status in ('desk_rejected', 'rejected', 'in_production', 'ready_for_final_approval', 'published')), 0)
      , 1)
      from public.manuscripts
    ) as acceptance_rate,
    (
      -- Time from submission to the first post-review status (accept-track or
      -- rejected), not to eventual publish — production time isn't review time.
      select round(avg(extract(epoch from (decided_at - submitted_at)) / 86400)::numeric, 1)
      from (
        select
          manuscript_id,
          min(created_at) filter (where event_type = 'submitted') as submitted_at,
          min(created_at) filter (where to_status in ('desk_rejected', 'rejected', 'in_production', 'ready_for_final_approval', 'published')) as decided_at
        from public.manuscript_events
        group by manuscript_id
      ) decision_times
      where decided_at is not null
    ) as avg_decision_days;
$$;

grant execute on function public.journal_stats() to anon, authenticated;

do $$
begin
  if not exists (select 1 from pg_proc where proname = 'journal_stats') then
    raise exception 'FAIL: journal_stats() function is missing.';
  end if;
  raise notice 'OGENE: journal_stats() ready.';
end $$;


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
