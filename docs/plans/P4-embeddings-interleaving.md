# P4 — Embeddings & Interleaving

**Priority**: Medium — core pillar #3 from spec
**Dependencies**: P1 (FSRS init, settings for toggle)
**Can run in parallel with**: P2, P3, P5, P6

---

## Overview

Vector-based interleaving system that orders review cards to encourage cross-topic discrimination:
1. Enable pgvector extension + add embedding column
2. Build embedding generation pipeline
3. Choose and integrate embedding model
4. Build vector-based interleaving scheduler
5. Add interleaving toggle to settings
6. Add ANN index for fast similarity queries

### Internal Dependencies

```
pgvector setup (migration) ──→ Everything else
Embedding model selection ──→ Embedding pipeline
Embedding pipeline ─────────→ Interleaving scheduler
Interleaving toggle (P1 settings) ── independent
ANN index ──────────────────→ After pipeline is working (optimization)
```

**Recommended build order**: pgvector migration → Embedding model selection → Embedding pipeline → Interleaving scheduler → ANN index → Settings toggle

---

## Feature 1: Enable pgvector + Add Embedding Column

### Implementation Steps

#### Step 1: Migration
**File**: `supabase/migrations/20260310000003_pgvector_embeddings.sql`

```sql
-- Enable pgvector extension
create extension if not exists vector with schema extensions;

-- Add embedding column to cards
-- Dimension depends on model: 384 for MiniLM, 256 for voyage-3-lite, 1536 for OpenAI
alter table public.cards add column embedding vector(384);

-- Index for approximate nearest neighbor (add after data exists)
-- Will be created in a later migration after embeddings are populated
```

#### Step 2: Update Card type
**File**: `src/lib/types.ts`

- Add `embedding: number[] | null` to Card interface
- Note: pgvector returns as string `"[0.1,0.2,...]"` — may need parsing

### Dimension Decision
- **384 dimensions**: `all-MiniLM-L6-v2` (local, free, fast, good quality)
- **256 dimensions**: `voyage-3-lite` (API, cheap, optimized for retrieval)
- **1536 dimensions**: `text-embedding-3-small` (OpenAI, high quality, more storage)

**Recommendation**: Start with 384 (MiniLM) for local development, allow swapping to API model later.

---

## Feature 2: Embedding Model Selection & Integration

### Implementation Steps

#### Step 1: Create embedding service interface
**File**: `src/lib/embeddings/types.ts`

```typescript
export interface EmbeddingService {
  embed(text: string): Promise<number[]>;
  embedBatch(texts: string[]): Promise<number[][]>;
  dimensions: number;
}
```

#### Step 2: Implement API-based embedding
**File**: `src/lib/embeddings/openai.ts` or `src/lib/embeddings/voyage.ts`

- Call embedding API with card text (front + " " + back)
- Handle rate limits, retries, errors
- Batch support for imports

#### Step 3: Environment configuration
**File**: `.env.local`

```
EMBEDDING_PROVIDER=voyage  # or "openai" or "local"
EMBEDDING_API_KEY=...
```

### Model Comparison

| Model | Dimensions | Cost | Latency | Quality |
|-------|-----------|------|---------|---------|
| voyage-3-lite | 256 | $0.02/1M tokens | ~50ms | Good for retrieval |
| text-embedding-3-small | 1536 | $0.02/1M tokens | ~100ms | High quality |
| all-MiniLM-L6-v2 | 384 | Free (local) | ~10ms | Good general purpose |

**Recommendation**: `voyage-3-lite` for production (cheap, fast, purpose-built for retrieval). Fall back to OpenAI if Voyage isn't available.

---

## Feature 3: Embedding Generation Pipeline

### Implementation Steps

#### Step 1: Embed on card create/edit
**File**: `src/lib/actions/cards.ts`

- After creating a card, generate embedding asynchronously
- After editing front/back, regenerate embedding
- Don't block the user — fire and forget, or use a background approach

```typescript
// After card insert:
void generateAndStoreEmbedding(data.id, front, back);
```

#### Step 2: Background embedding function
**File**: `src/lib/embeddings/pipeline.ts`

```typescript
export async function generateAndStoreEmbedding(
  cardId: string, front: string, back: string
) {
  const service = getEmbeddingService();
  const text = `${front} ${back}`;
  const embedding = await service.embed(text);

  await supabase
    .from("cards")
    .update({ embedding: JSON.stringify(embedding) })
    .eq("id", cardId);
}
```

#### Step 3: Batch embedding for imports
**File**: `src/lib/embeddings/pipeline.ts`

```typescript
export async function generateBatchEmbeddings(
  cards: { id: string; front: string; back: string }[]
) {
  const texts = cards.map(c => `${c.front} ${c.back}`);
  const embeddings = await service.embedBatch(texts);

  // Batch update cards with embeddings
  for (let i = 0; i < cards.length; i++) {
    await supabase
      .from("cards")
      .update({ embedding: JSON.stringify(embeddings[i]) })
      .eq("id", cards[i].id);
  }
}
```

#### Step 4: Backfill existing cards
- One-time script to generate embeddings for all existing cards
- Process in batches of 50 (respect API rate limits)
- Track progress (log or update a status field)

### Edge Cases
- API failure during embedding → card works without embedding, retry later
- Rate limits on embedding API → exponential backoff
- Very long card text → truncate to model's max token limit
- Cards with only code → embedding quality may be low (acceptable)

---

## Feature 4: Vector-Based Interleaving Scheduler

### Algorithm

The interleaving scheduler sits **on top of FSRS**. FSRS decides *when* a card is due. The interleaving scheduler decides *what order* due cards are presented.

#### Step 1: Create interleaving function
**File**: `src/lib/fsrs/interleave.ts`

```typescript
export function interleaveCards(
  dueCards: CardWithEmbedding[],
  options: { similarityThreshold: number; minTopicSwitch: number }
): CardWithEmbedding[] {
  // 1. Start with the first due card
  // 2. For each next card, find one that is:
  //    a. Semantically similar (cosine > threshold) — forces discrimination
  //    b. From a different tag cluster — forces cross-topic comparison
  // 3. If no good candidate, fall back to FSRS due-date order
  // 4. Never show two cards from the same narrow cluster consecutively
}
```

#### Step 2: Cosine similarity helper
**File**: `src/lib/embeddings/similarity.ts`

```typescript
export function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}
```

#### Step 3: Database query for due cards with embeddings
**File**: `src/lib/actions/cards.ts`

Update `getDueCards()` to include embeddings when interleaving is enabled:
```typescript
const { data } = await supabase
  .from("card_states")
  .select("*, cards(*, embedding)")
  .eq("user_id", user.id)
  .lte("due", now);
```

#### Step 4: Wire into study session
**File**: `src/app/(dashboard)/decks/[deckId]/study/page.tsx`

- Fetch user profile → check `interleaving_enabled`
- If enabled, pass due cards through `interleaveCards()`
- If disabled, use default FSRS due-date ordering

### Algorithm Details

**Greedy approach** (simple, effective for <1000 due cards):
1. Pick first card by due date
2. For each subsequent card:
   - Score each remaining card: `similarity_to_current * (1 if different_tags else 0.3)`
   - Pick highest-scoring card
3. If all remaining cards are from same tag → just use due-date order

**Tuning parameters**:
- `similarityThreshold`: 0.7 default (configurable later)
- `minTopicSwitch`: 3 (switch topics at least every 3 cards)

---

## Feature 5: ANN Index for Fast Similarity

### Implementation Steps

#### Step 1: Migration (after embeddings are populated)
**File**: `supabase/migrations/20260310000004_embedding_index.sql`

```sql
-- HNSW index for fast approximate nearest neighbor
-- Only create after significant number of embeddings exist
create index cards_embedding_idx on public.cards
  using hnsw (embedding vector_cosine_ops)
  with (m = 16, ef_construction = 64);
```

#### Step 2: Database RPC for similarity search
```sql
create or replace function match_similar_cards(
  query_embedding vector(384),
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
    and 1 - (c.embedding <=> query_embedding) > match_threshold
  order by c.embedding <=> query_embedding
  limit match_count;
$$;
```

### When to Add the Index
- HNSW index is expensive to build and maintain
- Don't add until there are >1000 cards with embeddings
- For small collections (<1000 cards), brute-force cosine similarity is fast enough

---

## Feature 6: Interleaving Toggle

### Implementation Steps

Already covered in P1 Settings page:
- `interleaving_enabled` boolean on `user_profiles`
- Toggle switch in Settings with "(requires embeddings)" note
- Study session checks this setting

---

## Verification Checklist

- [ ] `npm run typecheck` — zero errors
- [ ] `npm run lint` — zero errors
- [ ] `npm run test:run` — all tests pass
- [ ] Manual: New card gets embedding generated
- [ ] Manual: Edit card triggers re-embedding
- [ ] Manual: Interleaving toggle in settings works
- [ ] Manual: Study session with interleaving orders cards by similarity
- [ ] Manual: Study session without interleaving uses due-date order
- [ ] Performance: Similarity query <50ms with index
