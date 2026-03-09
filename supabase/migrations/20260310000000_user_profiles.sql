-- User profiles table for per-user settings
create table public.user_profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  display_name text,
  desired_retention float not null default 0.9
    check (desired_retention >= 0.7 and desired_retention <= 0.99),
  max_new_cards_per_day int not null default 20
    check (max_new_cards_per_day >= 0),
  max_reviews_per_day int not null default 200
    check (max_reviews_per_day >= 0),
  learning_steps text[] not null default '{"1m","10m"}',
  relearning_steps text[] not null default '{"10m"}',
  fsrs_weights float[],
  last_optimization timestamptz,
  interleaving_enabled boolean not null default false,
  agent_enabled boolean not null default false,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

alter table public.user_profiles enable row level security;

create policy "Users can view own profile"
  on public.user_profiles for select
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.user_profiles for insert
  with check (auth.uid() = id);

create policy "Users can update own profile"
  on public.user_profiles for update
  using (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.user_profiles (id) values (new.id);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
