# Product Spec: Flashcard App

## 1. Overview

A web-based flashcard application that combines modern spaced repetition scheduling (FSRS) with AI-powered card authoring and an embedding-driven interleaving system. The app helps users create high-quality flashcards, generates cards from topics on demand, and schedules reviews using both memory-model-based spacing and semantic interleaving to strengthen cross-topic discrimination.

### Core Pillars

- **FSRS scheduling** — state-of-the-art, per-card memory modeling with trainable parameters.
- **AI agents** — powered by the Anthropic Claude Agent SDK — for card quality coaching and topic-based card generation.
- **Vector-based interleaving** — embedding similarity drives review ordering so that semantically related cards from *different* topics appear near each other, training the user to discriminate between confusable concepts.

---

## 2. Platform & Tech Stack

| Layer | Choice |
|---|---|
| Platform | Web app (SPA), responsive for mobile browsers |
| Frontend | React / Next.js (or similar) with TypeScript |
| Backend / API | Node.js or Python (FastAPI) — TBD |
| Database | PostgreSQL (cards, decks, review logs, user data) |
| Vector store | pgvector extension on PostgreSQL (or a dedicated store like Qdrant / Pinecone) |
| Embedding model | A lightweight model such as `voyage-3-lite`, OpenAI `text-embedding-3-small`, or a local model like `all-MiniLM-L6-v2` — TBD based on latency/cost requirements |
| AI agents | Anthropic Claude Agent SDK (TypeScript or Python) |
| Scheduling engine | FSRS v6 (via `py-fsrs` or a TypeScript port) |
| Auth | Email/password + OAuth (Google, GitHub) |
| Hosting | TBD (Vercel, Railway, self-hosted, etc.) |

---

## 3. Data Model

### 3.1 Card

```
Card {
  id              UUID
  user_id         UUID
  front           text          // supports markdown
  back            text          // supports markdown
  tags            text[]
  source          enum          // "manual" | "ai_generated" | "imported"
  embedding       vector(384)   // or whatever dim the model uses
  created_at      timestamp
  updated_at      timestamp
}
```

### 3.2 FSRS Memory State (per card, per user)

```
CardState {
  card_id         UUID
  user_id         UUID
  stability       float         // S — days until R drops to 90%
  difficulty      float         // D — inherent difficulty [1–10]
  retrievability  float         // R — current recall probability
  state           enum          // "new" | "learning" | "review" | "relearning"
  due             timestamp     // next scheduled review
  last_review     timestamp
  reps            int           // total successful reviews
  lapses          int           // total lapses (forgotten)
  scheduled_days  float         // interval in days
}
```

### 3.3 Review Log

```
ReviewLog {
  id              UUID
  card_id         UUID
  user_id         UUID
  rating          enum          // "again" | "hard" | "good" | "easy"
  elapsed_days    float         // days since last review
  scheduled_days  float         // interval that was assigned
  state_before    json          // snapshot of S, D, R before review
  state_after     json          // snapshot of S, D, R after review
  reviewed_at     timestamp
}
```

Review logs serve two purposes: they provide the training data for per-user FSRS parameter optimization, and they power the statistics dashboard.

### 3.4 User

```
User {
  id              UUID
  email           text
  display_name    text
  fsrs_weights    float[21]     // personalized FSRS-6 parameters (nullable; defaults used until enough data)
  desired_retention float       // default 0.9
  created_at      timestamp
}
```

### 3.5 Import Record

```
Import {
  id              UUID
  user_id         UUID
  format          enum          // "anki_apkg" | "csv" | "tsv" | "json"
  filename        text
  card_count      int
  imported_at     timestamp
}
```

---

## 4. Features

### 4.1 Card Management (CRUD)

**Create a card**
- User provides front (prompt) and back (answer) as markdown.
- On save, the system:
  1. Persists the card.
  2. Generates an embedding from the combined front + back text and stores it.
  3. Initializes a new FSRS memory state (state = `new`).
  4. Optionally (if the user has the setting enabled), routes the card through the **Card Coach Agent** for quality suggestions before finalizing.

**Edit a card**
- Any edit to front or back triggers re-embedding.
- If the card has existing review history, the user is warned that significant edits may invalidate their memory state and offered the option to reset it.

**Delete a card**
- Soft-delete (archived). Review logs are preserved for FSRS optimization.

**Bulk operations**
- Multi-select for tagging, deleting, or exporting.

### 4.2 Import / Export

**Import**
- **Anki `.apkg` files** — parse the SQLite database inside the archive, extract notes/cards, map fields to front/back, and import tags. Optionally import review history for FSRS bootstrapping.
- **CSV / TSV** — column mapping UI (which column is front, back, tags).
- **JSON** — a defined schema for programmatic import.

On import, embeddings are generated for all imported cards (batched, background job).

**Export**
- Export to CSV, JSON, or Anki-compatible `.apkg`.
- Include or exclude review history.

### 4.3 Review Session

A review session presents due cards to the user and collects ratings.

**Session flow:**

1. **Fetch due cards.** Query all cards where `due <= now` ordered by the interleaving scheduler (see §5.2).
2. **Present card.** Show the front. User mentally recalls, then reveals the back.
3. **Rate.** The user picks one of four ratings: *Again*, *Hard*, *Good*, *Easy*.
4. **Update memory state.** Pass the rating through the FSRS algorithm to compute the new S, D, R, and next due date.
5. **Log the review.** Write a `ReviewLog` entry with before/after state snapshots.
6. **Next card.** Repeat until the queue is empty or the user ends the session.

**Session settings (user-configurable):**
- Maximum new cards per day (default: 20).
- Maximum reviews per day (optional cap).
- Learning steps for new cards (default: 1m, 10m).
- Order: interleaved (default) or sequential by due date.

### 4.4 FSRS Scheduling

The app implements FSRS v6 as the core scheduling algorithm.

**Key behaviors:**

- **DSR model.** Each card carries its own Difficulty (D), Stability (S), and Retrievability (R). These are updated after every review based on the user's rating and the FSRS formulas.
- **Desired retention.** The user sets a target retention rate (default 0.9). The scheduler computes the optimal interval such that R is predicted to equal the desired retention at the moment of the next review.
- **Learning / relearning steps.** New cards and lapsed cards pass through short-interval learning steps before entering the long-term review cycle.
- **Parameter optimization.** Once a user accumulates ≥1,000 reviews, the system can optimize their personal FSRS weights using gradient descent on their review history. This runs as a background job (triggered manually or on a schedule) and updates `User.fsrs_weights`.
- **Fuzz factor.** A small random offset is applied to intervals to prevent cards from clustering on the same day.

**Implementation:** Use the `py-fsrs` library (v6.x) on the backend, or a TypeScript port if the backend is Node-based. The library handles state transitions and interval computation; the app is responsible for persisting state and serving the review queue.

### 4.5 Import of Review History for FSRS Bootstrapping

When importing from Anki, if the user includes review history, the system can:
1. Replay the history through FSRS to reconstruct current memory states.
2. Optionally run parameter optimization immediately on the imported data.

This allows users migrating from Anki to get personalized scheduling from day one.

---

## 5. Interleaving Scheduler (Vector-Based)

### 5.1 Motivation

Traditional spaced repetition apps present due cards in a random or chronological order. Research on interleaved practice shows that reviewing similar-but-distinct items together improves the learner's ability to discriminate between them — e.g., distinguishing mitosis from meiosis, or Spanish *ser* from *estar*.

### 5.2 How It Works

The interleaving scheduler is a **review-ordering layer that sits on top of FSRS**. FSRS decides *when* a card is due; the interleaving scheduler decides *in what order* due cards are presented within a session.

**Algorithm outline:**

1. **Collect due cards.** Gather all cards where `due <= now`, along with their embeddings and tags.
2. **Cluster by topic.** Group cards by their tags (primary signal) or, if tags are sparse, by k-means clustering on their embeddings.
3. **Build an interleaved queue.** For each card in the queue, use cosine similarity on the embeddings to find the next card that is:
   - **Semantically similar** (high cosine similarity, e.g., > 0.7 threshold) — so the user must actively discriminate.
   - **From a different topic cluster** — so the interleaving forces cross-topic comparison.
4. **Fallback.** If no good interleaving candidate exists (e.g., only one topic is due), fall back to FSRS due-date ordering.
5. **Avoid back-to-back duplicates.** Never show two cards from the same narrow cluster consecutively unless no alternative exists.

**Tuning parameters (configurable):**
- Similarity threshold (default 0.7).
- Minimum topic switch frequency (e.g., switch topics at least every 3 cards).
- Whether interleaving is enabled at all (user toggle; some users may prefer pure FSRS ordering).

### 5.3 Embedding Pipeline

- **When:** Embeddings are generated on card creation, card edit, and bulk import.
- **Model:** A sentence-transformer or API-based embedding model (see §2). The same model must be used consistently for all cards in a user's collection to ensure comparable vectors.
- **Storage:** Stored in a `vector` column on the `Card` table (via pgvector) for efficient similarity queries.
- **Querying:** Use pgvector's approximate nearest-neighbor index (IVFFlat or HNSW) for fast similarity lookups during session construction.

---

## 6. AI Agents (Anthropic Claude Agent SDK)

Both agents are built using the [Claude Agent SDK](https://docs.claude.com/en/api/agent-sdk/overview) and run on the backend. They use Claude as the underlying model and are configured with custom system prompts, tools, and guardrails.

### 6.1 Card Coach Agent

**Purpose:** Review a user's newly created card and suggest improvements to make it a more effective flashcard.

**When triggered:**
- Automatically after card creation (if the user has opted in via a setting).
- On-demand via a "Get suggestions" button on any card.

**Agent configuration:**

```
System prompt:
  You are an expert flashcard coach. You follow evidence-based principles
  for effective flashcards:
  - The minimum information principle: each card should test one atomic idea.
  - No ambiguity: the question should have exactly one correct answer.
  - Use cloze deletions where appropriate.
  - Avoid sets and enumerations unless broken into individual cards.
  - Include context and connections to aid encoding.
  - Use concrete examples over abstract definitions.

  You will receive a card's front and back. Provide specific, actionable
  suggestions. If the card is already good, say so.

Tools: none (pure text generation)
```

**Input:** `{ front: string, back: string, tags: string[] }`

**Output:**
```
{
  suggestions: string,         // markdown-formatted feedback
  revised_front: string | null,  // suggested rewrite (null if no change needed)
  revised_back: string | null,
  should_split: boolean,       // true if the card covers multiple ideas
  split_cards: { front, back }[] | null  // suggested split if applicable
}
```

**UX flow:**
1. User creates or edits a card.
2. The agent's suggestions appear in a side panel or inline below the card editor.
3. The user can accept all suggestions, accept selectively (diff-style), or dismiss.
4. If the agent suggests splitting, the UI shows a preview of the proposed child cards with an "Apply split" button.

### 6.2 Topic Generator Agent

**Purpose:** Given a topic or subject, generate a set of high-quality flashcards covering the key concepts.

**When triggered:** User navigates to a "Generate cards" view and enters a topic description.

**Agent configuration:**

```
System prompt:
  You are an expert flashcard author. Given a topic, generate a comprehensive
  set of flashcards that cover the key concepts, terms, and relationships.

  Follow these principles:
  - One idea per card (minimum information principle).
  - Mix card types: definition, explanation, example-based, comparison.
  - Order cards from foundational concepts to advanced.
  - Use clear, unambiguous language.
  - Tag each card with relevant subtopics.
  - Generate between 10–30 cards unless the user specifies a count.

Tools:
  - web_search (optional): to look up accurate information on the topic
```

**Input:**
```
{
  topic: string,           // e.g., "Photosynthesis" or "JavaScript Promises"
  depth: "beginner" | "intermediate" | "advanced",
  card_count: number | null,  // user override; otherwise agent decides
  notes: string | null        // any user instructions, e.g. "focus on error handling"
}
```

**Output:**
```
{
  cards: [
    { front: string, back: string, tags: string[] }
  ]
}
```

**UX flow:**
1. User enters a topic, selects depth, and optionally provides notes.
2. The agent streams its output. Cards appear one-by-one in a preview list.
3. The user can edit, remove, or approve each card individually.
4. "Add all" or "Add selected" saves the approved cards to the user's collection (triggering embedding generation and FSRS state initialization).

### 6.3 Agent Infrastructure

- **SDK version:** Latest Claude Agent SDK (TypeScript or Python, matching the backend).
- **Model:** Claude Sonnet (for speed/cost balance) by default; configurable to Opus for higher quality.
- **Rate limiting:** Agent calls are rate-limited per user (e.g., 20 requests/hour for generation, 60/hour for coaching) to control API costs.
- **Streaming:** Both agents stream responses to the frontend for responsive UX.
- **Error handling:** If the agent fails or times out, the user sees a clear error message and can retry. Card creation is never blocked by agent failure.

---

## 7. Import / Export Details

### 7.1 Anki Import (`.apkg`)

An `.apkg` file is a zip archive containing a SQLite database. The import pipeline:

1. Upload the file.
2. Extract and open the SQLite DB.
3. Parse the `notes` table: extract fields, map to front/back based on the note type's field names.
4. Parse the `cards` table: link cards to notes.
5. Import tags from the `notes.tags` column.
6. Optionally parse the `revlog` table for review history.
7. Present a preview to the user showing card count, tags found, and any mapping issues.
8. On confirmation, persist cards, generate embeddings (background job), and initialize FSRS states.

### 7.2 CSV / TSV Import

1. Upload file.
2. Auto-detect delimiter and encoding.
3. Show a column-mapping UI: the user assigns columns to front, back, and (optionally) tags.
4. Preview first 10 rows.
5. On confirmation, import with same post-processing as above.

### 7.3 Export

- **CSV:** front, back, tags columns. Optional: include FSRS state columns.
- **JSON:** structured export with full card data and optionally review logs.
- **Anki `.apkg`:** generate a SQLite DB in the Anki schema, package as a zip. This enables round-tripping.

---

## 8. Non-Functional Requirements

### 8.1 Performance

- Card lookup and review queue construction should complete in < 200ms for collections of up to 100,000 cards.
- Embedding generation should be async/background and not block card creation.
- Vector similarity queries (for interleaving) should use an ANN index and complete in < 50ms.

### 8.2 Security

- All API endpoints require authentication.
- User data is isolated — no user can access another user's cards or review history.
- API keys for Anthropic and embedding services are stored server-side, never exposed to the client.
- Input sanitization on all card content (markdown rendering must prevent XSS).

### 8.3 Reliability

- Review logs are append-only and treated as critical data (no accidental deletion).
- FSRS state updates are transactional — a failed state write must not leave a card in an inconsistent state.
- Agent failures are isolated and do not affect core review functionality.

### 8.4 Scalability

- The system should support thousands of concurrent users with independent card collections.
- Embedding generation can be offloaded to a job queue (e.g., Redis + worker) for bulk imports.
- FSRS parameter optimization is compute-intensive and should run as a background job.

---

## 9. User-Facing Pages / Views

| View | Description |
|---|---|
| **Dashboard** | Summary of due cards, recent activity, streak. |
| **Card Browser** | Searchable, filterable list of all cards. Supports bulk operations. |
| **Card Editor** | Create / edit a card. Side panel for Card Coach Agent suggestions. |
| **Review Session** | Full-screen review interface. Shows front → reveal back → rate. Progress bar. |
| **Generate Cards** | Topic input + depth selector. Streams generated cards for review. |
| **Import** | Upload `.apkg`, CSV, or JSON. Column mapping and preview. |
| **Export** | Select format, options, and download. |
| **Settings** | Desired retention, daily limits, learning steps, interleaving toggle, agent opt-in, FSRS optimization trigger. |
| **Statistics** | Review count over time, retention rate, card maturity distribution, forecast of upcoming reviews, heatmap. |

---

## 10. Open Questions & Future Considerations

These items are out of scope for v1 but worth tracking:

1. **Multiple card types.** v1 supports basic front/back cards only. Cloze deletions, image occlusion, and audio cards are natural extensions.
2. **Deck / folder organization.** v1 uses a flat collection with tags. Hierarchical decks could be added later.
3. **Collaborative decks / sharing.** Users could publish or share decks. Requires a permissions model.
4. **Mobile native apps.** v1 is web-only. A mobile app (React Native or similar) could be added if demand warrants it.
5. **Offline support.** Service worker + IndexedDB for offline reviews, synced when back online.
6. **Agent-assisted review.** An agent that detects when a user is struggling with a card and offers an explanation or mnemonic during the review session.
7. **Adaptive interleaving.** Track whether interleaving actually improves discrimination for each user and adjust the similarity threshold dynamically.
8. **Image / media support.** Allow images, audio, and LaTeX in card content.
9. **LLM-based search.** Use embeddings for semantic search across the card collection (e.g., "find all my cards about cell division").

---

## 11. Summary of Key Integrations

| Integration | Purpose | Notes |
|---|---|---|
| **FSRS v6** (`py-fsrs` / TS port) | Per-card spaced repetition scheduling | 21 trainable parameters, DSR memory model |
| **Claude Agent SDK** | Powers Card Coach and Topic Generator agents | TypeScript or Python SDK, uses Claude Sonnet by default |
| **Embedding model** | Generates vector representations of cards | Used for interleaving scheduler and future semantic search |
| **pgvector** | Stores and queries card embeddings efficiently | ANN index for fast similarity lookup |
