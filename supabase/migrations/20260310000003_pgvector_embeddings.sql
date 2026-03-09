-- Enable pgvector extension
create extension if not exists vector with schema extensions;

-- Add embedding column to cards (512 dims for text-embedding-3-small truncated)
alter table public.cards add column embedding extensions.vector(512);

-- HNSW index for approximate nearest neighbor (safe on empty tables)
create index cards_embedding_idx on public.cards
  using hnsw (embedding extensions.vector_cosine_ops)
  with (m = 16, ef_construction = 64);

-- RPC for similarity search
create or replace function public.match_similar_cards(
  query_embedding extensions.vector(512),
  match_threshold float default 0.7,
  match_count int default 20,
  p_user_id uuid default auth.uid()
)
returns table (id uuid, similarity float)
language sql stable
as $$
  select c.id, 1 - (c.embedding <=> query_embedding) as similarity
  from cards c
  where c.user_id = p_user_id
    and c.embedding is not null
    and c.archived_at is null
    and 1 - (c.embedding <=> query_embedding) > match_threshold
  order by c.embedding <=> query_embedding
  limit match_count;
$$;
