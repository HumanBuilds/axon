# P7 — Advanced Scheduling

**Priority**: Low — improves scheduling quality for power users
**Dependencies**: P1 (FSRS init, settings), P6 (enough review data for optimization)
**Can run in parallel with**: P5, P8

---

## Overview

Advanced FSRS scheduling features:
1. FSRS parameter optimization (personalized weights)
2. `fsrs_weights` column on user profiles
3. Configurable learning steps
4. Configurable relearning steps
5. Review history import from Anki for FSRS bootstrapping

### Internal Dependencies

```
fsrs_weights column (migration) ──→ Parameter optimization
Configurable learning steps ───────── independent
Configurable relearning steps ─────── independent (same pattern as learning)
Anki review history import ────────── depends on P2 Anki parser
```

**Recommended build order**: Learning/relearning steps → fsrs_weights migration → Parameter optimization → Anki history import

---

## Feature 1: Configurable Learning Steps

### Problem
Currently using ts-fsrs defaults for learning steps. Users should be able to configure learning step intervals (e.g., 1m, 10m, 1d).

### Implementation Steps

#### Step 1: Add columns to user_profiles
**File**: Migration

```sql
alter table public.user_profiles
  add column learning_steps float[] not null default '{1, 10}',
  add column relearning_steps float[] not null default '{10}';
```

Values are in minutes (1 = 1 minute, 10 = 10 minutes, 1440 = 1 day).

#### Step 2: Update types
**File**: `src/lib/types.ts`

Add `learning_steps: number[]` and `relearning_steps: number[]` to `UserProfile`.

#### Step 3: Update FSRS wrapper
**File**: `src/lib/fsrs/index.ts`

- Accept learning/relearning steps from user profile
- Pass to `generatorParameters()` or configure the scheduler

```typescript
export function createScheduler(profile: UserProfile) {
  const params = generatorParameters({
    enable_fuzz: true,
    request_retention: profile.desired_retention,
    enable_short_term: true,
    learning_steps: profile.learning_steps.map(m => `${m}m`),    // e.g., ["1m", "10m"]
    relearning_steps: profile.relearning_steps.map(m => `${m}m`), // e.g., ["10m"]
    w: profile.fsrs_weights ?? undefined,
  });
  return fsrs(params);
}
```

ts-fsrs accepts learning steps as string durations (e.g., `"1m"`, `"10m"`, `"1d"`). The `enable_short_term: true` flag activates the short-term scheduler which uses these learning steps.

#### Step 4: Settings UI
**File**: `src/components/settings/SettingsForm.tsx`

- Learning steps: comma-separated input (e.g., "1, 10") with preview
- Relearning steps: same pattern
- Validation: all values must be positive numbers
- Reset to defaults button

#### Step 5: Tests
- Test learning steps are passed to FSRS scheduler
- Test settings UI validates step input
- Test invalid values are rejected

---

## Feature 2: FSRS Parameter Optimization

### Problem
Default FSRS-6 parameters work reasonably well, but personalized weights based on a user's review history can significantly improve scheduling accuracy.

### Prerequisites
- User must have >= 1,000 reviews in `review_logs`
- `fsrs_weights` column on `user_profiles`

### Implementation Steps

#### Step 1: Migration
**File**: Migration

```sql
alter table public.user_profiles
  add column fsrs_weights float[21],  -- 21 FSRS-6 parameters, null = use defaults
  add column last_optimization timestamptz;
```

#### Step 2: Update types
**File**: `src/lib/types.ts`

Add `fsrs_weights: number[] | null` and `last_optimization: string | null` to `UserProfile`.

#### Step 3: Optimization function
**File**: `src/lib/fsrs/optimize.ts`

- Fetch all review logs for the user
- Convert to ts-fsrs training format
- Run ts-fsrs optimizer (check if ts-fsrs includes an optimizer — it may use `fsrs-optimizer` or require manual implementation)
- Return optimized weights

```typescript
import { computeParameters, convertCsvToFsrsItems } from "@open-spaced-repetition/binding";

export async function optimizeParameters(userId: string): Promise<number[]> {
  // 1. Fetch review logs
  const logs = await getReviewLogs(userId);

  // 2. Check minimum threshold
  if (logs.length < 1000) {
    throw new Error("Need at least 1,000 reviews for optimization");
  }

  // 3. Convert review logs to FSRS training format (CSV-like items)
  // The @open-spaced-repetition/binding package provides convertCsvToFsrsItems
  // Format: card_id, review_date, rating, ...
  const csvData = convertReviewLogsToCsv(logs);
  const items = convertCsvToFsrsItems(csvData, 4, "UTC", (ms) => 0);

  // 4. Run optimization with timeout
  const result = await computeParameters(items, {
    enableShortTerm: true,
    timeout: 100, // seconds
    progress: (cur, total) => console.log(`Optimizing: ${cur}/${total}`),
  });

  // 5. Save weights — result.w contains the 21 FSRS-6 parameters
  await updateProfile(userId, {
    fsrs_weights: Array.from(result.w),
    last_optimization: new Date().toISOString(),
  });

  return Array.from(result.w);
}
```

**Package to install**: `npm install @open-spaced-repetition/binding`

This uses the Rust-based FSRS optimizer compiled to WASM, which is significantly faster than a pure JS implementation.

#### Step 4: Wire optimized weights into scheduler
**File**: `src/lib/fsrs/index.ts`

```typescript
export function createScheduler(profile: UserProfile) {
  const params = generatorParameters({
    enable_fuzz: true,
    request_retention: profile.desired_retention,
    w: profile.fsrs_weights ?? undefined,  // Use personalized weights if available
  });
  return fsrs(params);
}
```

#### Step 5: Optimization trigger in settings
**File**: `src/components/settings/SettingsForm.tsx`

- "Optimize scheduling" button (only enabled if >= 1,000 reviews)
- Show review count and eligibility
- Show last optimization date
- On click: run optimization → show success toast with improvement metrics
- Disable during optimization (show spinner)

#### Step 6: Tests
- Test optimization rejects users with <1,000 reviews
- Test optimized weights are saved to profile
- Test scheduler uses personalized weights when available
- Test scheduler falls back to defaults when weights are null

### Performance Note
- Optimization is compute-intensive
- For v1: run synchronously (may take 5-30 seconds)
- For v2: move to background job (Edge Function or external worker)

---

## Feature 3: Anki Review History Import

### Purpose
When importing from Anki (.apkg), optionally import review history to:
1. Reconstruct FSRS memory states (instead of starting from scratch)
2. Immediately enable parameter optimization

### Dependencies
- P2 Anki parser (must be able to read `revlog` table from Anki DB)

### Implementation Steps

#### Step 1: Extend Anki parser
**File**: `src/lib/import/anki-parser.ts`

- Parse `revlog` table: `id, cid, usn, ease, ivl, lastIvl, factor, time, type`
- Map Anki ease values to FSRS ratings:
  - 1 (Again) → "again"
  - 2 (Hard) → "hard"
  - 3 (Good) → "good"
  - 4 (Easy) → "easy"
- Map Anki review types (0=learn, 1=review, 2=relearn, 3=filtered)

#### Step 2: Replay history through FSRS
**File**: `src/lib/fsrs/replay.ts`

```typescript
export function replayHistory(
  reviews: AnkiReviewLog[]
): { cardState: CardState; reviewLogs: ReviewLog[] } {
  let card = createNewCard(new Date(reviews[0].timestamp));

  for (const review of reviews) {
    const result = reviewCard(card, mapAnkiRating(review.ease), new Date(review.timestamp));
    card = result.card;
    // Build review log entry
  }

  return { cardState: mapToCardState(card), reviewLogs };
}
```

#### Step 3: Import UI option
**File**: `src/components/import/AnkiPreview.tsx`

- Checkbox: "Import review history (reconstruct memory states)"
- Show review count found in Anki DB
- Warning: "This will process X reviews and may take a few minutes for large collections"

#### Step 4: Tests
- Test Anki rating mapping
- Test history replay produces valid FSRS states
- Test imported states match expected due dates

---

## Verification Checklist

- [ ] `npm run typecheck` — zero errors
- [ ] `npm run lint` — zero errors
- [ ] `npm run test:run` — all tests pass
- [ ] Manual: Configure custom learning steps → new cards use those steps
- [ ] Manual: Optimize parameters → scheduling improves
- [ ] Manual: Import Anki deck with review history → cards have reconstructed states
