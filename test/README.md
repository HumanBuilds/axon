# Testing Infrastructure

This document describes the testing setup for Axon.

## Overview

Axon uses **Vitest** as the test runner with **React Testing Library** for component testing. The test suite focuses on critical business logic and user flows.

## Running Tests

```bash
# Run tests in watch mode (default)
npm test

# Run tests once (CI mode)
npm run test:run

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage
```

## Test Structure

### Test Files
- Tests are colocated with source files using the `.test.ts` or `.test.tsx` extension
- Example: `lib/fsrs/index.ts` → `lib/fsrs/index.test.ts`

### Test Categories

#### 1. Unit Tests (Fast, Abundant)
Located in `lib/` directories, these test pure functions and business logic:

- **FSRS Module** (`lib/fsrs/index.test.ts`)
  - Card state conversions (DB ↔ FSRS)
  - Review scheduling algorithm
  - Interval formatting
  - Priority sorting
  - Retrievability calculations
  - 36 tests covering all critical paths

- **Language Configuration** (`lib/code/languages.test.ts`)
  - Language mapping (Monaco ↔ Piston)
  - Alias resolution
  - Executable language detection
  - 21 tests covering edge cases

- **Markdown Utilities** (`lib/code/markdown-utils.test.ts`)
  - Code block parsing
  - Content reconstruction
  - Round-trip conversion
  - 21 tests with special character handling

- **Code Executor** (`lib/code/executor.test.ts`)
  - Piston API integration (mocked)
  - Error handling (network, timeout, execution)
  - Language support validation
  - 14 tests with comprehensive error scenarios

#### 2. Integration Tests
Currently focused on mocked server actions and API calls. Future expansion planned for:
- Server Actions with Supabase client mocks
- Component integration tests

#### 3. E2E Tests
Not yet implemented. Future candidates:
- Auth flows (signup, login, session persistence)
- Study session flow (create deck → add cards → study → review)
- Code execution flow (editor → run → output)

## Test Utilities

### `test/utils/fixtures.ts`
Provides factory functions for creating test data:
- `createNewCard()` - New card (never reviewed)
- `createLearningCard()` - Card in learning state
- `createReviewCard()` - Card in review state
- `createOverdueCard()` - Overdue card
- `createMatureCard()` - High stability card
- `createRelearningCard()` - Lapsed card being relearned
- `createCodeCard()` - Card with code content
- `createTestDeck()` - Test deck

### `test/utils/supabase-mock.ts`
Mock Supabase client with chained query builder pattern:
- `createMockQueryBuilder()` - Mock query builder
- `createMockSupabaseClient()` - Full mock client
- `mockAuthenticatedUser` - Test user fixture

## Configuration

### `vitest.config.ts`
- Environment: `happy-dom` (lightweight DOM for component tests)
- Path alias: `@/*` maps to project root
- Setup file: `test/setup.ts`
- Coverage provider: v8

### `test/setup.ts`
- Extends Vitest matchers with `@testing-library/jest-dom`
- Auto-cleanup after each test
- Mock environment variables

## Coverage

Current test coverage focuses on:
1. **FSRS scheduling logic** - Most critical for user learning
2. **Code execution utilities** - High-risk external API calls
3. **Data transformations** - Prone to serialization bugs

Coverage gaps (intentional):
- Layout components (purely presentational)
- Static pages
- Style-only components

## Best Practices

### Writing Tests
1. **Use descriptive test names**: `should [expected behavior] when [condition]`
2. **Follow Arrange-Act-Assert** pattern
3. **Test behavior, not implementation**
4. **Use realistic test data** from fixtures
5. **One logical assertion per test**

### FSRS Tests
- Test boundary conditions (new card, mature card, overdue card)
- Verify rating responses produce correct intervals
- Test state transitions (New → Learning → Review → Relearning)
- Check edge cases (0 stability, MAX_SAFE_INTEGER intervals)

### Mock Strategy
- **Mock at boundaries**: Network calls, file system, external APIs
- **Don't mock**: Pure logic, data transformations, code under test
- **Use vi.clearAllMocks()** in beforeEach to prevent test pollution

### Anti-Patterns to Avoid
- Testing implementation details
- Snapshot tests for dynamic content
- Excessive mocking (makes tests tautological)
- Tests that always pass
- Copy-paste test blocks (use parameterized tests)

## Future Enhancements

1. **Component Tests**
   - StudySession component
   - ReviewButtons component
   - Flashcard component
   - CodeEditor/CodeViewer integration

2. **Integration Tests**
   - Server Actions with real Supabase queries (local instance)
   - RLS policy testing
   - Database query builders

3. **E2E Tests with Playwright**
   - Critical user journeys
   - Auth flows
   - Code execution end-to-end

4. **Visual Regression Tests**
   - Flashcard rendering
   - Code syntax highlighting
   - Dark mode consistency

## Troubleshooting

### Tests fail with "AbortError"
- Ensure `vi.clearAllMocks()` is called in `beforeEach`
- Create proper Error objects with `name = 'AbortError'`

### Tests fail with "not a constructor"
- Don't mock constructors with arrow functions
- Use `vi.fn().mockImplementation()` for class mocks

### Path alias not working
- Check `vitest.config.ts` has correct path alias
- Restart test runner after config changes

### Supabase mock not working
- Ensure mock returns chainable query builder
- All methods should return the builder (except terminal methods)
- Use `.mockReturnValue(builder)` for chaining

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [ts-fsrs Documentation](https://github.com/open-spaced-repetition/ts-fsrs)
