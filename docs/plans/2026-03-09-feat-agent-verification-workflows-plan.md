---
title: Agent Verification Workflows
type: feat
status: active
date: 2026-03-09
---

# Agent Verification Workflows

## Overview

Update CLAUDE.md with verification instructions so that agents (and humans) verify their work at every step: linting, red/green TDD, TypeScript type-checking, and browser-based verification. Add any missing infrastructure as TODO prerequisites.

## Problem Statement

Currently CLAUDE.md lists commands but has no workflow guidance. Agents write code without verifying it compiles, passes lint, has test coverage, or works in the browser. This leads to accumulated errors that surface late.

## Proposed Solution

### 1. Add missing npm scripts to package.json

```json
{
  "typecheck": "tsc --noEmit",
  "test:run": "vitest run"  // already exists
}
```

### 2. Install Playwright for browser verification

```bash
npm install -D @playwright/test
npx playwright install chromium
```

Create `playwright.config.ts` with:
- Base URL: `http://localhost:3000`
- Chromium only
- `webServer` config to auto-start dev server

Create `e2e/auth.setup.ts` — a Playwright global setup that:
- Logs in with `human.builds.dev@gmail.com` / `JYWUkz225EPBv62`
- Saves auth state to `e2e/.auth/user.json`
- Reuses auth state across tests (Playwright `storageState` pattern)

### 3. Update CLAUDE.md with verification workflows

Add these sections to CLAUDE.md:

#### Verification Workflow (run after every change)

```
1. `npm run typecheck`  — must pass with zero errors
2. `npm run lint`       — must pass with zero errors
3. `npm run test:run`   — all tests must pass
```

#### Red/Green TDD Protocol

```
When implementing a feature or fixing a bug:
1. Write a failing test first (`*.test.ts` next to the file being tested)
2. Run `npm run test:run` — confirm the test fails (red)
3. Write the minimum code to make the test pass
4. Run `npm run test:run` — confirm it passes (green)
5. Refactor if needed, re-run tests to confirm still green
6. Run `npm run typecheck` and `npm run lint` before considering done
```

#### Browser Verification

```
For UI changes, verify in the browser:
1. Run `npx playwright test` for automated E2E checks
2. For manual verification: dev server at http://localhost:3000
3. Auth credentials for testing: human.builds.dev@gmail.com / JYWUkz225EPBv62

Playwright auth state is cached in e2e/.auth/user.json (gitignored).
```

#### Test File Conventions

```
- Co-locate tests: `src/lib/fsrs/index.test.ts` next to `index.ts`
- Use `vi.mock()` for external deps (Supabase, next/navigation)
- Use `@testing-library/react` for component tests
- Use Playwright (`e2e/`) for full user-flow verification
```

### 4. Update .gitignore

Add:
```
# Playwright
e2e/.auth/
/test-results/
/playwright-report/
```

### 5. Update .claude/settings.local.json

Add to allowlist:
- `npm run typecheck`
- `npx playwright test`
- `npx playwright install`

## Acceptance Criteria

- [ ] `npm run typecheck` script exists and works
- [ ] Playwright installed with chromium browser
- [ ] `playwright.config.ts` configured with webServer and auth setup
- [ ] `e2e/auth.setup.ts` logs in and saves auth state
- [ ] CLAUDE.md has Verification Workflow, TDD Protocol, Browser Verification, and Test Conventions sections
- [ ] `.gitignore` excludes Playwright auth state and reports
- [ ] `.claude/settings.local.json` updated with new commands

## Files to Create/Modify

| File | Action |
|------|--------|
| `CLAUDE.md` | Add verification workflow sections |
| `package.json` | Add `typecheck` script |
| `playwright.config.ts` | Create — Playwright config |
| `e2e/auth.setup.ts` | Create — auth global setup |
| `.gitignore` | Add Playwright entries |
| `.claude/settings.local.json` | Add new command allowlists |
| `TODO.md` | Add P-1 prerequisites section |

## TODO.md Update

Add a new section above P0:

```markdown
## Prerequisites — Verification Infrastructure

- [ ] Add `typecheck` script to package.json
- [ ] Install Playwright + chromium
- [ ] Create `playwright.config.ts`
- [ ] Create `e2e/auth.setup.ts` with test account auth
- [ ] Update CLAUDE.md with verification workflows
- [ ] Update `.gitignore` for Playwright artifacts
```
