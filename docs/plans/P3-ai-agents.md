# P3 — AI Agents (Claude Agent SDK)

**Priority**: Medium — core pillar #2 from spec
**Dependencies**: P1 (card editing, FSRS init, toasts)
**Can run in parallel with**: P2, P4, P5, P6

---

## Overview

Two AI agents powered by the Anthropic Claude Agent SDK:
1. **Card Coach Agent** — reviews flashcard quality and suggests improvements
2. **Topic Generator Agent** — generates flashcards from a topic description
3. **Streaming UI** for real-time agent responses
4. **Rate limiting** per user
5. **Agent opt-in setting** (from P1 Settings)

### Internal Dependencies

```
Agent infrastructure (SDK setup, streaming, rate limiting) ──→ Both agents
Card Coach Agent ──── independent of Topic Generator
Topic Generator ──── independent of Card Coach
```

**Recommended build order**: Agent infrastructure → Card Coach → Topic Generator

---

## Feature 0: Agent Infrastructure

### Step 1: Install Claude Agent SDK
**Package**: `@anthropic-ai/sdk` (latest)

Add to `package.json` dependencies.

### Step 2: API key management
**File**: `.env.local`

```
ANTHROPIC_API_KEY=sk-ant-...
```

- Store server-side only, never expose to client
- Add `ANTHROPIC_API_KEY` to `.env.local.example`

### Step 3: Create agent client singleton
**File**: `src/lib/agents/client.ts`

```typescript
import Anthropic from "@anthropic-ai/sdk";

let client: Anthropic | null = null;

export function getAnthropicClient(): Anthropic {
  if (!client) {
    client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return client;
}
```

### Step 4: Rate limiting middleware
**File**: `src/lib/agents/rate-limit.ts`

- In-memory rate limiter (or Redis if available)
- Per-user limits:
  - Card Coach: 60 requests/hour
  - Topic Generator: 20 requests/hour
- Return `429 Too Many Requests` when exceeded
- Include `Retry-After` header

### Step 5: Streaming helper
**File**: `src/lib/agents/stream.ts`

- Helper to convert Claude SDK streaming response to `ReadableStream`
- Used by API routes to stream to the frontend
- Pattern: `return new Response(stream, { headers: { "Content-Type": "text/event-stream" } })`

### Step 6: Error handling wrapper
**File**: `src/lib/agents/errors.ts`

- Catch Anthropic API errors (rate limits, overloaded, invalid key)
- Map to user-friendly error messages
- Never expose API keys or internal errors to client

---

## Feature 1: Card Coach Agent

### Purpose
Review a user's flashcard and suggest improvements based on evidence-based flashcard principles.

### Implementation Steps

#### Step 1: Create Card Coach API route
**File**: `src/app/api/agents/coach/route.ts`

```typescript
export async function POST(request: NextRequest) {
  // Auth check
  // Rate limit check
  // Parse body: { front, back, tags }
  // Call Claude with system prompt + user card
  // Stream response
}
```

#### Step 2: System prompt
```
You are an expert flashcard coach. You follow evidence-based principles:
- Minimum information principle: each card should test one atomic idea
- No ambiguity: the question should have exactly one correct answer
- Avoid sets and enumerations unless broken into individual cards
- Include context and connections to aid encoding
- Use concrete examples over abstract definitions

You will receive a card's front and back. Provide specific, actionable suggestions.
If the card is already good, say so briefly.

Respond in JSON format:
{
  "suggestions": "markdown-formatted feedback",
  "revised_front": "suggested rewrite or null",
  "revised_back": "suggested rewrite or null",
  "should_split": false,
  "split_cards": null
}
```

#### Step 3: Card Coach UI
**File**: `src/components/deck/CardCoachPanel.tsx`

- "Get suggestions" button on each card in edit mode
- Slide-in panel or inline section below the card editor
- Shows streaming suggestions as they arrive
- "Apply" button to accept revised front/back
- "Apply split" button if agent suggests splitting
- Dismiss button

#### Step 4: Integration with card editing
**File**: `src/components/deck/DeckDetail.tsx`

- Add "Get suggestions" button when card is in edit mode
- Wire up to Card Coach panel

#### Step 5: Tests
- Test API route returns structured suggestions
- Test rate limiting rejects excessive requests
- Test UI renders suggestions correctly
- Test "Apply" updates card fields

### Model Selection
- Default: `claude-sonnet-4-6` (speed/cost balance)
- Could make configurable in settings later (Opus for higher quality)

---

## Feature 2: Topic Generator Agent

### Purpose
Generate a set of flashcards from a topic description.

### Implementation Steps

#### Step 1: Create generator page
**File**: `src/app/(dashboard)/generate/page.tsx`

- Topic input (text area)
- Depth selector: Beginner / Intermediate / Advanced
- Card count input (optional, default: agent decides)
- Notes/instructions input (optional)
- Target deck selector (existing deck or create new)
- "Generate" button

#### Step 2: Create generator API route
**File**: `src/app/api/agents/generate/route.ts`

```typescript
export async function POST(request: NextRequest) {
  // Auth check
  // Rate limit check (stricter: 20/hour)
  // Parse body: { topic, depth, card_count, notes, deck_id }
  // Call Claude with system prompt
  // Stream response — emit cards as JSON objects separated by newlines
}
```

#### Step 3: System prompt
```
You are an expert flashcard author. Given a topic, generate comprehensive
flashcards covering key concepts, terms, and relationships.

Principles:
- One idea per card (minimum information principle)
- Mix types: definition, explanation, example-based, comparison
- Order from foundational to advanced
- Clear, unambiguous language
- Tag each card with relevant subtopics
- Generate 10-30 cards unless the user specifies a count

Respond with a JSON array of cards:
[{ "front": "...", "back": "...", "tags": ["..."] }]
```

#### Step 4: Streaming card preview
**File**: `src/components/generate/GenerateSession.tsx`

- Cards appear one-by-one as they stream in
- Each card shows front/back in a preview card
- Checkbox to select/deselect individual cards
- Edit button to modify a card before saving
- "Add all" / "Add selected" buttons at the bottom
- Progress indicator during generation

#### Step 5: Save generated cards
- Selected cards → `createCard()` for each (with `source: "ai_generated"`)
- Batch insert for performance
- Show success toast: "Added X cards to [deck name]"
- Navigate to deck detail page

#### Step 6: Tests
- Test generator page renders all form fields
- Test streaming response is parsed into cards
- Test individual card selection/deselection
- Test "Add selected" creates correct number of cards

---

## Feature 3: Streaming UI Pattern

### Implementation Steps

#### Step 1: useStreamingResponse hook
**File**: `src/lib/hooks/useStreamingResponse.ts`

```typescript
export function useStreamingResponse<T>(url: string) {
  const [data, setData] = useState<T | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function start(body: Record<string, unknown>) {
    setIsStreaming(true);
    setError(null);
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    // Read stream, parse chunks, update state
    // Handle errors gracefully
    setIsStreaming(false);
  }

  return { data, isStreaming, error, start };
}
```

#### Step 2: SSE format for streaming
- Use Server-Sent Events (SSE) format for streaming
- Each event is a JSON object on its own line
- Final event signals completion
- Error events include error message

### Edge Cases
- Network disconnect during streaming → show partial results + retry option
- User navigates away → abort controller cancels stream
- Very long generation (60+ seconds) → show elapsed time
- Agent produces invalid JSON → skip that card, show warning

---

## Feature 4: Rate Limiting

### Implementation Steps

#### Step 1: Rate limit store
**File**: `src/lib/agents/rate-limit.ts`

- Simple in-memory store with sliding window
- Key: `${userId}:${agentType}`
- For production: move to Redis/Upstash

#### Step 2: Rate limit middleware
- Check before each agent API call
- Return `429` with `Retry-After` header
- Show user-friendly message in UI: "You've used all your suggestions for this hour. Try again in X minutes."

---

## Verification Checklist

- [ ] `npm run typecheck` — zero errors
- [ ] `npm run lint` — zero errors
- [ ] `npm run test:run` — all tests pass
- [ ] Manual: Card Coach provides suggestions for a card
- [ ] Manual: Apply suggestion updates card content
- [ ] Manual: Topic Generator streams cards progressively
- [ ] Manual: Select and save generated cards to a deck
- [ ] Manual: Rate limit kicks in after threshold
- [ ] Manual: Error handling for API failures
