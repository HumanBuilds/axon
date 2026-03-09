# P1 — Complete the MVP Loop

**Priority**: High — makes the core review experience usable end-to-end
**Dependencies**: P0 (user profiles table needed for Settings page)
**Can run in parallel with**: Items within P1 are mostly independent (noted below)

---

## Overview

Six features that complete the minimum viable study loop:
1. Card editing (update front/back from deck detail)
2. FSRS initialization on card create
3. Due count on dashboard
4. Settings page
5. Soft-delete cards
6. Error toasts / feedback UI

### Internal Dependencies

```
P0 (user_profiles) ──→ Settings page
                        ↑
Card editing ────────── independent
FSRS init ───────────── independent
Due count ───────────── independent
Soft-delete ─────────── independent
Error toasts ────────── independent (but useful to build first, used by all others)
```

**Recommended build order**: Error toasts → FSRS init → Card editing → Due count → Soft-delete → Settings

---

## Feature 1: Error Toasts / Feedback UI

### Why First
Every other P1 feature needs success/error feedback. Build the toast system first so all subsequent features can use it.

### Current State
- No toast/notification system exists
- No feedback on successful card creation, deletion, or errors
- `src/components/ui/` directory exists but is empty

### Implementation Steps

#### Step 1: Create Toast context and provider
**File**: `src/components/ui/Toast.tsx`

- React context with `addToast(message, type)` function
- Types: `"success"` (green), `"error"` (red), `"warning"` (amber)
- Auto-dismiss after 4 seconds
- Stack toasts vertically (newest on top)
- Position: bottom-right on desktop, bottom-center on mobile
- Use React portal to render outside component tree
- `aria-live="polite"` for accessibility

#### Step 2: Create useToast hook
**File**: `src/components/ui/Toast.tsx` (exported from same file)

- `const { addToast } = useToast()`
- Convenience wrappers: `addToast.success("Saved!")`, `addToast.error("Failed")`

#### Step 3: Add ToastProvider to layout
**File**: `src/app/layout.tsx`

- Wrap children in `<ToastProvider>`

#### Step 4: Add toast animations to globals.css
**File**: `src/app/globals.css`

- `.toast-enter`: slide up + fade in
- `.toast-exit`: slide down + fade out
- Use CSS `@keyframes` — no extra animation library

#### Step 5: Tests
**File**: `src/components/ui/Toast.test.tsx`

- Test toast renders with correct message and type
- Test auto-dismiss after timeout
- Test multiple toasts stack

### Design Specs
- Use `.mica-card` base styling with colored left border
- Green border for success, red for error, amber for warning
- 12px padding, `text-sm`, max-width 360px
- Dismiss button (X) on each toast

---

## Feature 2: FSRS Initialization on Card Create

### Problem
Currently `card_states` rows are only created on first review (in `POST /api/review`). This means:
- New cards don't appear in due queries (they have no `card_states` row)
- Due counts are wrong (new cards are invisible)
- Users must somehow review a card that isn't in their queue

### Current State
- `src/lib/actions/cards.ts`: `createCard()` inserts into `cards` table only
- `src/app/api/review/route.ts`: Creates `card_states` on first review via upsert
- `src/lib/fsrs/index.ts`: `createNewCard()` exists but isn't called on card creation

### Implementation Steps

#### Step 1: Update `createCard` to also insert `card_states`
**File**: `src/lib/actions/cards.ts`

After inserting the card, insert a `card_states` row:
```typescript
// After card insert succeeds:
const now = new Date();
const newFSRS = createNewCard(now);

await supabase.from("card_states").insert({
  card_id: data.id,
  user_id: user.id,
  stability: newFSRS.stability,
  difficulty: newFSRS.difficulty,
  state: "new",
  due: now.toISOString(),  // Due immediately
  reps: 0,
  lapses: 0,
  scheduled_days: 0,
});
```

#### Step 2: Wrap in transaction-like pattern
- Both inserts should succeed or both should fail
- If `card_states` insert fails, delete the card (compensating action)
- Or use Supabase RPC for a true transaction

#### Step 3: Update tests
**File**: `src/lib/actions/cards.test.ts`

- Test that `createCard()` creates both card and card_states
- Test that new card's due date is set to now (immediately reviewable)
- Test rollback if card_states insert fails

### Edge Cases
- Race condition: card created but state insert fails → orphaned card
- Bulk import: batch insert card_states for all imported cards (P2 concern)
- Migration: backfill `card_states` for existing cards without states

#### Migration Step (one-time)
**File**: Add to a new migration or run manually

```sql
INSERT INTO card_states (card_id, user_id, stability, difficulty, state, due, reps, lapses, scheduled_days)
SELECT c.id, c.user_id, 0, 0, 'new', now(), 0, 0, 0
FROM cards c
WHERE NOT EXISTS (
  SELECT 1 FROM card_states cs WHERE cs.card_id = c.id
);
```

---

## Feature 3: Card Editing

### Problem
Cards can be created and deleted but not edited. The deck detail page shows cards as read-only text.

### Current State
- `src/lib/actions/cards.ts`: `updateCard()` server action already exists
- `src/components/deck/DeckDetail.tsx`: Cards displayed as read-only list items
- No inline editing UI

### Implementation Steps

#### Step 1: Add edit mode to card list items
**File**: `src/components/deck/DeckDetail.tsx`

- Track `editingCardId` state
- Click card or Edit button → enter edit mode for that card
- Show front/back textareas in edit mode (same style as add card form)
- Show Save/Discard buttons only after content changes (per CLAUDE.md UX guidelines)

#### Step 2: Handle save with optimistic update
- Call `updateCard()` on save
- Show success toast
- Exit edit mode
- `router.refresh()` to get fresh data

#### Step 3: Handle discard
- Revert to original values
- Exit edit mode
- No toast needed

#### Step 4: Keyboard shortcuts
- `Escape` → discard changes and exit edit mode
- `Ctrl+Enter` → save

#### Step 5: Tests
**File**: `src/components/deck/DeckDetail.test.tsx`

- Test clicking edit shows textarea with card content
- Test save calls updateCard with new values
- Test discard reverts to original
- Test dirty detection (Save/Discard only shown when content differs)

### UX Details
- Only one card can be in edit mode at a time
- Editing card A while B is dirty → prompt to save/discard B first
- Truncated text in read mode expands in edit mode
- Per CLAUDE.md: "Hide Save/Discard buttons until a change is detected"

---

## Feature 4: Due Count on Dashboard

### Problem
The dashboard deck cards show total card count but not how many are due for review.

### Current State
- `src/components/layout/Dashboard.tsx`: Shows `deck.cards?.[0]?.count ?? 0` total cards
- `src/app/page.tsx`: Fetches decks with `select("*, cards(count)")`
- No due count query

### Implementation Steps

#### Step 1: Update dashboard data fetching
**File**: `src/app/page.tsx`

- After fetching decks, query due counts per deck:
```typescript
const { data: dueCounts } = await supabase
  .from("card_states")
  .select("cards!inner(deck_id)")
  .eq("user_id", user.id)
  .lte("due", new Date().toISOString());
```
- Or use an RPC function for efficiency:
```sql
select d.id as deck_id, count(cs.card_id) as due_count
from decks d
left join cards c on c.deck_id = d.id
left join card_states cs on cs.card_id = c.id and cs.due <= now()
where d.user_id = auth.uid()
group by d.id;
```

#### Step 2: Update Dashboard component
**File**: `src/components/layout/Dashboard.tsx`

- Add `dueCount` to `DeckWithCount` interface
- Display due count badge on each deck card: "5 due" in accent color
- If 0 due, show "All caught up" or no badge

#### Step 3: Update DeckDetail header
**File**: `src/components/deck/DeckDetail.tsx`

- Already has `dueCount` prop and Study button — verify it uses FSRS-initialized counts

#### Step 4: Tests
- Test dashboard displays due counts per deck
- Test due count of 0 shows no badge / "caught up"

### Performance Consideration
- Single query for all deck due counts (not N+1 per deck)
- Consider caching with `unstable_cache` or ISR if dashboard is slow

---

## Feature 5: Soft-Delete Cards

### Problem
Cards are hard-deleted, which destroys review logs needed for FSRS optimization.

### Current State
- `src/lib/actions/cards.ts`: `deleteCard()` does a hard delete
- `review_logs` table has `on delete cascade` on `card_id` FK → logs are destroyed
- The spec says: "Soft-delete (archived). Review logs are preserved for FSRS optimization."

### Implementation Steps

#### Step 1: Migration — add `archived_at` column
**File**: `supabase/migrations/20260310000001_soft_delete_cards.sql`

```sql
alter table public.cards add column archived_at timestamptz;

create index cards_archived_idx on public.cards(archived_at) where archived_at is null;

-- Update RLS to filter archived cards by default (optional — or filter in app code)
```

#### Step 2: Update `deleteCard` to soft-delete
**File**: `src/lib/actions/cards.ts`

```typescript
export async function deleteCard(cardId: string) {
  // ...auth check...
  const { error } = await supabase
    .from("cards")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", cardId)
    .eq("user_id", user.id);
}
```

#### Step 3: Update all card queries to exclude archived
**Files**: `src/lib/actions/cards.ts`

- `getCards()`: Add `.is("archived_at", null)`
- `getDueCards()`: The join from `card_states` → `cards` should filter archived

#### Step 4: Update Card type
**File**: `src/lib/types.ts`

- Add `archived_at: string | null` to `Card` interface

#### Step 5: Optional — Restore card action
**File**: `src/lib/actions/cards.ts`

- `restoreCard(cardId)`: Set `archived_at` back to null
- Not needed for MVP but low effort to add

#### Step 6: Update FK constraint on review_logs
**File**: Migration

- The current `on delete cascade` on `review_logs.card_id` is fine because we're not deleting anymore
- But consider: what about `card_states`? Archived cards should keep their states for potential restore

#### Step 7: Tests
- Test `deleteCard` sets `archived_at` instead of deleting
- Test `getCards` excludes archived cards
- Test `getDueCards` excludes archived cards
- Test review_logs are preserved after soft-delete

---

## Feature 6: Settings Page

### Problem
Users can't configure their study preferences (desired retention, daily limits, etc.).

### Dependencies
- **P0**: User profiles table must exist first

### Implementation Steps

#### Step 1: Create settings page route
**File**: `src/app/(dashboard)/settings/page.tsx`

- Server component that fetches profile with `getProfile()`
- Renders `<SettingsForm profile={profile} />`

#### Step 2: Create SettingsForm component
**File**: `src/components/settings/SettingsForm.tsx`

Sections:
1. **Profile**: Display name (text input)
2. **Scheduling**: Desired retention (slider, 0.70–0.99, step 0.01), max new cards/day (number input), max reviews/day (number input)
3. **Features**: Interleaving toggle (disabled until P4), Agent opt-in toggle (disabled until P3)

UX per CLAUDE.md:
- Hide Save/Discard until a change is detected
- Show Save/Discard buttons when form is dirty
- On save → call `updateProfile()` → show success toast
- On discard → revert to original values

#### Step 3: Add Settings link to header/navigation
**File**: `src/components/layout/Dashboard.tsx`

- Add gear icon (Settings from react-feather) link to `/settings`

#### Step 4: Wire up desired_retention to FSRS
**File**: `src/lib/fsrs/index.ts`

- Currently uses default params: `generatorParameters({ enable_fuzz: true })`
- Update to accept `desired_retention` parameter via `request_retention`
- Create per-user scheduler instances instead of singleton

```typescript
import { fsrs, generatorParameters, createEmptyCard } from "ts-fsrs";

export function createScheduler(profile?: { desired_retention?: number; fsrs_weights?: number[] | null }) {
  const params = generatorParameters({
    enable_fuzz: true,
    request_retention: profile?.desired_retention ?? 0.9,
    maximum_interval: 365,
    enable_short_term: true,
    learning_steps: ["1m", "10m"],
    relearning_steps: ["10m"],
    w: profile?.fsrs_weights ?? undefined,
  });
  return fsrs(params);
}
```

- `reviewCard()` and `getNextStates()` should accept a scheduler instance
- Fetch user profile in the review API route and create scheduler with their settings

#### Step 5: Wire up daily limits to study session
**File**: `src/app/(dashboard)/decks/[deckId]/study/page.tsx`

- Fetch user profile
- Limit new cards shown per day to `max_new_cards_per_day`
- Limit total reviews to `max_reviews_per_day`
- Track daily counts (query today's review_logs)

#### Step 6: Tests
**File**: `src/components/settings/SettingsForm.test.tsx`

- Test form renders with profile values
- Test dirty detection shows Save/Discard
- Test save calls updateProfile with correct values
- Test retention slider clamps to valid range

### Design Specs
- Use `.mica-card` for each settings section
- Slider for retention with current value displayed (e.g., "90%")
- Number inputs with increment/decrement buttons
- Toggle switches for boolean settings
- Disabled toggles show "(coming soon)" text

---

## Verification Checklist

- [ ] `npm run typecheck` — zero errors
- [ ] `npm run lint` — zero errors
- [ ] `npm run test:run` — all tests pass
- [ ] Manual: Create card → card appears in due queue immediately
- [ ] Manual: Edit card → changes persist after refresh
- [ ] Manual: Delete card → card disappears, review logs preserved
- [ ] Manual: Dashboard shows due counts per deck
- [ ] Manual: Settings page saves and applies desired retention
- [ ] Manual: Toast appears on successful save / error
