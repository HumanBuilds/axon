# P8 — Polish & Infrastructure

**Priority**: Low — quality-of-life improvements
**Dependencies**: Varies per feature (noted below)
**Can run in parallel with**: Most other work

---

## Overview

Cross-cutting polish and infrastructure:
1. Mobile responsive pass
2. Keyboard shortcuts in study session
3. Tests — FSRS wrapper, review endpoint, server actions, key components
4. OAuth login (Google, GitHub)
5. Markdown rendering in card content
6. Input sanitization on card content (XSS prevention)

### Internal Dependencies

```
Each item is independent — can be done in any order
```

**Recommended order** (by impact):
1. Keyboard shortcuts (quick win, big UX impact)
2. Markdown rendering (improves card display quality)
3. Input sanitization (security — should be done before public launch)
4. Tests (increases confidence for all other features)
5. Mobile responsive pass (important but time-consuming)
6. OAuth login (nice-to-have, Supabase makes it easy)

---

## Feature 1: Keyboard Shortcuts in Study Session

### Dependencies: P1 (study session exists)

### Implementation Steps

#### Step 1: Add keyboard event listeners
**File**: `src/components/flashcard/StudySession.tsx`

```typescript
useEffect(() => {
  function handleKeyDown(e: KeyboardEvent) {
    if (submitting) return;

    if (!revealed) {
      if (e.code === "Space" || e.key === "Enter") {
        e.preventDefault();
        setRevealed(true);
      }
    } else {
      switch (e.key) {
        case "1": handleRate("again"); break;
        case "2": handleRate("hard"); break;
        case "3": handleRate("good"); break;
        case "4": handleRate("easy"); break;
      }
    }
  }

  window.addEventListener("keydown", handleKeyDown);
  return () => window.removeEventListener("keydown", handleKeyDown);
}, [revealed, submitting, card]);
```

#### Step 2: Show keyboard hints
- Below each rating button, show the keyboard shortcut in small gray text
- "Space" below "Show Answer" button
- "1" below Again, "2" below Hard, "3" below Good, "4" below Easy

### Research Insights

**Create a reusable `useKeyboardShortcuts` hook** (`src/lib/hooks/useKeyboardShortcuts.ts`):
- Check `event.repeat` to prevent firing multiple times when key held down
- Exclude `INPUT`, `TEXTAREA`, `SELECT` elements so shortcuts never interfere with text editing
- Use `useMemo` on the shortcuts map to prevent `useEffect` re-registering listeners every render

#### Step 3: Tests
- Test space key reveals answer
- Test 1-4 keys submit ratings
- Test keys disabled during submission

---

## Feature 2: Markdown Rendering

### Dependencies: None

### Implementation Steps

#### Step 1: Install markdown renderer
**Package**: `react-markdown` + `remark-gfm` (GitHub Flavored Markdown)

```
npm install react-markdown remark-gfm
```

#### Step 2: Create Markdown component
**File**: `src/components/ui/Markdown.tsx`

```typescript
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export function Markdown({ content }: { content: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      className="prose prose-sm max-w-none"
      // Custom renderers for code blocks, links, etc.
    />
  );
}
```

#### Step 3: Use in card display
**Files**:
- `src/components/flashcard/StudySession.tsx` — render front/back as markdown
- `src/components/deck/DeckDetail.tsx` — render card previews as markdown (truncated)

#### Step 4: Sanitization (see Feature 6)
- react-markdown is safe by default (no `dangerouslySetInnerHTML`)
- But configure `allowedElements` to restrict what renders

#### Step 5: Tests
- Test basic markdown renders (bold, italic, code, lists)
- Test code blocks render with syntax highlighting
- Test XSS attempts are stripped

---

## Feature 3: Input Sanitization (XSS Prevention)

### Dependencies: Feature 2 (Markdown rendering)

### Implementation Steps

#### Step 1: Server-side sanitization on card save
**File**: `src/lib/actions/cards.ts`

- Sanitize front/back content before persisting
- Strip `<script>`, event handlers, dangerous attributes
- Allow markdown formatting but not raw HTML

Option A: Use `DOMPurify` (if SSR-compatible) or `isomorphic-dompurify`
Option B: Since we use react-markdown (which doesn't render raw HTML by default), just ensure no `dangerouslySetInnerHTML` is used anywhere

#### Step 2: Content Security Policy
**File**: `next.config.ts`

- Add CSP headers to prevent inline script execution
- `script-src 'self'`

#### Step 3: Audit existing code
- Check no `dangerouslySetInnerHTML` usage
- Check no user content is interpolated into script tags
- Check import parsing doesn't execute embedded HTML

#### Step 4: Tests
- Test `<script>alert('xss')</script>` in card content is neutralized
- Test `<img onerror="alert('xss')">` is stripped
- Test markdown rendering is safe

---

## Feature 4: Tests

### Dependencies: All features should have tests, but this addresses core gaps

### Priority Test Areas

#### FSRS Wrapper Tests
**File**: `src/lib/fsrs/index.test.ts`

- Test `createNewCard()` returns valid initial state
- Test `reviewCard()` with each rating produces expected state transitions
- Test `mapState()` maps all states correctly
- Test fuzz factor produces slightly different intervals

#### Review Endpoint Tests
**File**: `src/app/api/review/route.test.ts`

- Test POST with valid card_id + rating returns next_due
- Test POST without auth returns 401
- Test POST with missing fields returns 400
- Test first review creates card_states row
- Test subsequent review updates existing state
- Test review_log is created

#### Server Action Tests
**Files**: `src/lib/actions/cards.test.ts`, `src/lib/actions/decks.test.ts`

- Test CRUD operations for cards and decks
- Test auth checks (unauthenticated user throws)
- Test soft-delete sets archived_at
- Test getDueCards excludes archived cards

#### Component Tests
**Files**: Various `.test.tsx` files

- Test StudySession renders cards and handles ratings
- Test DeckDetail renders card list and handles editing
- Test Dashboard renders deck grid with due counts

---

## Feature 5: Mobile Responsive Pass

### Dependencies: All UI features should exist first

### Implementation Steps

#### Step 1: Audit current layouts
- Check all pages at 320px, 375px, 640px, 1024px+ widths
- Identify overflow, truncation, and spacing issues

#### Step 2: Fix study session for mobile
- Full-width flashcard
- Rating buttons: 2x2 grid on mobile (instead of 4-across)
- Touch-friendly button sizes (min 44px tap target)
- Swipe gesture for reveal (optional, nice-to-have)

#### Step 3: Fix dashboard for mobile
- Single column deck grid
- Smaller deck cards with essential info only
- Floating "New Deck" button (FAB style)

#### Step 4: Fix card browser for mobile
- Collapsible filter panel
- Card list: show front only, tap to expand
- Bulk operations: bottom sheet instead of toolbar

#### Step 5: Fix settings for mobile
- Full-width sections
- Touch-friendly sliders and toggles

#### Step 6: Tests
- Playwright tests at mobile viewport (375x667)
- Check no horizontal scrolling
- Check all interactive elements are tappable

---

## Feature 6: OAuth Login (Google, GitHub)

### Dependencies: None (Supabase handles OAuth)

### Implementation Steps

#### Step 1: Enable OAuth in Supabase
- Supabase Dashboard → Authentication → Providers
- Enable Google and GitHub
- Configure OAuth app credentials

#### Step 2: Add OAuth buttons to login/signup pages
**Files**: `src/app/(auth)/login/page.tsx`, `src/app/(auth)/signup/page.tsx`

```typescript
async function handleOAuth(provider: "google" | "github") {
  const supabase = createBrowserClient();
  await supabase.auth.signInWithOAuth({
    provider,
    options: { redirectTo: `${window.location.origin}/auth/callback` },
  });
}
```

#### Step 3: Create OAuth callback route
**File**: `src/app/auth/callback/route.ts`

- Exchange code for session
- Redirect to dashboard
- Create user_profile if new user

#### Step 4: Tests
- Test OAuth buttons render
- Test callback route handles code exchange
- Test profile creation for new OAuth users

---

## Verification Checklist

- [ ] `npm run typecheck` — zero errors
- [ ] `npm run lint` — zero errors
- [ ] `npm run test:run` — all tests pass
- [ ] Manual: Keyboard shortcuts work in study session
- [ ] Manual: Markdown renders in card content
- [ ] Manual: XSS attempts are blocked
- [ ] Manual: All pages usable on mobile (375px)
- [ ] Manual: OAuth login works with Google/GitHub
