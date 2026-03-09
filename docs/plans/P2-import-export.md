# P2 — Import & Export

**Priority**: High — key for user acquisition (Anki migration path)
**Dependencies**: P0 (user profiles), P1 (FSRS init on card create, soft-delete)
**Can run in parallel with**: P3, P4, P5 (all independent of each other)

---

## Overview

Full import/export pipeline supporting:
- Anki `.apkg` files (primary — migration path from Anki)
- CSV/TSV files (simple tabular import)
- JSON files (programmatic/API import)
- Export to all three formats
- Import tracking table

### Internal Dependencies

```
Import records migration ──→ All import features
Anki .apkg import ──────────── independent (most complex, start first)
CSV/TSV import ─────────────── independent
JSON import ────────────────── independent
Export to CSV/JSON ─────────── independent
Export to .apkg ────────────── depends on understanding Anki schema from import work
```

**Recommended build order**: Import records migration → JSON import (simplest) → CSV/TSV import → Anki import → Export CSV/JSON → Export .apkg

---

## Feature 0: Import Records Migration

### Implementation Steps

#### Step 1: Migration
**File**: `supabase/migrations/20260310000002_import_records.sql`

```sql
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
```

#### Step 2: Type definition
**File**: `src/lib/types.ts`

```typescript
export interface ImportRecord {
  id: string;
  user_id: string;
  format: ImportFormat;
  filename: string;
  deck_id: string | null;
  card_count: number;
  error_count: number;
  status: "pending" | "processing" | "completed" | "failed";
  error_message: string | null;
  imported_at: string;
}
```

---

## Feature 1: JSON Import

### Why First
Simplest import format — validates the import pipeline without file parsing complexity.

### Implementation Steps

#### Step 1: Define JSON schema
**File**: `src/lib/import/schema.ts`

```typescript
export interface ImportedCard {
  front: string;
  back: string;
  tags?: string[];
}

export interface ImportJSON {
  deck_name: string;
  description?: string;
  cards: ImportedCard[];
}
```

- Validate with runtime checks (no external schema library needed for v1)

#### Step 2: Create import server action
**File**: `src/lib/actions/import.ts`

- `importJSON(json: string)`: Parse, validate, create deck + cards + card_states
- Create import_record tracking row
- Batch insert cards in chunks of 100 (Supabase limit-friendly)
- Return import summary (deck id, card count, errors)

#### Step 3: Create import page
**File**: `src/app/(dashboard)/import/page.tsx`

- File upload area (drag-and-drop + click to browse)
- Format selector (JSON / CSV / Anki)
- Preview panel showing first 5-10 cards
- "Import" confirmation button
- Progress indicator for large imports

#### Step 4: Create ImportUpload component
**File**: `src/components/import/ImportUpload.tsx`

- Drag-and-drop zone with file type detection
- File validation (size limit: 50MB, type check)
- Read file content client-side
- Pass to appropriate import handler based on format

#### Step 5: Tests
- Test valid JSON imports correct number of cards
- Test invalid JSON shows validation errors
- Test empty cards array is rejected
- Test cards without `front` or `back` are skipped with error count

---

## Feature 2: CSV/TSV Import

### Implementation Steps

#### Step 1: CSV parser
**File**: `src/lib/import/csv-parser.ts`

- Auto-detect delimiter (comma, tab, semicolon) by analyzing first few lines
- Parse headers from first row
- Handle quoted fields, escaped commas, multi-line values
- Use a lightweight parser (PapaParse or hand-roll for simplicity)
- Return `{ headers: string[], rows: string[][] }`

#### Step 2: Column mapping UI
**File**: `src/components/import/ColumnMapper.tsx`

- Show detected columns in dropdown selectors
- User maps: which column is "Front", which is "Back", which is "Tags" (optional)
- Auto-detect common header names: "front"/"question"/"prompt" → Front, "back"/"answer"/"response" → Back
- Preview first 5 rows with the mapping applied

#### Step 3: Import action
**File**: `src/lib/actions/import.ts`

- `importCSV(rows: string[][], mapping: { front: number, back: number, tags?: number }, deckName: string)`
- Create deck + batch insert cards + card_states
- Track import record

#### Step 4: Tests
- Test CSV with commas, tabs, semicolons
- Test quoted fields with embedded delimiters
- Test auto-detection of delimiter
- Test column mapping
- Test rows with missing required fields are skipped

### Edge Cases
- UTF-8 BOM in CSV files (strip it)
- Windows line endings (CRLF)
- Empty rows at end of file
- Very large files (>10K rows) — chunk processing

---

## Feature 3: Anki `.apkg` Import

### Complexity Note
This is the most complex import. An `.apkg` file is a ZIP containing a SQLite database.

### Implementation Steps

#### Step 1: Install dependencies
- `jszip` — unzip `.apkg` files in browser/Node
- `sql.js` — SQLite in WebAssembly (for reading the Anki DB)

#### Step 2: Create Anki parser
**File**: `src/lib/import/anki-parser.ts`

Pipeline:
1. Accept `.apkg` File/ArrayBuffer
2. Unzip with jszip → extract `collection.anki2` or `collection.anki21` SQLite DB
3. Open with sql.js
4. Query `notes` table: extract `flds` (fields separated by \x1f), `tags`, `mid` (model/note type id)
5. Query `col` table → `models` JSON → get field names per model
6. Map first field → front, second field → back (most common Anki pattern)
7. Parse tags from space-separated string
8. Return `{ cards: ImportedCard[], noteTypes: string[], tagList: string[] }`

#### Step 3: Anki template handling
- Basic/reversed card types: front = field 1, back = field 2
- Cloze cards: store as-is with `{{c1::text}}` syntax (render later or convert)
- Multiple note types: let user confirm mapping per type
- HTML in fields: strip HTML tags or convert to markdown

#### Step 4: Import preview
**File**: `src/components/import/AnkiPreview.tsx`

- Show detected note types with field mappings
- Show card count per note type
- Show sample cards
- Let user adjust field mapping if auto-detect is wrong
- "Import" button

#### Step 5: Batch import action
**File**: `src/lib/actions/import.ts`

- `importAnki(cards: ImportedCard[], deckName: string, filename: string)`
- Batch insert in chunks of 100
- Create card_states for each
- Track import record

#### Step 6: Optional — Review history import
**Advanced feature** (can defer to P7):
- Parse `revlog` table from Anki DB
- Replay through FSRS to reconstruct card states
- Allows immediate personalized scheduling for migrating users

#### Step 7: Tests
- Test parsing a minimal `.apkg` file (create a test fixture)
- Test field extraction from `notes.flds`
- Test tag parsing
- Test HTML stripping from fields
- Test multi-note-type handling

### Edge Cases
- Anki 2.0 vs 2.1 format differences (`.anki2` vs `.anki21`)
- Media files in `.apkg` (ignore for v1, track as TODO)
- Very large decks (10K+ cards) — progress indicator + chunked inserts
- Corrupt or password-protected archives
- Note types with >2 fields — need user mapping

---

## Feature 4: Export to CSV/JSON

### Implementation Steps

#### Step 1: Export server actions
**File**: `src/lib/actions/export.ts`

- `exportDeckJSON(deckId: string)`: Fetch deck + cards, return JSON string matching import schema
- `exportDeckCSV(deckId: string)`: Fetch deck + cards, return CSV string with headers
- Option to include/exclude FSRS state data
- Option to include/exclude review logs

#### Step 2: Export page/UI
**File**: `src/app/(dashboard)/decks/[deckId]/export/page.tsx` (or modal)

- Format selector (JSON/CSV)
- Options checkboxes (include review history, include FSRS state)
- "Download" button → trigger file download

#### Step 3: Client-side download
- Create Blob from response
- Trigger download with `URL.createObjectURL` + anchor click

#### Step 4: Tests
- Test JSON export matches import schema
- Test CSV export has correct headers
- Test export includes all cards in deck
- Test export excludes archived cards

---

## Feature 5: Export to Anki `.apkg`

### Implementation Steps

This is the most complex export. Requires generating a valid Anki SQLite database.

#### Step 1: Anki schema generator
**File**: `src/lib/import/anki-generator.ts`

- Create SQLite DB with sql.js
- Create `col` table with model definition (Basic note type)
- Create `notes` table with cards mapped to fields
- Create `cards` table linked to notes
- Package as zip with `.apkg` extension

#### Step 2: Wire up to export UI
- Add "Anki .apkg" as export format option
- Generate and download

#### Step 3: Tests
- Test generated `.apkg` can be imported back (round-trip)
- Test basic card mapping

### Deferral Note
This is the lowest priority in P2. Can be deferred if time-constrained. JSON/CSV export covers most needs.

---

## Verification Checklist

- [ ] `npm run typecheck` — zero errors
- [ ] `npm run lint` — zero errors
- [ ] `npm run test:run` — all tests pass
- [ ] Manual: Import JSON file → deck created with correct cards
- [ ] Manual: Import CSV file → column mapping works, cards imported
- [ ] Manual: Import `.apkg` file → cards extracted and imported
- [ ] Manual: Export deck to JSON → re-import produces same cards
- [ ] Manual: Export deck to CSV → opens correctly in spreadsheet
