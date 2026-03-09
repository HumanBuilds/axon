# P5 — Card Browser & Bulk Operations

**Priority**: Medium-Low
**Dependencies**: P1 (card editing, soft-delete, toasts), P0 (user profiles)
**Can run in parallel with**: P3, P4, P6

---

## Overview

A searchable, filterable card browser across all decks with bulk operations:
1. Searchable/filterable card browser
2. Sort by tags, due date, creation date, state
3. Bulk tag, delete, export
4. Tag management UI

### Internal Dependencies

```
Card browser (search + filter) ──→ Bulk operations, tag management
Tag management UI ──────────────── independent (but enhances browser)
Bulk operations ────────────────── depends on browser (needs selection state)
```

**Recommended build order**: Card browser → Tag management → Bulk operations

---

## Feature 1: Card Browser

### Implementation Steps

#### Step 1: Create browser page
**File**: `src/app/(dashboard)/browser/page.tsx`

- Server component that fetches all user cards (paginated)
- Search query from URL params
- Filter/sort from URL params (for shareability + back button)

#### Step 2: Create CardBrowser component
**File**: `src/components/browser/CardBrowser.tsx`

Layout:
- **Top bar**: Search input, filter dropdowns, sort selector
- **Card list**: Scrollable list of cards with columns:
  - Front (truncated)
  - Back (truncated)
  - Deck name
  - Tags
  - State (new/learning/review/relearning)
  - Due date
  - Created date
- **Pagination**: Load more button or infinite scroll

#### Step 3: Search implementation
**File**: `src/lib/actions/cards.ts`

- `searchCards(query, filters, sort, page)` server action
- Supabase full-text search: `textSearch('front', query)` or `ilike` for simple search
- Filters: deck, state, tags, date range
- Sort: due date, creation date, alphabetical

```typescript
export async function searchCards(params: {
  query?: string;
  deckId?: string;
  state?: CardFSRSState;
  tags?: string[];
  sort?: "due" | "created" | "alpha";
  page?: number;
  limit?: number;
}) {
  let q = supabase
    .from("cards")
    .select("*, card_states(*), decks(name)")
    .eq("user_id", user.id)
    .is("archived_at", null);

  if (params.query) {
    q = q.or(`front.ilike.%${params.query}%,back.ilike.%${params.query}%`);
  }
  if (params.deckId) q = q.eq("deck_id", params.deckId);
  if (params.tags?.length) q = q.overlaps("tags", params.tags);
  // ... sort, pagination
}
```

#### Step 4: Client-side filtering for small collections
- For <500 cards, fetch all and filter client-side (faster UX)
- For >500 cards, use server-side search with debounced input

#### Step 5: Tests
- Test search finds cards by front/back content
- Test filter by deck/state/tags
- Test sort ordering
- Test pagination

### Research Insights

**Full-text search**: Use a generated tsvector column for automatic index updates:
```sql
alter table public.cards add column fts tsvector
  generated always as (
    to_tsvector('english', coalesce(front, '') || ' ' || coalesce(back, ''))
  ) stored;
create index cards_fts_idx on public.cards using gin (fts);
```
Then use Supabase's `.textSearch("fts", query, { type: "websearch" })` which supports natural queries like "react hooks" or "react OR vue".

**Virtual scrolling**: Use `@tanstack/react-virtual` (~12kb, TS-first, modern). Set `useFlushSync: false` for React 19. Use `estimateSize: () => 72` with `measureElement` ref for dynamic heights. `overscan: 10` prevents flicker during fast scrolling.

**Tag index**: Add `create index cards_tags_idx on public.cards using gin (tags)` for array-overlap queries.

**Distinct tags function** for autocomplete:
```sql
create or replace function public.get_distinct_tags()
returns table(tag text) language sql security definer stable as $$
  select distinct unnest(tags) as tag from public.cards
  where user_id = auth.uid() order by tag;
$$;
```

### Performance Considerations
- Generated tsvector column with GIN index for full-text search (auto-updates on card edit)
- `@tanstack/react-virtual` for virtual scrolling 1000+ results
- Debounce search input (300ms)
- For <500 cards: fetch all, filter client-side with `useMemo`

---

## Feature 2: Tag Management

### Implementation Steps

#### Step 1: Tag input component
**File**: `src/components/ui/TagInput.tsx`

- Input field with autocomplete from existing tags
- Type tag → Enter to add → shows as chip/badge
- Click X on chip to remove tag
- Autocomplete pulls from all user's existing tags

#### Step 2: Get all user tags
**File**: `src/lib/actions/cards.ts`

```typescript
export async function getUserTags(): Promise<string[]> {
  const { data } = await supabase
    .from("cards")
    .select("tags")
    .eq("user_id", user.id)
    .is("archived_at", null);

  const allTags = new Set<string>();
  data?.forEach(card => card.tags?.forEach(tag => allTags.add(tag)));
  return Array.from(allTags).sort();
}
```

#### Step 3: Tag filter in browser
- Dropdown or multi-select showing all tags
- Click tag → filter browser to only cards with that tag
- Multiple tag selection (AND or OR logic — default AND)

#### Step 4: Inline tag editing
- In card browser, click tags column to edit tags
- Uses TagInput component
- Save on blur or Enter

#### Step 5: Tests
- Test TagInput renders and adds/removes tags
- Test autocomplete shows existing tags
- Test tag filter works in browser

---

## Feature 3: Bulk Operations

### Implementation Steps

#### Step 1: Multi-select UI
**File**: `src/components/browser/CardBrowser.tsx`

- Checkbox on each card row
- "Select all" checkbox in header
- Selected count indicator
- Bulk action toolbar appears when >0 selected

#### Step 2: Bulk action toolbar
Actions:
- **Tag**: Add/remove tags from selected cards
- **Delete**: Soft-delete selected cards (with confirmation dialog)
- **Move**: Move to different deck
- **Export**: Export selected cards as JSON/CSV

#### Step 3: Bulk server actions
**File**: `src/lib/actions/cards.ts`

```typescript
export async function bulkTagCards(cardIds: string[], addTags: string[], removeTags: string[])
export async function bulkDeleteCards(cardIds: string[])
export async function bulkMoveCards(cardIds: string[], targetDeckId: string)
```

- Each validates ownership via `user_id` check
- Batch operations (not N+1)

#### Step 4: Confirmation dialog for bulk delete
- "Delete X cards? This action archives them (review logs preserved)."
- Show count prominently
- Require explicit confirmation

#### Step 5: Tests
- Test bulk tag adds tags to all selected cards
- Test bulk delete soft-deletes all selected
- Test bulk move changes deck_id
- Test operations reject cards not owned by user

---

## Verification Checklist

- [ ] `npm run typecheck` — zero errors
- [ ] `npm run lint` — zero errors
- [ ] `npm run test:run` — all tests pass
- [ ] Manual: Search finds cards across all decks
- [ ] Manual: Filter by deck, state, tags works
- [ ] Manual: Sort by different criteria works
- [ ] Manual: Bulk select and tag multiple cards
- [ ] Manual: Bulk delete with confirmation
- [ ] Manual: Tag autocomplete shows existing tags
