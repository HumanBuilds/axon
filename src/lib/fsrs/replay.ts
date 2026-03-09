import { createEmptyCard, type Card as FSRSCard } from "ts-fsrs";
import type { AnkiReviewLog } from "@/lib/import/anki-parser";
import type { Rating } from "@/lib/types";
import { reviewCard, mapState, createScheduler } from "./index";
import type { UserProfile } from "@/lib/types";

const ANKI_RATING_MAP: Record<number, Rating> = {
  1: "again",
  2: "hard",
  3: "good",
  4: "easy",
};

export interface ReplayResult {
  /** Final FSRS card state after replaying all reviews */
  state: string;
  stability: number;
  difficulty: number;
  due: string;
  reps: number;
  lapses: number;
  scheduledDays: number;
  lastReview: string;
  /** Review logs generated from replay */
  reviews: {
    rating: Rating;
    reviewedAt: string;
  }[];
}

/**
 * Replays a sequence of Anki review logs through FSRS to reconstruct
 * the card's memory state, rather than starting from scratch.
 */
export function replayAnkiHistory(
  reviews: AnkiReviewLog[],
  profile?: Partial<UserProfile>
): ReplayResult | null {
  if (reviews.length === 0) return null;

  // Sort by timestamp ascending
  const sorted = [...reviews].sort((a, b) => a.timestamp - b.timestamp);
  const scheduler = createScheduler(profile);

  let card: FSRSCard = createEmptyCard(new Date(sorted[0].timestamp));
  const replayedReviews: { rating: Rating; reviewedAt: string }[] = [];

  for (const review of sorted) {
    const rating = ANKI_RATING_MAP[review.ease];
    if (!rating) continue; // Skip invalid ratings

    const reviewDate = new Date(review.timestamp);

    try {
      const result = reviewCard(card, rating, reviewDate, scheduler);
      card = result.card;
      replayedReviews.push({
        rating,
        reviewedAt: reviewDate.toISOString(),
      });
    } catch {
      // Skip reviews that cause errors (e.g., invalid dates)
      continue;
    }
  }

  if (replayedReviews.length === 0) return null;

  return {
    state: mapState(card.state),
    stability: card.stability,
    difficulty: card.difficulty,
    due: card.due.toISOString(),
    reps: card.reps,
    lapses: card.lapses,
    scheduledDays: card.scheduled_days,
    lastReview: card.last_review?.toISOString() ?? new Date().toISOString(),
    reviews: replayedReviews,
  };
}

/**
 * Groups Anki review logs by card ID and replays each card's history.
 */
export function replayAllCardHistories(
  reviewLogs: AnkiReviewLog[],
  profile?: Partial<UserProfile>
): Map<number, ReplayResult> {
  // Group reviews by card ID
  const byCard = new Map<number, AnkiReviewLog[]>();
  for (const log of reviewLogs) {
    const existing = byCard.get(log.cardId);
    if (existing) {
      existing.push(log);
    } else {
      byCard.set(log.cardId, [log]);
    }
  }

  // Replay each card's history
  const results = new Map<number, ReplayResult>();
  for (const [cardId, logs] of byCard) {
    const result = replayAnkiHistory(logs, profile);
    if (result) {
      results.set(cardId, result);
    }
  }

  return results;
}
