-- Add learning_steps column to card_states (ts-fsrs v5 requirement)
alter table public.card_states add column learning_steps int not null default 0;

-- Add archived_at column for soft-delete
alter table public.cards add column archived_at timestamptz;
create index cards_archived_idx on public.cards(archived_at) where archived_at is null;

-- Fix review_logs FK: change cascade to set null to preserve history
alter table public.review_logs
  drop constraint review_logs_card_id_fkey,
  add constraint review_logs_card_id_fkey
    foreign key (card_id) references public.cards(id)
    on delete set null;
alter table public.review_logs alter column card_id drop not null;

-- Backfill card_states for any existing cards without states
insert into card_states (card_id, user_id, stability, difficulty, state, due, reps, lapses, scheduled_days)
select c.id, c.user_id, 0, 0, 'new', now(), 0, 0, 0
from cards c
where not exists (
  select 1 from card_states cs where cs.card_id = c.id
);

-- RPC function for getting deck due counts (fixes PostgREST filter bug)
create or replace function public.get_deck_due_counts(p_user_id uuid, p_now timestamptz)
returns table (deck_id uuid, due_count bigint)
language sql stable security definer as $$
  select c.deck_id,
    count(*) as due_count
  from card_states cs
  join cards c on c.id = cs.card_id
  where cs.user_id = p_user_id
    and c.archived_at is null
    and cs.due <= p_now
  group by c.deck_id;
$$;

-- Full-text search support for card browser (P5)
alter table public.cards add column fts tsvector
  generated always as (
    to_tsvector('english', coalesce(front, '') || ' ' || coalesce(back, ''))
  ) stored;
create index cards_fts_idx on public.cards using gin (fts);

-- Tag index for array-overlap queries
create index cards_tags_idx on public.cards using gin (tags);

-- Index for statistics queries
create index review_logs_user_reviewed_idx
  on public.review_logs(user_id, reviewed_at desc);
