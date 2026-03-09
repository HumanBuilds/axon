create table public.import_records (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  format text not null check (format in ('anki_apkg', 'csv', 'tsv', 'json')),
  filename text not null,
  deck_id uuid references public.decks(id) on delete set null,
  card_count int not null default 0,
  error_count int not null default 0,
  status text not null default 'pending' check (status in ('pending', 'processing', 'completed', 'failed')),
  error_message text,
  imported_at timestamptz default now() not null
);

alter table public.import_records enable row level security;

create policy "Users can view own import records"
  on public.import_records for select using (auth.uid() = user_id);
create policy "Users can create own import records"
  on public.import_records for insert with check (auth.uid() = user_id);
create policy "Users can update own import records"
  on public.import_records for update using (auth.uid() = user_id);
