/**
 * FSRS Integration Module
 * 
 * This module provides utilities for integrating ts-fsrs with a Supabase backend.
 * Compatible with ts-fsrs v5.x
 * 
 * @module lib/fsrs
 */

import {
  createEmptyCard,
  fsrs,
  generatorParameters,
  Rating,
  State,
  type Card as FSRSCard,
  type RecordLog,
  type RecordLogItem,
  type ReviewLog as FSRSReviewLog,
  type FSRSParameters,
  type Grade,
} from 'ts-fsrs';

// ============================================================================
// CONFIGURATION
// ============================================================================

/**
 * Default FSRS parameters
 * Adjust these based on your user research and target retention
 */
const DEFAULT_PARAMS: Partial<FSRSParameters> = {
  // Add slight randomness to intervals to prevent "review bunching"
  enable_fuzz: true,

  // Enable learning steps for new/relearning cards
  enable_short_term: true,

  // Maximum interval cap (365 days = 1 year)
  maximum_interval: 365,

  // Target retention rate (90% = remember 9 out of 10 cards)
  request_retention: 0.9,
};

/**
 * Initialize FSRS instance with parameters
 */
export function createFSRS(customParams?: Partial<FSRSParameters>) {
  const params = generatorParameters({
    ...DEFAULT_PARAMS,
    ...customParams,
  });
  return fsrs(params);
}

// Default FSRS instance
export const f = createFSRS();

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Card shape as stored in Supabase database
 */
export interface DatabaseCard {
  id: string;
  deck_id: string;
  front: string;
  back: string;
  tags: string[];

  // FSRS state
  state: number;
  stability: number;
  difficulty: number;
  elapsed_days: number;
  scheduled_days: number;
  learning_steps: number;
  reps: number;
  lapses: number;
  due: string;
  last_review: string | null;

  // Metadata
  created_at: string;
  updated_at: string;
}

/**
 * Review log shape as stored in Supabase database
 */
export interface DatabaseReviewLog {
  id?: string;
  card_id: string;
  rating: number;
  state: number;
  elapsed_days: number;
  scheduled_days: number;
  learning_steps: number;
  duration_ms?: number;
  review_at: string;
}

/**
 * Result of a review operation
 */
export interface ReviewResult {
  updatedCard: Partial<DatabaseCard>;
  reviewLog: Omit<DatabaseReviewLog, 'id'>;
}

/**
 * Preview of all possible ratings for a card
 */
export interface RatingPreview {
  rating: Rating;
  card: FSRSCard;
  interval: string;
  intervalDays: number;
}

// ============================================================================
// CONVERSION FUNCTIONS
// ============================================================================

/**
 * Convert a database card row to an FSRS Card object
 */
export function dbToFSRSCard(dbCard: DatabaseCard): FSRSCard {
  return {
    due: new Date(dbCard.due),
    stability: dbCard.stability,
    difficulty: dbCard.difficulty,
    elapsed_days: dbCard.elapsed_days,
    scheduled_days: dbCard.scheduled_days,
    learning_steps: dbCard.learning_steps,
    reps: dbCard.reps,
    lapses: dbCard.lapses,
    state: dbCard.state as State,
    last_review: dbCard.last_review ? new Date(dbCard.last_review) : undefined,
  };
}

/**
 * Convert an FSRS Card object back to database format
 */
export function fsrsToDBCard(fsrsCard: FSRSCard): Partial<DatabaseCard> {
  return {
    due: fsrsCard.due.toISOString(),
    stability: fsrsCard.stability,
    difficulty: fsrsCard.difficulty,
    elapsed_days: fsrsCard.elapsed_days,
    scheduled_days: fsrsCard.scheduled_days,
    learning_steps: fsrsCard.learning_steps,
    reps: fsrsCard.reps,
    lapses: fsrsCard.lapses,
    state: fsrsCard.state,
    last_review: fsrsCard.last_review?.toISOString() ?? null,
  };
}

/**
 * Create a new card with default FSRS state
 */
export function createNewCard(
  deckId: string,
  front: string,
  back: string,
  tags: string[] = []
): Omit<DatabaseCard, 'id' | 'created_at' | 'updated_at'> {
  const emptyCard = createEmptyCard();

  return {
    deck_id: deckId,
    front,
    back,
    tags,
    ...fsrsToDBCard(emptyCard),
  } as Omit<DatabaseCard, 'id' | 'created_at' | 'updated_at'>;
}

// ============================================================================
// REVIEW FUNCTIONS
// ============================================================================

/**
 * Process a review and return the updated card state and review log
 * 
 * @param dbCard - The card from the database
 * @param rating - The rating given by the user (1-4)
 * @param reviewTime - When the review occurred (defaults to now)
 * @param durationMs - How long the review took in milliseconds (optional)
 * @returns Updated card data and review log entry
 */
export function reviewCard(
  dbCard: DatabaseCard,
  rating: Rating,
  reviewTime: Date = new Date(),
  durationMs?: number
): ReviewResult {
  const fsrsCard = dbToFSRSCard(dbCard);

  // Get the scheduling result for the chosen rating
  const result = f.next(fsrsCard, reviewTime, rating as unknown as Grade);

  return {
    updatedCard: fsrsToDBCard(result.card),
    reviewLog: {
      card_id: dbCard.id,
      rating,
      state: dbCard.state, // State BEFORE review
      elapsed_days: dbCard.elapsed_days,
      scheduled_days: dbCard.scheduled_days,
      learning_steps: dbCard.learning_steps,
      duration_ms: durationMs,
      review_at: reviewTime.toISOString(),
    },
  };
}

/**
 * Get a preview of all possible ratings for a card
 * Useful for showing estimated intervals on review buttons
 * 
 * @param dbCard - The card from the database
 * @param reviewTime - When the review would occur (defaults to now)
 * @returns Array of rating previews with formatted intervals
 */
export function getReviewPreview(
  dbCard: DatabaseCard,
  reviewTime: Date = new Date()
): RatingPreview[] {
  const fsrsCard = dbToFSRSCard(dbCard);
  const scheduling: RecordLog = f.repeat(fsrsCard, reviewTime);

  const ratings = [Rating.Again, Rating.Hard, Rating.Good, Rating.Easy];

  return ratings.map((r) => {
    const rating = r as unknown as Grade;
    const result = scheduling[rating];
    const intervalDays = result.card.scheduled_days;

    return {
      rating,
      card: result.card,
      interval: formatInterval(intervalDays),
      intervalDays,
    };
  });
}

/**
 * Get the preview for a single rating
 */
export function getSingleRatingPreview(
  dbCard: DatabaseCard,
  rating: Rating,
  reviewTime: Date = new Date()
): RecordLogItem {
  const fsrsCard = dbToFSRSCard(dbCard);
  return f.next(fsrsCard, reviewTime, rating as unknown as Grade);
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Format a day interval into a human-readable string
 * 
 * @param days - Number of days
 * @returns Formatted string (e.g., "< 1m", "10m", "1d", "2w", "3mo")
 */
export function formatInterval(days: number): string {
  if (days < 1 / 1440) {
    // Less than 1 minute
    return '< 1m';
  } else if (days < 1 / 24) {
    // Less than 1 hour, show minutes
    const minutes = Math.round(days * 1440);
    return `${minutes}m`;
  } else if (days < 1) {
    // Less than 1 day, show hours
    const hours = Math.round(days * 24);
    return `${hours}h`;
  } else if (days < 7) {
    // Less than 1 week, show days
    return `${Math.round(days)}d`;
  } else if (days < 30) {
    // Less than 1 month, show weeks
    const weeks = Math.round(days / 7);
    return `${weeks}w`;
  } else if (days < 365) {
    // Less than 1 month, show months
    const months = Math.round(days / 30);
    return `${months}mo`;
  } else {
    // 1 year or more
    const years = Math.round(days / 365 * 10) / 10;
    return `${years}y`;
  }
}

/**
 * Get the state name for display
 */
export function getStateName(state: State | number): string {
  const names: Record<number, string> = {
    [State.New]: 'New',
    [State.Learning]: 'Learning',
    [State.Review]: 'Review',
    [State.Relearning]: 'Relearning',
  };
  return names[state] ?? 'Unknown';
}

/**
 * Get the rating name for display
 */
export function getRatingName(rating: Rating | number): string {
  const names: Record<number, string> = {
    [Rating.Again]: 'Again',
    [Rating.Hard]: 'Hard',
    [Rating.Good]: 'Good',
    [Rating.Easy]: 'Easy',
    [Rating.Manual]: 'Manual',
  };
  return names[rating] ?? 'Unknown';
}

/**
 * Check if a card is due for review
 */
export function isDue(dbCard: DatabaseCard, now: Date = new Date()): boolean {
  return new Date(dbCard.due) <= now;
}

/**
 * Calculate current retrievability (probability of recall)
 * 
 * @param dbCard - The card from the database
 * @param now - Current time
 * @returns Retrievability as a percentage (0-100)
 */
export function getRetrievability(
  dbCard: DatabaseCard,
  now: Date = new Date()
): number {
  const fsrsCard = dbToFSRSCard(dbCard);

  // New cards have undefined retrievability
  if (fsrsCard.state === State.New) {
    return 100;
  }

  // Calculate days since last review
  const lastReview = fsrsCard.last_review ?? fsrsCard.due;
  const daysSince = (now.getTime() - lastReview.getTime()) / (1000 * 60 * 60 * 24);

  // FSRS retrievability formula: R = e^(-t/S) where t = time, S = stability
  const retrievability = Math.exp(-daysSince / Math.max(fsrsCard.stability, 0.01));

  return Math.round(retrievability * 100);
}

/**
 * Sort cards by priority for study session
 * Priority: Overdue > Due today > Learning > New
 */
export function sortByPriority(cards: DatabaseCard[], now: Date = new Date()): DatabaseCard[] {
  return [...cards].sort((a, b) => {
    const aDue = new Date(a.due);
    const bDue = new Date(b.due);

    // Learning/Relearning cards first (they have short-term steps)
    const aLearning = a.state === State.Learning || a.state === State.Relearning;
    const bLearning = b.state === State.Learning || b.state === State.Relearning;

    if (aLearning && !bLearning) return -1;
    if (!aLearning && bLearning) return 1;

    // Then by due date
    return aDue.getTime() - bDue.getTime();
  });
}

// ============================================================================
// EXPORTS
// ============================================================================

export { Rating, State, createEmptyCard };
export type { FSRSCard, RecordLog, RecordLogItem, FSRSReviewLog, FSRSParameters };
