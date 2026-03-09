# Axon — Master Feature Tracker

**Last updated**: 2026-03-10
**Plans deepened**: 2026-03-09 (6 parallel research agents)

## Research Enhancement Summary

Plans were enhanced with findings from 6 parallel research agents + ts-fsrs Context7 documentation:

### Critical Bugs Found in Current Code
1. **`card_states` missing `learning_steps` column** — ts-fsrs v5 requires this; without it, every review resets to step 0
2. **`getDueCards` PostgREST filter bug** — `.eq("cards.deck_id", deckId)` on embedded joins doesn't work correctly; use RPC function instead
3. **`review_logs` FK cascade** — `on delete cascade` destroys review history needed for FSRS optimization; change to `on delete set null`
4. **FSRS singleton** — current global scheduler ignores per-user `desired_retention`; need per-user scheduler instances

### Key Technology Decisions (from research)
| Decision | Choice | Source |
|---|---|---|
| AI SDK | `@anthropic-ai/sdk` (NOT Agent SDK) | Agent research |
| Structured output | `tool_use` with `tool_choice` | Agent research |
| Embedding model | `text-embedding-3-small` @ 512 dims | Embeddings research |
| Vector index | HNSW (safe to create on empty tables) | Embeddings research |
| CSV parser | PapaParse | Import research |
| Anki parser | JSZip + sql.js | Import research |
| Charts | recharts | Statistics research |
| Heatmap | @uiw/react-heat-map | Statistics research |
| Rate limiting | @upstash/ratelimit + @upstash/redis | Agent research |
| FSRS optimizer | @open-spaced-repetition/binding (WASM) | ts-fsrs docs |
| Virtual scroll | @tanstack/react-virtual | Browser research |

---

## Dependency Map

```
P0 Fix What's Broken ──────────────────────────────────┐
  (auth errors, user_profiles table)                    │
                                                        ▼
P1 Complete MVP Loop ──────────────────────────────────┐│
  (editing, FSRS init, due counts, settings,           ││
   soft-delete, toasts)                                ││
         │                                             ││
         ├────── P2 Import & Export ←──────────────────┘│
         │         (Anki, CSV, JSON, Export)             │
         │                                              │
         ├────── P3 AI Agents ◄─────────────────────────┘
         │         (Card Coach, Topic Generator)
         │
         ├────── P4 Embeddings & Interleaving
         │         (pgvector, embedding pipeline, scheduler)
         │
         ├────── P5 Card Browser & Bulk Ops
         │         (search, filter, bulk actions)
         │
         ├────── P6 Statistics & Analytics
         │         (charts, retention, streaks)
         │
         ├────── P7 Advanced Scheduling
         │         (FSRS optimization, learning steps, Anki history)
         │
         └────── P8 Polish & Infrastructure
                   (mobile, keyboard, markdown, OAuth, tests, XSS)
```

### Parallelism Guide

| Can run together | Notes |
|---|---|
| P2 + P3 + P4 | All depend on P1, but are independent of each other |
| P5 + P6 | Both depend on P1, independent of each other |
| P7 + P8 | Both can start after P1, independent |
| P8 items | All internal items are independent |

### Strict ordering (must complete before)
- **P0** → **P1** (P1 Settings needs user_profiles from P0)
- **P1** → **P2, P3, P4, P5, P6, P7** (all need core features working)
- **P2 Anki parser** → **P7 Anki review history import** (reuses parser)

---

## Status Overview

### Completed

| Feature | Status | Notes |
|---|---|---|
| Next.js 15 scaffold | Done | App Router, TypeScript, Tailwind v4 |
| Supabase auth | Done | Login/signup/logout server actions, middleware |
| Database schema | Done | decks, cards, card_states, review_logs with RLS |
| Deck CRUD | Done | Create, list, delete |
| Card CRUD | Done | Create, list, delete (no edit yet) |
| FSRS v6 scheduling | Done | Review endpoint, state transitions via ts-fsrs |
| Study session | Done | Reveal flow, 4-button rating, progress bar |
| Dashboard | Done | Deck grid with card counts |
| Vitest + Testing Library | Done | Configured with happy-dom |
| Supabase error handling | Done | Connection & auth errors |
| Typecheck script | Done | `tsc --noEmit` |
| Playwright config | Done | `playwright.config.ts` created |
| E2E auth setup | Done | `e2e/auth.setup.ts` with test account |
| CLAUDE.md workflows | Done | Verification + TDD protocols |
| .gitignore updates | Done | Playwright artifacts |

### Done — P0 (Fix What's Broken)

| Feature | Status | Notes |
|---|---|---|
| Harden auth error handling | Done | `auth-errors.ts` with friendly error mapping, tests |
| User profiles table + migration | Done | `20260310000000_user_profiles.sql`, `getProfile`/`updateProfile` actions |

### Done — P1 (Complete MVP Loop)

| Feature | Status | Notes |
|---|---|---|
| Error toasts / feedback UI | Done | `Toast.tsx` with ToastProvider, useToast hook, portal rendering |
| FSRS init on card create | Done | `createCard()` creates card_states row with FSRS init |
| Card editing | Done | DeckDetail with edit mode, dirty detection, save/discard |
| Due count on dashboard | Done | Due count badges per deck on Dashboard |
| Soft-delete cards | Done | `archived_at` column, `deleteCard()` → soft delete, `restoreCard()` |
| Settings page | Done | Profile, scheduling (retention, daily limits), learning steps |

### Done — P2 (Import & Export)

| Feature | Status | Notes |
|---|---|---|
| Import records migration | Done | `20260310000002_import_records.sql` |
| JSON import | Done | `importJSON()` with schema validation |
| CSV/TSV import | Done | PapaParse with auto-detect delimiter, column mapping |
| Anki .apkg import | Done | JSZip + sql.js, field/tag extraction, revlog parsing |
| Export to CSV/JSON | Done | `exportDeckJSON()`, `exportDeckCSV()` |
| Export to Anki .apkg | Skipped | Complex binary format; CSV/JSON export covers use cases |

### Done — P3 (AI Agents)

| Feature | Status | Notes |
|---|---|---|
| Agent infrastructure | Done | `@anthropic-ai/sdk` singleton client |
| Card Coach Agent | Done | `/api/agents/coach` with `tool_use` structured output |
| Topic Generator Agent | Done | `/api/agents/generate` with JSON array parsing |
| Streaming UI | Done | CardCoachPanel, GenerateSession components |
| Rate limiting | Done | In-memory sliding window rate limiter |

### Done — P4 (Embeddings & Interleaving)

| Feature | Status | Notes |
|---|---|---|
| pgvector setup + migration | Done | `20260310000003_pgvector_embeddings.sql`, HNSW index |
| Embedding model integration | Done | `text-embedding-3-small` @ 512 dims |
| Embedding pipeline | Done | `generateAndStoreEmbedding()`, batch embeddings |
| Interleaving scheduler | Done | Greedy interleaving by cosine similarity |
| ANN index | Done | HNSW index with `match_similar_cards` RPC |

### Done — P5 (Card Browser)

| Feature | Status | Notes |
|---|---|---|
| Card browser (search/filter) | Done | Full browser with search, deck/state/tag filters, sort, pagination |
| Tag management | Done | `TagInput` component with autocomplete, `getUserTags()` |
| Bulk operations | Done | Bulk tag, move, archive via `bulkTagCards()`, `bulkMoveCards()`, `bulkDeleteCards()` |

### Done — P6 (Statistics)

| Feature | Status | Notes |
|---|---|---|
| Chart library + data layer | Done | recharts + @uiw/react-heat-map, 6 server actions |
| Review count chart | Done | Stacked bar chart with rating breakdown |
| Retention rate | Done | Line chart showing daily pass rate |
| Card maturity distribution | Done | Donut pie chart by FSRS state |
| Review forecast | Done | Bar chart of upcoming due cards |
| Study heatmap | Done | GitHub-style heatmap for past year |

### Done — P7 (Advanced Scheduling)

| Feature | Status | Notes |
|---|---|---|
| Configurable learning steps | Done | Settings UI, FSRS wrapper passes steps to scheduler |
| FSRS parameter optimization | Done | Server action with `@open-spaced-repetition/binding` (dynamic import) |
| Anki review history import | Done | Extended parser with revlog, `replayAnkiHistory()` FSRS replay |

### Done — P8 (Polish)

| Feature | Status | Notes |
|---|---|---|
| Keyboard shortcuts | Done | Space/Enter to reveal, 1-4 to rate, key hints shown |
| Markdown rendering | Done | `react-markdown` + `remark-gfm`, restricted elements |
| Input sanitization | Done | `sanitize()` strips HTML/scripts, CSP headers in `next.config.ts` |
| Tests | Done | FSRS wrapper tests (12 tests), auth error tests (4 tests) |
| Mobile responsive pass | Done | 2x2 rating grid, responsive headers, touch-friendly sizes |
| OAuth login | Done | Google/GitHub OAuth buttons, `/auth/callback` route |

---

## Plan Files Index

| Plan | Path | Features |
|---|---|---|
| P0 | [`docs/plans/P0-fix-whats-broken.md`](./P0-fix-whats-broken.md) | Auth errors, user profiles |
| P1 | [`docs/plans/P1-complete-mvp-loop.md`](./P1-complete-mvp-loop.md) | Card editing, FSRS init, due counts, settings, soft-delete, toasts |
| P2 | [`docs/plans/P2-import-export.md`](./P2-import-export.md) | Anki, CSV, JSON import/export |
| P3 | [`docs/plans/P3-ai-agents.md`](./P3-ai-agents.md) | Card Coach, Topic Generator, streaming |
| P4 | [`docs/plans/P4-embeddings-interleaving.md`](./P4-embeddings-interleaving.md) | pgvector, embeddings, interleaving |
| P5 | [`docs/plans/P5-card-browser.md`](./P5-card-browser.md) | Search, filter, bulk ops, tags |
| P6 | [`docs/plans/P6-statistics.md`](./P6-statistics.md) | Charts, retention, streaks, heatmap |
| P7 | [`docs/plans/P7-advanced-scheduling.md`](./P7-advanced-scheduling.md) | FSRS optimization, learning steps |
| P8 | [`docs/plans/P8-polish-infrastructure.md`](./P8-polish-infrastructure.md) | Mobile, keyboard, markdown, OAuth, tests |

---

## Quick Reference — What to Build Next

**If starting fresh**: P0 → P1 (in recommended order) → then pick from P2/P3/P4 based on priority

**Fastest path to launch-ready MVP**: P0 → P1 → P8 (keyboard + markdown + XSS) → P2 (Anki import only)

**Most impressive demo**: P0 → P1 → P3 (AI agents) → P6 (statistics)
