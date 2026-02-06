# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Axon is a flashcard learning application with spaced repetition (FSRS algorithm) and code execution capabilities. Built with Next.js 16 App Router, React 19, Supabase, and Tailwind CSS.

## Commands

```bash
npm run dev          # Start development server (localhost:3000)
npm run build        # Production build
npm run lint         # Run ESLint
npm test             # Run Vitest in watch mode
npm run test:run     # Run tests once (CI)
npm run test:coverage # Run tests with coverage
```

Supabase local development:
- Database: port 54322
- API: port 54321
- Studio: port 54323

## Architecture

### Tech Stack
- **Framework**: Next.js 16.1.6 with App Router, React 19.2.3
- **Database**: Supabase (PostgreSQL 17) with Row-Level Security
- **Auth**: Supabase Auth (email/password) via `@supabase/ssr`
- **Styling**: Tailwind CSS v4 + DaisyUI v5 (wireframe theme) + `@tailwindcss/typography`
- **Spaced Repetition**: ts-fsrs v5
- **Code Editor**: Monaco Editor (`@monaco-editor/react` ^4.7.0, lazy loaded for edit mode)
- **Syntax Highlighting**: Shiki v3 + `@shikijs/rehype` (static rendering for view mode)
- **Code Execution**: Piston API
- **Markdown**: react-markdown + remark-gfm (GFM support)
- **Animation**: Framer Motion v12

### Key Directories
- `app/` - Next.js App Router pages and layouts
  - `app/page.tsx` - Home/dashboard (decks list for logged-in users, landing for guests)
  - `app/(auth)/` - Login/signup pages (client components)
  - `app/(dashboard)/decks/[deckId]/study/` - Study session page
- `components/` - React components organized by domain:
  - `components/code/` - CodeViewer, CodeEditor, CodeBlock, CodeActionBar, CodeTerminal
  - `components/deck/` - DeckCard, CardContentEditor (orchestrator), useCardContentEditor (hook), TextSegment, CodeSegment, InlineCodeEditor, CreateDeckButton, AddCardButton, ExecutionOutput
  - `components/flashcard/` - Flashcard, StudySession, ReviewButtons
  - `components/layout/` - Header
  - `components/ui/` - Markdown, Portal, PortalDropdown, LanguageSelectDropdown
- `lib/actions/` - Server Actions (auth.ts, cards.ts, decks.ts)
- `lib/supabase/` - Supabase client factories (client.ts for browser, server.ts for server)
- `lib/fsrs/` - FSRS algorithm integration
- `lib/code/` - Code execution (executor.ts), language mappings, Shiki singleton, Monaco theme, markdown utils
- `supabase/migrations/` - PostgreSQL schema migrations

### Database Schema
Four main tables with RLS policies:
- **profiles** - User profiles (linked to auth.users)
- **decks** - Flashcard decks with denormalized card_count
- **cards** - Card content + complete FSRS state (stability, difficulty, due, reps, lapses, etc.)
- **review_logs** - Review history for analytics

### Code Feature Architecture (Read/Write Separation)
- **View mode**: Shiki renders static HTML (zero JS overhead)
- **Edit mode**: Monaco Editor hydrates on demand
- **Execution**: Piston API with 10-second timeout

The Shiki highlighter uses a singleton pattern (`lib/code/shiki-singleton.ts`) - never reinitialize per card.

### UI Patterns
- Portal-based dropdowns for language selection (avoids z-index/overflow issues)
- Live markdown preview with click-to-edit in CardContentEditor
- Inline code editor component for embedding code blocks in cards

### Component Patterns
- **Hook + Orchestrator + Sub-components**: Complex components like `CardContentEditor` extract state/logic into a `use*` hook and rendering into sub-components (`TextSegment`, `CodeSegment`), keeping the orchestrator lean (~90 lines)
- **Shared utilities over prop-passing**: Functions like `cleanErrorOutput` live in `lib/` and are imported directly by consuming components rather than threaded through props

### Path Alias
Use `@/*` for imports from project root (configured in tsconfig.json).

## Testing

- **Framework**: Vitest + happy-dom + @testing-library/react + @testing-library/jest-dom
- **Config**: `vitest.config.ts`, setup file at `test/setup.ts`
- **Test files**: Co-located with source as `*.test.ts` / `*.test.tsx`
- **Patterns**: Mock heavy deps (Monaco, Markdown) with `vi.mock()` stubs; use `makeProps()` factories for component tests; use `renderHook()` for hook tests

## Environment Variables

Required in `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

Optional:
```
PISTON_API_URL=  # Defaults to https://emkc.org/api/v2/piston
```
