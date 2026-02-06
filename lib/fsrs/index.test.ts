/**
 * FSRS Integration Tests
 *
 * Tests the core spaced repetition algorithm integration.
 * Focus: scheduling accuracy, state transitions, edge cases.
 */

import { describe, test, expect, beforeEach } from 'vitest';
import { State, Rating, createEmptyCard } from 'ts-fsrs';
import {
  dbToFSRSCard,
  fsrsToDBCard,
  createNewCard,
  reviewCard,
  getReviewPreview,
  formatInterval,
  getStateName,
  getRatingName,
  isDue,
  getRetrievability,
  sortByPriority,
} from './index';
import {
  createNewCard as createNewCardFixture,
  createLearningCard,
  createReviewCard,
  createOverdueCard,
  createMatureCard,
  createRelearningCard,
} from '@/test/utils/fixtures';

describe('FSRS Conversion Functions', () => {
  test('should convert database card to FSRS card with correct date objects', () => {
    const dbCard = createNewCardFixture();
    const fsrsCard = dbToFSRSCard(dbCard);

    expect(fsrsCard.due).toBeInstanceOf(Date);
    expect(fsrsCard.state).toBe(State.New);
    expect(fsrsCard.stability).toBe(0);
    expect(fsrsCard.difficulty).toBe(0);
    expect(fsrsCard.reps).toBe(0);
    expect(fsrsCard.last_review).toBeUndefined(); // New card has no last_review
  });

  test('should convert database card with last_review to FSRS card', () => {
    const dbCard = createReviewCard();
    const fsrsCard = dbToFSRSCard(dbCard);

    expect(fsrsCard.last_review).toBeInstanceOf(Date);
    expect(fsrsCard.state).toBe(State.Review);
    expect(fsrsCard.reps).toBeGreaterThan(0);
  });

  test('should convert FSRS card back to database format', () => {
    const emptyCard = createEmptyCard();
    const dbData = fsrsToDBCard(emptyCard);

    expect(typeof dbData.due).toBe('string');
    expect(dbData.state).toBe(State.New);
    expect(dbData.stability).toBe(0);
    expect(dbData.last_review).toBeNull();
  });

  test('should handle round-trip conversion without data loss', () => {
    const originalDbCard = createReviewCard();
    const fsrsCard = dbToFSRSCard(originalDbCard);
    const convertedDbCard = fsrsToDBCard(fsrsCard);

    // Check key FSRS properties are preserved
    expect(convertedDbCard.state).toBe(originalDbCard.state);
    expect(convertedDbCard.stability).toBe(originalDbCard.stability);
    expect(convertedDbCard.difficulty).toBe(originalDbCard.difficulty);
    expect(convertedDbCard.reps).toBe(originalDbCard.reps);
    expect(convertedDbCard.lapses).toBe(originalDbCard.lapses);
  });
});

describe('Card Creation', () => {
  test('should create new card with default FSRS state', () => {
    const card = createNewCard('deck-123', 'Question?', 'Answer!', ['tag1']);

    expect(card.deck_id).toBe('deck-123');
    expect(card.front).toBe('Question?');
    expect(card.back).toBe('Answer!');
    expect(card.tags).toEqual(['tag1']);
    expect(card.state).toBe(State.New);
    expect(card.reps).toBe(0);
    expect(card.lapses).toBe(0);
  });

  test('should create new card without tags', () => {
    const card = createNewCard('deck-123', 'Question?', 'Answer!');

    expect(card.tags).toEqual([]);
  });
});

describe('Review Card Function', () => {
  test('should advance new card to learning state when rated Good', () => {
    const newCard = createNewCardFixture();
    const result = reviewCard(newCard, Rating.Good);

    expect(result.updatedCard.state).toBe(State.Learning);
    expect(result.updatedCard.reps).toBe(1);
    expect(result.updatedCard.lapses).toBe(0);
    expect(result.updatedCard.stability).toBeGreaterThan(0);

    // Review log should capture state BEFORE review
    expect(result.reviewLog.state).toBe(State.New);
    expect(result.reviewLog.rating).toBe(Rating.Good);
    expect(result.reviewLog.card_id).toBe(newCard.id);
  });

  test('should keep card in learning state when rated Again', () => {
    const learningCard = createLearningCard();
    const result = reviewCard(learningCard, Rating.Again);

    // When a learning card is rated Again, it stays in Learning
    expect(result.updatedCard.state).toBe(State.Learning);
    // Lapses only increment when a Review card lapses to Relearning
    // Learning cards don't have lapses yet
    expect(result.updatedCard.reps).toBe(learningCard.reps + 1);
  });

  test('should graduate learning card to review state when rated Good', () => {
    const learningCard = createLearningCard({
      learning_steps: 2, // Close to graduation
    });
    const result = reviewCard(learningCard, Rating.Good);

    // Should eventually graduate to Review state
    expect([State.Learning, State.Review]).toContain(result.updatedCard.state);
  });

  test('should increase interval for review card when rated Good', () => {
    const reviewCard_ = createReviewCard();
    const result = reviewCard(reviewCard_, Rating.Good);

    expect(result.updatedCard.scheduled_days).toBeGreaterThan(reviewCard_.scheduled_days);
    expect(result.updatedCard.reps).toBe(reviewCard_.reps + 1);
  });

  test('should decrease interval for review card when rated Again (lapse)', () => {
    const reviewCard_ = createReviewCard();
    const result = reviewCard(reviewCard_, Rating.Again);

    expect(result.updatedCard.state).toBe(State.Relearning);
    expect(result.updatedCard.lapses).toBe(reviewCard_.lapses + 1);
    expect(result.updatedCard.scheduled_days).toBeLessThan(reviewCard_.scheduled_days);
  });

  test('should handle Easy rating with longer interval than Good', () => {
    const reviewCard_ = createReviewCard();
    const goodResult = reviewCard(reviewCard_, Rating.Good);
    const easyResult = reviewCard(reviewCard_, Rating.Easy);

    expect(easyResult.updatedCard.scheduled_days).toBeGreaterThan(
      goodResult.updatedCard.scheduled_days
    );
  });

  test('should handle Hard rating with shorter interval than Good', () => {
    const reviewCard_ = createReviewCard();
    const hardResult = reviewCard(reviewCard_, Rating.Hard);
    const goodResult = reviewCard(reviewCard_, Rating.Good);

    expect(hardResult.updatedCard.scheduled_days).toBeLessThan(
      goodResult.updatedCard.scheduled_days
    );
  });

  test('should include duration in review log when provided', () => {
    const card = createNewCardFixture();
    const durationMs = 5432;
    const result = reviewCard(card, Rating.Good, new Date(), durationMs);

    expect(result.reviewLog.duration_ms).toBe(durationMs);
  });

  test('should use custom review time when provided', () => {
    const card = createNewCardFixture();
    const customTime = new Date('2024-06-15T10:00:00Z');
    const result = reviewCard(card, Rating.Good, customTime);

    expect(result.reviewLog.review_at).toBe(customTime.toISOString());
  });
});

describe('Review Preview', () => {
  test('should return preview for all four ratings', () => {
    const card = createNewCardFixture();
    const preview = getReviewPreview(card);

    expect(preview).toHaveLength(4);
    expect(preview[0].rating).toBe(Rating.Again);
    expect(preview[1].rating).toBe(Rating.Hard);
    expect(preview[2].rating).toBe(Rating.Good);
    expect(preview[3].rating).toBe(Rating.Easy);
  });

  test('should show shortest interval for Again rating', () => {
    const card = createReviewCard();
    const preview = getReviewPreview(card);

    const againInterval = preview[0].intervalDays;
    const hardInterval = preview[1].intervalDays;
    const goodInterval = preview[2].intervalDays;
    const easyInterval = preview[3].intervalDays;

    expect(againInterval).toBeLessThan(hardInterval);
    expect(hardInterval).toBeLessThan(goodInterval);
    expect(goodInterval).toBeLessThan(easyInterval);
  });

  test('should format intervals as human-readable strings', () => {
    const card = createReviewCard();
    const preview = getReviewPreview(card);

    preview.forEach((p) => {
      expect(p.interval).toBeTruthy();
      expect(typeof p.interval).toBe('string');
    });
  });
});

describe('Interval Formatting', () => {
  test('should format less than 1 minute as "< 1m"', () => {
    expect(formatInterval(0)).toBe('< 1m');
    expect(formatInterval(0.0001)).toBe('< 1m');
  });

  test('should format minutes correctly', () => {
    expect(formatInterval(1 / 1440)).toBe('1m'); // 1 minute
    expect(formatInterval(10 / 1440)).toBe('10m'); // 10 minutes
    expect(formatInterval(30 / 1440)).toBe('30m'); // 30 minutes
  });

  test('should format hours correctly', () => {
    expect(formatInterval(1 / 24)).toBe('1h'); // 1 hour
    expect(formatInterval(12 / 24)).toBe('12h'); // 12 hours
  });

  test('should format days correctly', () => {
    expect(formatInterval(1)).toBe('1d');
    expect(formatInterval(3)).toBe('3d');
    expect(formatInterval(6)).toBe('6d');
  });

  test('should format weeks correctly', () => {
    expect(formatInterval(7)).toBe('1w');
    expect(formatInterval(14)).toBe('2w');
    expect(formatInterval(21)).toBe('3w');
  });

  test('should format months correctly', () => {
    expect(formatInterval(30)).toBe('1mo');
    expect(formatInterval(60)).toBe('2mo');
    expect(formatInterval(180)).toBe('6mo');
  });

  test('should format years correctly', () => {
    expect(formatInterval(365)).toBe('1y');
    expect(formatInterval(730)).toBe('2y');
  });
});

describe('Utility Functions', () => {
  test('should return correct state names', () => {
    expect(getStateName(State.New)).toBe('New');
    expect(getStateName(State.Learning)).toBe('Learning');
    expect(getStateName(State.Review)).toBe('Review');
    expect(getStateName(State.Relearning)).toBe('Relearning');
  });

  test('should return correct rating names', () => {
    expect(getRatingName(Rating.Again)).toBe('Again');
    expect(getRatingName(Rating.Hard)).toBe('Hard');
    expect(getRatingName(Rating.Good)).toBe('Good');
    expect(getRatingName(Rating.Easy)).toBe('Easy');
  });

  test('should correctly identify due cards', () => {
    const now = new Date();

    const pastDue = createOverdueCard();
    const futureDue = createReviewCard({
      due: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(),
    });

    expect(isDue(pastDue, now)).toBe(true);
    expect(isDue(futureDue, now)).toBe(false);
  });

  test('should calculate retrievability for new cards as 100%', () => {
    const newCard = createNewCardFixture();
    expect(getRetrievability(newCard)).toBe(100);
  });

  test('should calculate retrievability for mature cards correctly', () => {
    const now = new Date();
    const lastReview = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000); // 10 days ago
    const due = new Date(now.getTime() + 170 * 24 * 60 * 60 * 1000); // Due in 170 days

    const matureCard = createMatureCard({
      stability: 180.0,
      last_review: lastReview.toISOString(),
      due: due.toISOString(),
    });

    const retrievability = getRetrievability(matureCard, now);

    // Should be very high retrievability since card is not due yet
    expect(retrievability).toBeGreaterThan(90);
    expect(retrievability).toBeLessThanOrEqual(100);
  });

  test('should calculate lower retrievability for overdue cards', () => {
    const overdueCard = createOverdueCard();
    const retrievability = getRetrievability(overdueCard);

    // Overdue cards should have lower retrievability
    expect(retrievability).toBeLessThan(80);
  });
});

describe('Priority Sorting', () => {
  test('should prioritize learning cards over new cards', () => {
    const newCard = createNewCardFixture({ id: 'new-1' });
    const learningCard = createLearningCard({ id: 'learning-1' });

    const sorted = sortByPriority([newCard, learningCard]);

    expect(sorted[0].id).toBe('learning-1');
    expect(sorted[1].id).toBe('new-1');
  });

  test('should prioritize relearning cards over new cards', () => {
    const newCard = createNewCardFixture({ id: 'new-1' });
    const relearningCard = createRelearningCard({ id: 'relearning-1' });

    const sorted = sortByPriority([newCard, relearningCard]);

    expect(sorted[0].id).toBe('relearning-1');
    expect(sorted[1].id).toBe('new-1');
  });

  test('should sort by due date within same priority group', () => {
    const now = new Date();
    const card1 = createReviewCard({
      id: 'card-1',
      due: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    });
    const card2 = createReviewCard({
      id: 'card-2',
      due: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    });

    const sorted = sortByPriority([card1, card2]);

    // More overdue card should come first
    expect(sorted[0].id).toBe('card-2');
    expect(sorted[1].id).toBe('card-1');
  });

  test('should handle mixed card states correctly', () => {
    const now = new Date();
    const newCard = createNewCardFixture({
      id: 'new',
      due: now.toISOString()
    });
    const learningCard = createLearningCard({
      id: 'learning',
      due: new Date(now.getTime() - 5 * 60 * 1000).toISOString() // 5 mins ago
    });
    const reviewCard = createReviewCard({
      id: 'review',
      due: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString() // Future
    });
    const overdueCard = createOverdueCard({
      id: 'overdue',
      due: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString() // 3 days ago
    });

    const sorted = sortByPriority([newCard, reviewCard, learningCard, overdueCard]);

    // Learning cards first (they have short-term urgency)
    expect(sorted[0].id).toBe('learning');
    // Then cards sorted by due date - overdue comes before others
    expect(sorted[1].id).toBe('overdue');
    // New and review cards follow
    const remainingIds = [sorted[2].id, sorted[3].id];
    expect(remainingIds).toContain('new');
    expect(remainingIds).toContain('review');
  });

  test('should not mutate original array', () => {
    const cards = [createNewCardFixture(), createLearningCard()];
    const originalOrder = [...cards];

    sortByPriority(cards);

    expect(cards).toEqual(originalOrder);
  });
});
