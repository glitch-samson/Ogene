-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- MIGRATIONS (Run first to ensure columns exist in existing tables)
do $$
begin
  if not exists (select 1 from information_schema.columns where table_name = 'articles' and column_name = 'author_name') then
    alter table articles add column author_name text;
  end if;

  if not exists (select 1 from information_schema.columns where table_name = 'articles' and column_name = 'is_premium') then
    alter table articles add column is_premium boolean default false;
  end if;

  if not exists (select 1 from information_schema.columns where table_name = 'profiles' and column_name = 'is_premium') then
    alter table profiles add column is_premium boolean default false;
  end if;

  if not exists (select 1 from information_schema.columns where table_name = 'profiles' and column_name = 'premium_until') then
    alter table profiles add column premium_until timestamp with time zone;
  end if;
end $$;

-- PROFILES (Users)
create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  avatar_url text,
  role text default 'user' check (role in ('admin', 'user')),
  is_premium boolean default false,
  premium_until timestamp with time zone,
  created_at timestamp with time zone default now()
);

-- ARTICLES
create table if not exists articles (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  description text,
  content_html text, -- For simple articles or preview logic
  price numeric default 0, -- Deprecated in favor of is_premium, but keeping for compatibility
  is_premium boolean default false,
  file_path text, -- Path in Supabase Storage (original PDF/Doc)
  preview_path text, -- Path to preview version if needed
  author_id uuid references profiles(id),
  author_name text,
  category text,
  is_public boolean default false,
  cover_image text,
  created_at timestamp with time zone default now()
);

-- SUBSCRIPTIONS
create table if not exists subscriptions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) on delete cascade,
  amount numeric not null default 1500,
  start_date timestamp with time zone default now(),
  end_date timestamp with time zone not null,
  transaction_id text, -- From Flutterwave
  created_at timestamp with time zone default now()
);

-- RLS for Subscriptions
alter table subscriptions enable row level security;
drop policy if exists "Users can see own subscriptions" on subscriptions;
create policy "Users can see own subscriptions" on subscriptions for select using (auth.uid() = user_id or auth.uid() in (select id from profiles where role = 'admin'));

-- RLS POLICIES
alter table profiles enable row level security;
alter table articles enable row level security;
alter table purchases enable row level security;

-- Profiles: Public read, Self update
drop policy if exists "Public profiles are viewable by everyone." on profiles;
create policy "Public profiles are viewable by everyone." on profiles for select using (true);

drop policy if exists "Users can update own profile." on profiles;
create policy "Users can update own profile." on profiles for update using (auth.uid() = id);

drop policy if exists "New users can insert their profile" on profiles;
create policy "New users can insert their profile" on profiles for insert with check (auth.uid() = id);

-- Articles: Public read only if is_public = true. Admins read all.
drop policy if exists "Articles are viewable by everyone if public" on articles;
create policy "Articles are viewable by everyone if public" on articles for select using (is_public = true or auth.uid() in (select id from profiles where role = 'admin'));

drop policy if exists "Admins can insert articles" on articles;
create policy "Admins can insert articles" on articles for insert with check (auth.uid() in (select id from profiles where role = 'admin'));

drop policy if exists "Admins can update articles" on articles;
create policy "Admins can update articles" on articles for update using (auth.uid() in (select id from profiles where role = 'admin'));

drop policy if exists "Admins can delete articles" on articles;
create policy "Admins can delete articles" on articles for delete using (auth.uid() in (select id from profiles where role = 'admin'));

-- Purchases: Users can see own purchases. Admins see all.
drop policy if exists "Users can see own purchases" on purchases;
create policy "Users can see own purchases" on purchases for select using (auth.uid() = user_id or auth.uid() in (select id from profiles where role = 'admin'));

drop policy if exists "Users can insert purchases (via edge function ideally, but allow for now)" on purchases;
create policy "Users can insert purchases (via edge function ideally, but allow for now)" on purchases for insert with check (auth.uid() = user_id);

-- STORAGE BUCKETS
insert into storage.buckets (id, name, public) 
values ('articles', 'articles', false)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public) 
values ('covers', 'covers', true)
on conflict (id) do nothing;

-- Storage Policies
-- Covers: Public read, Admin write
drop policy if exists "Covers Public Read" on storage.objects;
create policy "Covers Public Read" on storage.objects for select using (bucket_id = 'covers');

drop policy if exists "Covers Admin Write" on storage.objects;
create policy "Covers Admin Write" on storage.objects for insert with check (bucket_id = 'covers' and auth.uid() in (select id from profiles where role = 'admin'));

-- Articles (Files): 
-- Admin can read/write everything.
-- Users can read IF they purchased the article OR if it is free.
drop policy if exists "Articles Admin All" on storage.objects;
drop policy if exists "Articles Access" on storage.objects;
create policy "Articles Access" on storage.objects for select using (
  bucket_id = 'articles' AND (
    auth.uid() in (select id from profiles where role = 'admin')
    OR
    (name in (select file_path from articles where is_premium = false))
    OR
    (auth.uid() in (select id from profiles where is_premium = true and premium_until > now()))
  )
);

-- Admin still needs write access
drop policy if exists "Articles Admin Write" on storage.objects;
create policy "Articles Admin Write" on storage.objects for insert with check (
  bucket_id = 'articles' AND auth.uid() in (select id from profiles where role = 'admin')
);

drop policy if exists "Articles Admin Update" on storage.objects;
create policy "Articles Admin Update" on storage.objects for update using (
  bucket_id = 'articles' AND auth.uid() in (select id from profiles where role = 'admin')
);

drop policy if exists "Articles Admin Delete" on storage.objects;
create policy "Articles Admin Delete" on storage.objects for delete using (
  bucket_id = 'articles' AND auth.uid() in (select id from profiles where role = 'admin')
);

-- FAVOURITES
create table if not exists favourites (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) on delete cascade,
  article_id uuid references articles(id) on delete cascade,
  created_at timestamp with time zone default now(),
  unique(user_id, article_id)
);

-- RLS for Favourites
alter table favourites enable row level security;

-- Policies for Favourites
drop policy if exists "Users can view own favourites" on favourites;
create policy "Users can view own favourites" on favourites for select using (auth.uid() = user_id);

drop policy if exists "Users can add favourites" on favourites;
create policy "Users can add favourites" on favourites for insert with check (auth.uid() = user_id);

drop policy if exists "Users can remove favourites" on favourites;
create policy "Users can remove favourites" on favourites for delete using (auth.uid() = user_id);

-- LIBRARY
create table if not exists library (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) on delete cascade,
  article_id uuid references articles(id) on delete cascade,
  created_at timestamp with time zone default now(),
  unique(user_id, article_id)
);

-- RLS for Library
alter table library enable row level security;

-- Policies for Library
drop policy if exists "Users can view own library" on library;
create policy "Users can view own library" on library for select using (auth.uid() = user_id);

drop policy if exists "Users can add to library" on library;
create policy "Users can add to library" on library for insert with check (auth.uid() = user_id);

drop policy if exists "Users can remove from library" on library;
create policy "Users can remove from library" on library for delete using (auth.uid() = user_id);
