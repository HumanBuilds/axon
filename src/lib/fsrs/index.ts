import {
  createEmptyCard,
  fsrs,
  generatorParameters,
  type Card as FSRSCard,
  type RecordLogItem,
  type Grade,
  Rating as FSRSRating,
  State,
} from "ts-fsrs";
import type { Rating } from "@/lib/types";

// Initialize FSRS with default parameters
const params = generatorParameters({ enable_fuzz: true });
const scheduler = fsrs(params);

const RATING_MAP: Record<Rating, Grade> = {
  again: FSRSRating.Again,
  hard: FSRSRating.Hard,
  good: FSRSRating.Good,
  easy: FSRSRating.Easy,
};

const STATE_MAP: Record<number, string> = {
  [State.New]: "new",
  [State.Learning]: "learning",
  [State.Review]: "review",
  [State.Relearning]: "relearning",
};

export function createNewCard(now?: Date): FSRSCard {
  return createEmptyCard(now);
}

export function reviewCard(
  card: FSRSCard,
  rating: Rating,
  now?: Date
): RecordLogItem {
  const fsrsRating = RATING_MAP[rating];
  return scheduler.next(card, now ?? new Date(), fsrsRating);
}

export function getNextStates(card: FSRSCard, now?: Date) {
  return scheduler.repeat(card, now ?? new Date());
}

export function mapState(state: State): string {
  return STATE_MAP[state] ?? "new";
}

export { createEmptyCard, scheduler, FSRSRating, State };
