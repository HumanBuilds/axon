-- Decks table
create table public.decks (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  description text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

alter table public.decks enable row level security;

create policy "Users can view own decks"
  on public.decks for select
  using (auth.uid() = user_id);

create policy "Users can create own decks"
  on public.decks for insert
  with check (auth.uid() = user_id);

create policy "Users can update own decks"
  on public.decks for update
  using (auth.uid() = user_id);

create policy "Users can delete own decks"
  on public.decks for delete
  using (auth.uid() = user_id);

-- Cards table
create table public.cards (
  id uuid default gen_random_uuid() primary key,
  deck_id uuid references public.decks(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  front text not null,
  back text not null,
  tags text[] default '{}',
  source text default 'manual' check (source in ('manual', 'ai_generated', 'imported')),
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

alter table public.cards enable row level security;

create policy "Users can view own cards"
  on public.cards for select
  using (auth.uid() = user_id);

create policy "Users can create own cards"
  on public.cards for insert
  with check (auth.uid() = user_id);

create policy "Users can update own cards"
  on public.cards for update
  using (auth.uid() = user_id);

create policy "Users can delete own cards"
  on public.cards for delete
  using (auth.uid() = user_id);

-- Card states (FSRS memory state)
create table public.card_states (
  card_id uuid references public.cards(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  stability float not null default 0,
  difficulty float not null default 0,
  state text not null default 'new' check (state in ('new', 'learning', 'review', 'relearning')),
  due timestamptz not null default now(),
  last_review timestamptz,
  reps int not null default 0,
  lapses int not null default 0,
  scheduled_days float not null default 0,
  primary key (card_id, user_id)
);

alter table public.card_states enable row level security;

create policy "Users can view own card states"
  on public.card_states for select
  using (auth.uid() = user_id);

create policy "Users can create own card states"
  on public.card_states for insert
  with check (auth.uid() = user_id);

create policy "Users can update own card states"
  on public.card_states for update
  using (auth.uid() = user_id);

-- Review logs (append-only)
create table public.review_logs (
  id uuid default gen_random_uuid() primary key,
  card_id uuid references public.cards(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  rating text not null check (rating in ('again', 'hard', 'good', 'easy')),
  elapsed_days float not null default 0,
  scheduled_days float not null default 0,
  state_before jsonb not null default '{}',
  state_after jsonb not null default '{}',
  reviewed_at timestamptz default now() not null
);

alter table public.review_logs enable row level security;

create policy "Users can view own review logs"
  on public.review_logs for select
  using (auth.uid() = user_id);

create policy "Users can create own review logs"
  on public.review_logs for insert
  with check (auth.uid() = user_id);

-- Indexes
create index cards_deck_id_idx on public.cards(deck_id);
create index cards_user_id_idx on public.cards(user_id);
create index card_states_due_idx on public.card_states(due);
create index card_states_user_id_idx on public.card_states(user_id);
create index review_logs_card_id_idx on public.review_logs(card_id);
create index review_logs_user_id_idx on public.review_logs(user_id);
