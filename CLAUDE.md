# Axon - Flashcard App

## Tech Stack
- **Framework**: Next.js 15 (App Router, TypeScript)
- **Styling**: Tailwind CSS v4
- **Icons**: react-feather (Feather Icons) — use by default for all icons
- **Database**: Supabase (PostgreSQL + Auth)
- **Scheduling**: ts-fsrs (FSRS v6 spaced repetition)
- **Testing**: Vitest + Testing Library + happy-dom

## Project Structure
```
src/
  app/              # Next.js App Router pages
    (auth)/         # Login/signup pages
    (dashboard)/    # Deck detail and study pages
    api/review/     # Review submission endpoint
  components/
    layout/         # Dashboard, header components
    deck/           # Deck detail, card editing
    flashcard/      # Study session, flashcard display
    ui/             # Shared UI primitives
  lib/
    actions/        # Server actions (auth, decks, cards)
    fsrs/           # FSRS scheduling wrapper
    supabase/       # Supabase client/server helpers
    types.ts        # Shared TypeScript types
  test/             # Test setup
supabase/
  migrations/       # Database migrations
```

## Commands
- `npm run dev` — Start dev server with Turbopack
- `npm run build` — Production build
- `npm run lint` — ESLint
- `npm run typecheck` — TypeScript type-checking (`tsc --noEmit`)
- `npm test` — Vitest (watch mode)
- `npm run test:run` — Vitest (single run)
- `npx playwright test` — E2E tests (Chromium)

## Path Alias
- `@/*` maps to `./src/*`

## Database
- Supabase with RLS policies on all tables
- Tables: decks, cards, card_states, review_logs
- All user data isolated via `user_id` + RLS

---

## Verification Workflow (run after every change)

1. `npm run typecheck` — must pass with zero errors
2. `npm run lint` — must pass with zero errors
3. `npm run test:run` — all tests must pass

## Red/Green TDD Protocol

When implementing a feature or fixing a bug:
1. Write a failing test first (`*.test.ts` next to the file being tested)
2. Run `npm run test:run` — confirm the test fails (red)
3. Write the minimum code to make the test pass
4. Run `npm run test:run` — confirm it passes (green)
5. Refactor if needed, re-run tests to confirm still green
6. Run `npm run typecheck` and `npm run lint` before considering done

## Browser Verification

For UI changes, verify in the browser:
1. Run `npx playwright test` for automated E2E checks
2. For manual verification: dev server at http://localhost:3000
3. Auth credentials for testing: human.builds.dev@gmail.com / JYWUkz225EPBv62

Playwright auth state is cached in `e2e/.auth/user.json` (gitignored).

## Test File Conventions

- Co-locate tests: `src/lib/fsrs/index.test.ts` next to `index.ts`
- Use `vi.mock()` for external deps (Supabase, next/navigation)
- Use `@testing-library/react` for component tests
- Use Playwright (`e2e/`) for full user-flow verification

---

## UX Guidelines

### Responsive Design
- **Mobile-first**: Design for mobile (320px+) first, then scale up
- **Breakpoints**: mobile (<640px) → tablet (640px–1024px) → desktop (1024px+)
- Use Tailwind responsive prefixes: default mobile, `sm:` tablet, `lg:` desktop

### Navigation
- **Prefer new pages over modals** — use Next.js routes for new views
- **Use confirmation dialogs for destructive actions only** (delete deck, delete card, etc.)

### Forms & Content Editing

**Creating content** (new deck, new card):
- Show Save/Submit button immediately
- On invalid submit: show inline errors below each invalid field
- Remove inline errors as the field becomes valid (on change/blur)

**Editing existing content**:
- Hide Save/Discard buttons until a change is detected
- Show Save/Discard only after the user modifies something
- Same inline validation rules as creation

**After successful save**:
- Show a toast notification confirming success
- Never rely solely on page navigation as confirmation

### Icons
- Use `react-feather` for all icons: `import { Plus, Trash2, Edit2 } from "react-feather"`
- Default icon size: 16px inline, 20px for buttons, 24px for headers

### Feedback
- **Toast notifications**: Confirm success (green), warn (amber), error (red)
- **Inline errors**: Red text below the field, removed when valid
- **Loading states**: Disable buttons and show spinner or "Saving..." text

