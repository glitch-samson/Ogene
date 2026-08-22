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
  where role not in ('admin', 'editor', 'user');

  if unexpected is not null then
    raise exception
      'profiles contains unexpected role value(s): %. Reassign these to admin, editor or user, then re-run.',
      unexpected;
  end if;
end $$;

alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check
  check (role in ('admin', 'editor', 'user'));

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


-- ═══════════════════════════════════════════════════════════════════════════
-- VERIFICATION
--
-- Raises if anything above failed to take effect. Look for "OGENE: all checks
-- passed" in the SQL editor output — if you do not see it, something is wrong
-- and the security fixes are NOT in place.
-- ═══════════════════════════════════════════════════════════════════════════
do $$
declare
  table_level_update boolean;
  can_insert         boolean;
  policy_count       integer;
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
  if exists (select 1 from public.profiles where role not in ('admin', 'editor', 'user')) then
    raise exception 'FAIL: profiles contains an invalid role.';
  end if;

  raise notice 'OGENE: all checks passed — % policies active on public tables.', policy_count;
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
