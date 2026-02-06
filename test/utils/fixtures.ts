/**
 * Test fixtures for cards, decks, and FSRS states
 */

import { State, Rating } from 'ts-fsrs';
import type { DatabaseCard } from '@/lib/fsrs';

/**
 * Create a test card with FSRS state
 */
export function createTestCard(overrides: Partial<DatabaseCard> = {}): DatabaseCard {
  const now = new Date();

  return {
    id: 'test-card-1',
    deck_id: 'test-deck-1',
    front: 'What is 2 + 2?',
    back: '4',
    tags: [],

    // FSRS state - New card
    state: State.New,
    stability: 0,
    difficulty: 0,
    elapsed_days: 0,
    scheduled_days: 0,
    learning_steps: 0,
    reps: 0,
    lapses: 0,
    due: now.toISOString(),
    last_review: null,

    // Metadata
    created_at: now.toISOString(),
    updated_at: now.toISOString(),

    ...overrides,
  };
}

/**
 * Create a new card (never reviewed)
 */
export function createNewCard(overrides: Partial<DatabaseCard> = {}): DatabaseCard {
  return createTestCard({
    state: State.New,
    reps: 0,
    lapses: 0,
    ...overrides,
  });
}

/**
 * Create a learning card (in short-term learning steps)
 */
export function createLearningCard(overrides: Partial<DatabaseCard> = {}): DatabaseCard {
  const now = new Date();
  const due = new Date(now.getTime() + 10 * 60 * 1000); // Due in 10 minutes

  return createTestCard({
    state: State.Learning,
    stability: 0.5,
    difficulty: 5.0,
    scheduled_days: 0.007, // ~10 minutes
    reps: 1,
    learning_steps: 1,
    due: due.toISOString(),
    last_review: now.toISOString(),
    ...overrides,
  });
}

/**
 * Create a review card (graduated to long-term memory)
 */
export function createReviewCard(overrides: Partial<DatabaseCard> = {}): DatabaseCard {
  const now = new Date();
  const lastReview = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // Reviewed 7 days ago
  const due = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000); // Due in 3 days

  return createTestCard({
    state: State.Review,
    stability: 10.0,
    difficulty: 5.0,
    scheduled_days: 10,
    elapsed_days: 7,
    reps: 5,
    lapses: 0,
    due: due.toISOString(),
    last_review: lastReview.toISOString(),
    ...overrides,
  });
}

/**
 * Create an overdue card
 */
export function createOverdueCard(overrides: Partial<DatabaseCard> = {}): DatabaseCard {
  const now = new Date();
  const due = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000); // Overdue by 3 days
  const lastReview = new Date(now.getTime() - 13 * 24 * 60 * 60 * 1000); // Reviewed 13 days ago

  return createTestCard({
    state: State.Review,
    stability: 10.0,
    difficulty: 5.0,
    scheduled_days: 10,
    elapsed_days: 13,
    reps: 3,
    lapses: 0,
    due: due.toISOString(),
    last_review: lastReview.toISOString(),
    ...overrides,
  });
}

/**
 * Create a relearning card (lapsed card being relearned)
 */
export function createRelearningCard(overrides: Partial<DatabaseCard> = {}): DatabaseCard {
  const now = new Date();
  const due = new Date(now.getTime() + 10 * 60 * 1000); // Due in 10 minutes

  return createTestCard({
    state: State.Relearning,
    stability: 2.0,
    difficulty: 7.0,
    scheduled_days: 0.007,
    reps: 5,
    lapses: 1,
    learning_steps: 1,
    due: due.toISOString(),
    last_review: now.toISOString(),
    ...overrides,
  });
}

/**
 * Create a mature card (high stability, long intervals)
 */
export function createMatureCard(overrides: Partial<DatabaseCard> = {}): DatabaseCard {
  const now = new Date();
  const lastReview = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000); // Reviewed 90 days ago
  const due = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000); // Due in 90 days

  return createTestCard({
    state: State.Review,
    stability: 180.0,
    difficulty: 4.0,
    scheduled_days: 180,
    elapsed_days: 90,
    reps: 15,
    lapses: 0,
    due: due.toISOString(),
    last_review: lastReview.toISOString(),
    ...overrides,
  });
}

/**
 * Create a card with code content
 */
export function createCodeCard(language: string = 'javascript', overrides: Partial<DatabaseCard> = {}): DatabaseCard {
  return createTestCard({
    front: 'What does this code output?',
    back: `\`\`\`${language}\nconsole.log('Hello, World!');\n\`\`\`\n\nOutput: Hello, World!`,
    tags: ['code', language],
    ...overrides,
  });
}

/**
 * Create a test deck
 */
export function createTestDeck(overrides: Partial<any> = {}) {
  return {
    id: 'test-deck-1',
    user_id: 'test-user-1',
    name: 'Test Deck',
    description: 'A test deck for unit tests',
    card_count: 10,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}
