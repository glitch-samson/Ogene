-- FAVOURITES
create table favourites (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) on delete cascade,
  article_id uuid references articles(id) on delete cascade,
  created_at timestamp with time zone default now(),
  unique(user_id, article_id)
);

-- RLS
alter table favourites enable row level security;

-- Policies
create policy "Users can view own favourites" on favourites for select using (auth.uid() = user_id);
create policy "Users can add favourites" on favourites for insert with check (auth.uid() = user_id);
create policy "Users can remove favourites" on favourites for delete using (auth.uid() = user_id);
