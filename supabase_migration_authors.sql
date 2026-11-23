-- ═══════════════════════════════════════════════════════════════════════════
-- AUTHORS, CO-AUTHORS & PUBLIC AUTHOR CARDS
--
-- Same section as in supabase_setup.sql — paste-once copy for an existing
-- database. Idempotent: safe to re-run.
--
-- Model
--   authors            one row per person, with or without a login account.
--                      Public: name, photo, affiliation, ORCID, LinkedIn.
--   author_private     email settings. Never publicly readable — the only way
--                      an email leaves the database is author_card(), and only
--                      when the author switched show_email on.
--   article_authors    ordered author list per published article, with the
--                      corresponding-author flag and CRediT contribution roles.
--   manuscript_authors the same list while a manuscript is in the pipeline.
--                      Reviewers get no policy here: the review is double-blind.
-- ═══════════════════════════════════════════════════════════════════════════

-- ── Article columns ────────────────────────────────────────────────────────
alter table public.articles add column if not exists keywords text[];
alter table public.articles add column if not exists view_count integer not null default 0;
-- Reference list shown on the article page's References tab, one entry per
-- reference ("references" is an SQL keyword, hence reference_list). Authors
-- supply it at submission; it is copied onto the article at publish.
alter table public.articles add column if not exists reference_list text[];
alter table public.manuscripts add column if not exists reference_list text[];

-- Carry keywords over from the manuscript for articles published before the
-- publish step copied them.
update public.articles a
set keywords = (
  select array_agg(k)
  from unnest(regexp_split_to_array(trim(m.keywords), '\s*[,;]\s*')) as k
  where k <> ''
)
from public.manuscripts m
where a.manuscript_id = m.id
  and a.keywords is null
  and coalesce(trim(m.keywords), '') <> '';


-- ── Tables ─────────────────────────────────────────────────────────────────
create table if not exists public.authors (
  id uuid default uuid_generate_v4() primary key,
  profile_id uuid unique references public.profiles(id) on delete set null,
  full_name text not null check (length(trim(full_name)) > 0),
  avatar_url text,
  affiliation text,
  orcid text,
  linkedin_url text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);
create index if not exists authors_full_name_idx on public.authors (lower(full_name));

create table if not exists public.author_private (
  author_id uuid primary key references public.authors(id) on delete cascade,
  display_email text,
  show_email boolean not null default false,
  updated_at timestamp with time zone default now()
);

create table if not exists public.article_authors (
  article_id uuid not null references public.articles(id) on delete cascade,
  author_id uuid not null references public.authors(id) on delete cascade,
  position integer not null default 0,
  is_corresponding boolean not null default false,
  contributions text[] not null default '{}',
  primary key (article_id, author_id)
);
create index if not exists article_authors_author_idx on public.article_authors (author_id);

create table if not exists public.manuscript_authors (
  manuscript_id uuid not null references public.manuscripts(id) on delete cascade,
  author_id uuid not null references public.authors(id) on delete cascade,
  position integer not null default 0,
  is_corresponding boolean not null default false,
  contributions text[] not null default '{}',
  primary key (manuscript_id, author_id)
);
create index if not exists manuscript_authors_author_idx on public.manuscript_authors (author_id);

alter table public.authors            enable row level security;
alter table public.author_private     enable row level security;
alter table public.article_authors    enable row level security;
alter table public.manuscript_authors enable row level security;

-- Email settings are never readable by anonymous visitors, even as an empty
-- result — belt and braces on top of RLS.
revoke all on public.author_private from anon;


-- ── Policies: authors ──────────────────────────────────────────────────────
drop policy if exists "Authors are public" on public.authors;
create policy "Authors are public"
  on public.authors for select using (true);

drop policy if exists "Staff create authors" on public.authors;
create policy "Staff create authors"
  on public.authors for insert with check (public.is_staff());

drop policy if exists "Staff update authors" on public.authors;
create policy "Staff update authors"
  on public.authors for update
  using (public.is_staff()) with check (public.is_staff());

drop policy if exists "Admins delete authors" on public.authors;
create policy "Admins delete authors"
  on public.authors for delete using (public.is_admin());

-- A signed-in user may create their own card, or an account-less person they
-- are listing as a co-author.
drop policy if exists "Users create own or co-author cards" on public.authors;
create policy "Users create own or co-author cards"
  on public.authors for insert
  with check (
    created_by = auth.uid()
    and (profile_id = auth.uid() or profile_id is null)
  );

-- Users edit their own card; they may also fix an account-less co-author they
-- created, but only until that person appears on a published article.
drop policy if exists "Users update own card" on public.authors;
create policy "Users update own card"
  on public.authors for update
  using (
    profile_id = auth.uid()
    or (
      profile_id is null and created_by = auth.uid()
      and not exists (select 1 from public.article_authors aa where aa.author_id = authors.id)
    )
  )
  with check (profile_id = auth.uid() or profile_id is null);

-- Deliberately SECURITY INVOKER, like guard_profile_privileges(): it only
-- compares NEW to OLD, and current_user must stay the caller's role.
create or replace function public.guard_author_identity()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at := now();

  if current_user not in ('authenticated', 'anon') or public.is_staff() then
    return new;
  end if;

  if new.profile_id is distinct from old.profile_id then
    raise exception 'authors.profile_id can only be changed by staff';
  end if;
  if new.created_by is distinct from old.created_by then
    raise exception 'authors.created_by is immutable';
  end if;

  return new;
end;
$$;

drop trigger if exists guard_author_identity on public.authors;
create trigger guard_author_identity
  before update on public.authors
  for each row execute function public.guard_author_identity();


-- ── Policies: author_private (owner + staff only) ──────────────────────────
drop policy if exists "Owner and staff manage email settings" on public.author_private;
create policy "Owner and staff manage email settings"
  on public.author_private for all
  using (
    public.is_staff() or exists (
      select 1 from public.authors a
      where a.id = author_id and a.profile_id = auth.uid()
    )
  )
  with check (
    public.is_staff() or exists (
      select 1 from public.authors a
      where a.id = author_id and a.profile_id = auth.uid()
    )
  );


-- ── Policies: article_authors ──────────────────────────────────────────────
drop policy if exists "Public article authors are public" on public.article_authors;
create policy "Public article authors are public"
  on public.article_authors for select
  using (
    public.is_staff() or exists (
      select 1 from public.articles ar
      where ar.id = article_id and ar.is_public = true
    )
  );

drop policy if exists "Staff manage article authors" on public.article_authors;
create policy "Staff manage article authors"
  on public.article_authors for all
  using (public.is_staff()) with check (public.is_staff());


-- ── Policies: manuscript_authors ───────────────────────────────────────────
-- No reviewer policy, by design (double-blind review).
drop policy if exists "Staff manage manuscript authors" on public.manuscript_authors;
create policy "Staff manage manuscript authors"
  on public.manuscript_authors for all
  using (public.is_staff()) with check (public.is_staff());

drop policy if exists "Submitter views manuscript authors" on public.manuscript_authors;
create policy "Submitter views manuscript authors"
  on public.manuscript_authors for select
  using (exists (
    select 1 from public.manuscripts m
    where m.id = manuscript_id and m.submitting_author_id = auth.uid()
  ));

drop policy if exists "Submitter edits manuscript authors" on public.manuscript_authors;
create policy "Submitter edits manuscript authors"
  on public.manuscript_authors for all
  using (exists (
    select 1 from public.manuscripts m
    where m.id = manuscript_id
      and m.submitting_author_id = auth.uid()
      and m.status in ('submitted', 'revisions_requested')
  ))
  with check (exists (
    select 1 from public.manuscripts m
    where m.id = manuscript_id
      and m.submitting_author_id = auth.uid()
      and m.status in ('submitted', 'revisions_requested')
  ));


-- ── Functions ──────────────────────────────────────────────────────────────

-- Returns the author card id for a registered user, creating it from their
-- profile on first use. Used when a submitter adds a registered co-author and
-- when the profile page opens the "Your author card" form.
create or replace function public.ensure_author_for_profile(p_profile_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Sign in required';
  end if;

  select id into v_id from public.authors where profile_id = p_profile_id;
  if v_id is not null then
    return v_id;
  end if;

  insert into public.authors (profile_id, full_name, avatar_url, created_by)
  select p.id, coalesce(nullif(trim(p.full_name), ''), 'Unnamed author'), p.avatar_url, auth.uid()
  from public.profiles p
  where p.id = p_profile_id
  on conflict (profile_id) do nothing
  returning id into v_id;

  if v_id is null then
    select id into v_id from public.authors where profile_id = p_profile_id;
  end if;
  if v_id is null then
    raise exception 'Profile % not found', p_profile_id;
  end if;
  return v_id;
end;
$$;

revoke execute on function public.ensure_author_for_profile(uuid) from public, anon;
grant execute on function public.ensure_author_for_profile(uuid) to authenticated;

-- Everything the hover card shows, in one call. The email is the ONLY path out
-- of author_private and is returned only when show_email is on: the display
-- email if set, otherwise the account (login) email.
create or replace function public.author_card(p_author_id uuid, p_article_id uuid default null)
returns json
language sql
stable
security definer
set search_path = public
as $$
  select json_build_object(
    'id', a.id,
    'full_name', a.full_name,
    'avatar_url', coalesce(a.avatar_url, p.avatar_url),
    'affiliation', a.affiliation,
    'orcid', a.orcid,
    'linkedin_url', a.linkedin_url,
    'has_account', a.profile_id is not null,
    'email', case when coalesce(ap.show_email, false)
                  then coalesce(nullif(trim(ap.display_email), ''), u.email::text)
             end,
    'is_corresponding', coalesce(aa.is_corresponding, false),
    'contributions', coalesce(aa.contributions, '{}'::text[]),
    'article_count', (
      select count(*)
      from public.article_authors x
      join public.articles ar on ar.id = x.article_id
      where x.author_id = a.id and ar.is_public = true
    ),
    'other_articles', coalesce((
      select json_agg(o order by o.created_at desc)
      from (
        select ar.id, ar.title, ar.created_at
        from public.article_authors x
        join public.articles ar on ar.id = x.article_id
        where x.author_id = a.id
          and ar.is_public = true
          and ar.id is distinct from p_article_id
        order by ar.created_at desc
        limit 5
      ) o
    ), '[]'::json)
  )
  from public.authors a
  left join public.profiles p on p.id = a.profile_id
  left join public.author_private ap on ap.author_id = a.id
  left join auth.users u on u.id = a.profile_id
  left join public.article_authors aa
    on aa.author_id = a.id
   and aa.article_id = p_article_id
   and exists (select 1 from public.articles ar2 where ar2.id = p_article_id and ar2.is_public = true)
  where a.id = p_author_id;
$$;

grant execute on function public.author_card(uuid, uuid) to anon, authenticated;

-- Received / accepted / published dates for the article page. manuscript_events
-- is staff- and author-only, so the public reads it through this function, and
-- only for published articles.
create or replace function public.article_timeline(p_article_id uuid)
returns table(received_at timestamp with time zone, accepted_at timestamp with time zone, published_at timestamp with time zone)
language sql
stable
security definer
set search_path = public
as $$
  select
    case when ar.manuscript_id is null then null else coalesce(
      (select min(e.created_at) from public.manuscript_events e
        where e.manuscript_id = ar.manuscript_id and e.event_type = 'submitted'),
      m.created_at
    ) end as received_at,
    (select min(e.created_at) from public.manuscript_events e
      where e.manuscript_id = ar.manuscript_id
        and e.to_status in ('accepted', 'in_production')) as accepted_at,
    ar.created_at as published_at
  from public.articles ar
  left join public.manuscripts m on m.id = ar.manuscript_id
  where ar.id = p_article_id and ar.is_public = true;
$$;

grant execute on function public.article_timeline(uuid) to anon, authenticated;

-- View counter. The app calls it once per browser session per article; it is
-- a popularity signal, not an audited metric.
create or replace function public.record_article_view(p_article_id uuid)
returns integer
language sql
volatile
security definer
set search_path = public
as $$
  update public.articles
  set view_count = view_count + 1
  where id = p_article_id and is_public = true
  returning view_count;
$$;

grant execute on function public.record_article_view(uuid) to anon, authenticated;

-- "Cited by" for the article page's Citations tab: other public OGENE articles
-- whose reference list mentions this article's title. OGENE articles carry no
-- DOIs, so matching is on the title, compared with case, spacing and
-- punctuation stripped so formatting differences in a reference still match.
create or replace function public.article_cited_by(p_article_id uuid)
returns table(id uuid, title text, author_name text, created_at timestamp with time zone)
language sql
stable
security definer
set search_path = public
as $$
  with target as (
    select a.id, regexp_replace(lower(a.title), '[^a-z0-9]+', '', 'g') as key
    from public.articles a
    where a.id = p_article_id and a.is_public = true
  )
  select c.id, c.title, c.author_name, c.created_at
  from target t
  join public.articles c on c.id <> t.id and c.is_public = true
  where length(t.key) >= 12
    and exists (
      select 1
      from unnest(coalesce(c.reference_list, '{}'::text[])) as r
      where position(t.key in regexp_replace(lower(r), '[^a-z0-9]+', '', 'g')) > 0
    )
  order by c.created_at desc;
$$;

grant execute on function public.article_cited_by(uuid) to anon, authenticated;


-- ── Backfill: one author list per existing article ─────────────────────────
-- Only touches articles that have no author rows yet, so re-running is safe.
--
-- 1. Pipeline articles whose stored name matches the submitter's profile name
--    are linked to that account's author card.
insert into public.authors (profile_id, full_name, avatar_url)
select distinct p.id, coalesce(nullif(trim(p.full_name), ''), trim(ar.author_name)), p.avatar_url
from public.articles ar
join public.profiles p on p.id = ar.author_id
where ar.manuscript_id is not null
  and coalesce(trim(p.full_name), '') <> ''
  and lower(trim(coalesce(ar.author_name, ''))) = lower(trim(coalesce(p.full_name, '')))
  and not exists (select 1 from public.article_authors x where x.article_id = ar.id)
on conflict (profile_id) do nothing;

insert into public.article_authors (article_id, author_id, position, is_corresponding)
select ar.id, au.id, 0, true
from public.articles ar
join public.profiles p on p.id = ar.author_id
join public.authors au on au.profile_id = p.id
where ar.manuscript_id is not null
  and coalesce(trim(p.full_name), '') <> ''
  and lower(trim(coalesce(ar.author_name, ''))) = lower(trim(coalesce(p.full_name, '')))
  and not exists (select 1 from public.article_authors x where x.article_id = ar.id)
on conflict do nothing;

-- 2. Everything else (admin uploads, the imported batch, sample rows) gets an
--    account-less author per distinct name. Admins can add photos and details,
--    or link them to a real account, from the dashboard.
insert into public.authors (full_name)
select min(trim(ar.author_name))
from public.articles ar
where coalesce(trim(ar.author_name), '') <> ''
  and not exists (select 1 from public.article_authors x where x.article_id = ar.id)
  and not exists (
    select 1 from public.authors au
    where au.profile_id is null and lower(au.full_name) = lower(trim(ar.author_name))
  )
group by lower(trim(ar.author_name));

insert into public.article_authors (article_id, author_id, position, is_corresponding)
select distinct on (ar.id) ar.id, au.id, 0, true
from public.articles ar
join public.authors au
  on au.profile_id is null and lower(au.full_name) = lower(trim(ar.author_name))
where coalesce(trim(ar.author_name), '') <> ''
  and not exists (select 1 from public.article_authors x where x.article_id = ar.id)
order by ar.id, au.created_at
on conflict do nothing;


-- ── Verification ───────────────────────────────────────────────────────────
do $$
declare
  missing_authors integer;
begin
  if exists (
    select 1 from pg_tables t
    join pg_class c on c.relname = t.tablename
    join pg_namespace n on n.oid = c.relnamespace and n.nspname = t.schemaname
    where t.schemaname = 'public'
      and t.tablename in ('authors', 'author_private', 'article_authors', 'manuscript_authors')
      and c.relrowsecurity = false
  ) then
    raise exception 'FAIL: RLS is not enabled on one or more author tables.';
  end if;

  if has_table_privilege('anon', 'public.author_private', 'SELECT') then
    raise exception 'FAIL: anon can SELECT author_private — email settings would be exposed.';
  end if;

  if exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'manuscript_authors'
             and (qual ilike '%reviewer%' or with_check ilike '%reviewer%')) then
    raise exception 'FAIL: manuscript_authors has a reviewer policy — double-blind review would leak authors.';
  end if;

  if not exists (select 1 from pg_trigger where tgname = 'guard_author_identity') then
    raise exception 'FAIL: guard_author_identity trigger missing.';
  end if;

  if not exists (select 1 from pg_proc where proname = 'author_card')
     or not exists (select 1 from pg_proc where proname = 'ensure_author_for_profile')
     or not exists (select 1 from pg_proc where proname = 'article_timeline')
     or not exists (select 1 from pg_proc where proname = 'record_article_view')
     or not exists (select 1 from pg_proc where proname = 'article_cited_by') then
    raise exception 'FAIL: one or more author/article functions are missing.';
  end if;

  if not exists (select 1 from information_schema.columns
                 where table_schema = 'public' and table_name = 'articles' and column_name = 'view_count') then
    raise exception 'FAIL: articles.view_count missing.';
  end if;

  select count(*) into missing_authors
  from public.articles ar
  where ar.is_public = true
    and not exists (select 1 from public.article_authors x where x.article_id = ar.id);
  if missing_authors > 0 then
    raise notice 'OGENE: % public article(s) have no author rows (blank author name). Assign authors in Admin.', missing_authors;
  end if;

  raise notice 'OGENE: authors & co-authors ready.';
end $$;
