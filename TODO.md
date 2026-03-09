# Axon TODO

Last updated: 2026-03-09

## Done

- [x] Next.js 15 project scaffold (App Router, TypeScript, Tailwind v4)
- [x] Supabase auth (login/signup/logout server actions, middleware)
- [x] Database schema — decks, cards, card_states, review_logs with RLS
- [x] Deck CRUD (create, list, delete)
- [x] Card CRUD (create, list, delete within a deck)
- [x] FSRS v6 scheduling via ts-fsrs (review endpoint, state transitions)
- [x] Study session — reveal flow, 4-button rating, progress bar
- [x] Dashboard — deck grid with card counts
- [x] Vitest + Testing Library configured
- [x] Supabase connection & auth error handling

---

## Prerequisites — Verification Infrastructure

- [x] Add `typecheck` script to package.json
- [x] Install Playwright + chromium
- [x] Create `playwright.config.ts`
- [x] Create `e2e/auth.setup.ts` with test account auth
- [x] Update CLAUDE.md with verification workflows
- [x] Update `.gitignore` for Playwright artifacts

---

## P0 — Fix What's Broken

- [ ] Harden auth error handling (show meaningful errors instead of JSON parse failures)
- [ ] Add user profiles table (`desired_retention`, `display_name`) to migration

## P1 — Complete the MVP Loop

These make the core review experience usable end-to-end.

- [ ] Card editing — update front/back content from deck detail page
- [ ] New card FSRS initialization — create `card_states` row on card create (currently only created on first review)
- [ ] Due count on dashboard — show per-deck due counts on deck cards
- [ ] Settings page — desired retention, max new cards/day, max reviews/day
- [ ] Soft-delete cards (archive flag) — preserve review logs per spec
- [ ] Basic error toasts / feedback in UI

## P2 — Import & Export

Key for user acquisition (Anki migration path).

- [ ] Anki `.apkg` import — parse zip/SQLite, extract notes → cards
- [ ] CSV/TSV import — file upload, column mapping UI, preview
- [ ] JSON import — defined schema
- [ ] Import records table in migration
- [ ] Export to CSV/JSON
- [ ] Export to Anki `.apkg` (round-trip)

## P3 — AI Agents (Claude Agent SDK)

Core pillar #2 from the spec.

- [ ] Card Coach Agent — quality feedback on card create/edit
- [ ] Topic Generator Agent — generate cards from a topic description
- [ ] Streaming UI for agent responses
- [ ] Rate limiting per user
- [ ] Agent opt-in setting

## P4 — Embeddings & Interleaving

Core pillar #3 from the spec.

- [ ] Enable pgvector extension, add `embedding` vector column to cards
- [ ] Embedding generation pipeline (on card create/edit/import)
- [ ] Choose embedding model (voyage-3-lite / text-embedding-3-small / local)
- [ ] Vector-based interleaving scheduler — cosine similarity ordering of due cards
- [ ] Interleaving toggle in settings
- [ ] ANN index (IVFFlat or HNSW) for fast similarity queries

## P5 — Card Browser & Bulk Operations

- [ ] Searchable/filterable card browser across all decks
- [ ] Sort by tags, due date, creation date, state
- [ ] Bulk tag, delete, export
- [ ] Tag management UI on cards

## P6 — Statistics & Analytics

- [ ] Review count over time chart
- [ ] Retention rate visualization
- [ ] Card maturity distribution
- [ ] Upcoming review forecast
- [ ] Study streak / heatmap

## P7 — Advanced Scheduling

- [ ] FSRS parameter optimization (background job, ≥1,000 reviews)
- [ ] `fsrs_weights` column on user profiles
- [ ] Configurable learning steps (1m, 10m defaults)
- [ ] Configurable relearning steps
- [ ] Review history import from Anki for FSRS bootstrapping

## P8 — Polish & Infrastructure

- [ ] Mobile responsive pass
- [ ] Keyboard shortcuts in study session (1-4 for ratings, space to reveal)
- [ ] Tests — FSRS wrapper, review endpoint, server actions, key components
- [ ] OAuth login (Google, GitHub)
- [ ] Markdown rendering in card content (front/back)
- [ ] Input sanitization on card content (XSS prevention)

## Out of Scope (v2+)

- Cloze deletions, image occlusion, audio cards
- Hierarchical deck/folder organization
- Collaborative decks / sharing
- Mobile native apps
- Offline support (service worker + IndexedDB)
- Agent-assisted review (explanations during study)
- Adaptive interleaving threshold
- LLM-based semantic search across cards
