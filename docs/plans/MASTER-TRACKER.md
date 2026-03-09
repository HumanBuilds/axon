# Axon — Master Feature Tracker

**Last updated**: 2026-03-09
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

### Not Started — P0 (Fix What's Broken)

| Feature | Status | Plan | Effort |
|---|---|---|---|
| Harden auth error handling | Not started | [P0 Plan](./P0-fix-whats-broken.md#feature-1-harden-auth-error-handling) | Small (1-2 hrs) |
| User profiles table + migration | Not started | [P0 Plan](./P0-fix-whats-broken.md#feature-2-add-user-profiles-table) | Small (1-2 hrs) |

### Not Started — P1 (Complete MVP Loop)

| Feature | Status | Plan | Effort |
|---|---|---|---|
| Error toasts / feedback UI | Not started | [P1 Plan](./P1-complete-mvp-loop.md#feature-1-error-toasts--feedback-ui) | Medium (3-4 hrs) |
| FSRS init on card create | Not started | [P1 Plan](./P1-complete-mvp-loop.md#feature-2-fsrs-initialization-on-card-create) | Small (1-2 hrs) |
| Card editing | Not started | [P1 Plan](./P1-complete-mvp-loop.md#feature-3-card-editing) | Medium (3-4 hrs) |
| Due count on dashboard | Not started | [P1 Plan](./P1-complete-mvp-loop.md#feature-4-due-count-on-dashboard) | Small (1-2 hrs) |
| Soft-delete cards | Not started | [P1 Plan](./P1-complete-mvp-loop.md#feature-5-soft-delete-cards) | Small (1-2 hrs) |
| Settings page | Not started | [P1 Plan](./P1-complete-mvp-loop.md#feature-6-settings-page) | Medium (4-5 hrs) |

### Not Started — P2 (Import & Export)

| Feature | Status | Plan | Effort |
|---|---|---|---|
| Import records migration | Not started | [P2 Plan](./P2-import-export.md#feature-0-import-records-migration) | Small (30 min) |
| JSON import | Not started | [P2 Plan](./P2-import-export.md#feature-1-json-import) | Medium (2-3 hrs) |
| CSV/TSV import | Not started | [P2 Plan](./P2-import-export.md#feature-2-csvtsv-import) | Medium (3-4 hrs) |
| Anki .apkg import | Not started | [P2 Plan](./P2-import-export.md#feature-3-anki-apkg-import) | Large (6-8 hrs) |
| Export to CSV/JSON | Not started | [P2 Plan](./P2-import-export.md#feature-4-export-to-csvjson) | Medium (2-3 hrs) |
| Export to Anki .apkg | Not started | [P2 Plan](./P2-import-export.md#feature-5-export-to-anki-apkg) | Large (4-6 hrs) |

### Not Started — P3 (AI Agents)

| Feature | Status | Plan | Effort |
|---|---|---|---|
| Agent infrastructure | Not started | [P3 Plan](./P3-ai-agents.md#feature-0-agent-infrastructure) | Medium (3-4 hrs) |
| Card Coach Agent | Not started | [P3 Plan](./P3-ai-agents.md#feature-1-card-coach-agent) | Medium (4-5 hrs) |
| Topic Generator Agent | Not started | [P3 Plan](./P3-ai-agents.md#feature-2-topic-generator-agent) | Large (5-6 hrs) |
| Streaming UI | Not started | [P3 Plan](./P3-ai-agents.md#feature-3-streaming-ui-pattern) | Medium (3-4 hrs) |
| Rate limiting | Not started | [P3 Plan](./P3-ai-agents.md#feature-4-rate-limiting) | Small (1-2 hrs) |

### Not Started — P4 (Embeddings & Interleaving)

| Feature | Status | Plan | Effort |
|---|---|---|---|
| pgvector setup + migration | Not started | [P4 Plan](./P4-embeddings-interleaving.md#feature-1-enable-pgvector--add-embedding-column) | Small (1 hr) |
| Embedding model integration | Not started | [P4 Plan](./P4-embeddings-interleaving.md#feature-2-embedding-model-selection--integration) | Medium (2-3 hrs) |
| Embedding pipeline | Not started | [P4 Plan](./P4-embeddings-interleaving.md#feature-3-embedding-generation-pipeline) | Medium (3-4 hrs) |
| Interleaving scheduler | Not started | [P4 Plan](./P4-embeddings-interleaving.md#feature-4-vector-based-interleaving-scheduler) | Medium (4-5 hrs) |
| ANN index | Not started | [P4 Plan](./P4-embeddings-interleaving.md#feature-5-ann-index-for-fast-similarity) | Small (1 hr) |

### Not Started — P5 (Card Browser)

| Feature | Status | Plan | Effort |
|---|---|---|---|
| Card browser (search/filter) | Not started | [P5 Plan](./P5-card-browser.md#feature-1-card-browser) | Large (5-6 hrs) |
| Tag management | Not started | [P5 Plan](./P5-card-browser.md#feature-2-tag-management) | Medium (3-4 hrs) |
| Bulk operations | Not started | [P5 Plan](./P5-card-browser.md#feature-3-bulk-operations) | Medium (3-4 hrs) |

### Not Started — P6 (Statistics)

| Feature | Status | Plan | Effort |
|---|---|---|---|
| Chart library + data layer | Not started | [P6 Plan](./P6-statistics.md#feature-0-chart-library--data-layer) | Medium (2-3 hrs) |
| Review count chart | Not started | [P6 Plan](./P6-statistics.md#feature-2-review-count-over-time) | Medium (2-3 hrs) |
| Retention rate | Not started | [P6 Plan](./P6-statistics.md#feature-3-retention-rate) | Medium (2-3 hrs) |
| Card maturity distribution | Not started | [P6 Plan](./P6-statistics.md#feature-4-card-maturity-distribution) | Small (1-2 hrs) |
| Review forecast | Not started | [P6 Plan](./P6-statistics.md#feature-5-review-forecast) | Small (1-2 hrs) |
| Study heatmap | Not started | [P6 Plan](./P6-statistics.md#feature-6-study-streak--heatmap) | Medium (3-4 hrs) |

### Not Started — P7 (Advanced Scheduling)

| Feature | Status | Plan | Effort |
|---|---|---|---|
| Configurable learning steps | Not started | [P7 Plan](./P7-advanced-scheduling.md#feature-1-configurable-learning-steps) | Medium (2-3 hrs) |
| FSRS parameter optimization | Not started | [P7 Plan](./P7-advanced-scheduling.md#feature-2-fsrs-parameter-optimization) | Large (5-6 hrs) |
| Anki review history import | Not started | [P7 Plan](./P7-advanced-scheduling.md#feature-3-anki-review-history-import) | Medium (3-4 hrs) |

### Not Started — P8 (Polish)

| Feature | Status | Plan | Effort |
|---|---|---|---|
| Keyboard shortcuts | Not started | [P8 Plan](./P8-polish-infrastructure.md#feature-1-keyboard-shortcuts-in-study-session) | Small (1 hr) |
| Markdown rendering | Not started | [P8 Plan](./P8-polish-infrastructure.md#feature-2-markdown-rendering) | Small (1-2 hrs) |
| Input sanitization | Not started | [P8 Plan](./P8-polish-infrastructure.md#feature-3-input-sanitization-xss-prevention) | Small (1-2 hrs) |
| Tests | Not started | [P8 Plan](./P8-polish-infrastructure.md#feature-4-tests) | Large (6-8 hrs) |
| Mobile responsive pass | Not started | [P8 Plan](./P8-polish-infrastructure.md#feature-5-mobile-responsive-pass) | Large (4-6 hrs) |
| OAuth login | Not started | [P8 Plan](./P8-polish-infrastructure.md#feature-6-oauth-login-google-github) | Medium (2-3 hrs) |

---

## Remaining Prerequisite

| Feature | Status | Notes |
|---|---|---|
| Install Playwright + Chromium | Not started | `npx playwright install chromium` — needed for E2E tests |

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
