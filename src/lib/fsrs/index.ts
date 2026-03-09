import {
  createEmptyCard,
  fsrs,
  generatorParameters,
  type Card as FSRSCard,
  type RecordLogItem,
  type Grade,
  Rating as FSRSRating,
  State,
  type FSRS,
} from "ts-fsrs";
import type { Rating, UserProfile } from "@/lib/types";

// Default scheduler (used when no user profile is available)
const defaultParams = generatorParameters({ enable_fuzz: true });
const defaultScheduler = fsrs(defaultParams);

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

export function createScheduler(profile?: Partial<UserProfile>): FSRS {
  if (!profile) return defaultScheduler;

  const params = generatorParameters({
    enable_fuzz: true,
    request_retention: profile.desired_retention ?? 0.9,
    maximum_interval: 365,
    enable_short_term: true,
    w: profile.fsrs_weights ?? undefined,
  });
  return fsrs(params);
}

export function createNewCard(now?: Date): FSRSCard {
  return createEmptyCard(now);
}

export function reviewCard(
  card: FSRSCard,
  rating: Rating,
  now?: Date,
  userScheduler?: FSRS
): RecordLogItem {
  const s = userScheduler ?? defaultScheduler;
  const fsrsRating = RATING_MAP[rating];
  return s.next(card, now ?? new Date(), fsrsRating);
}

export function getNextStates(card: FSRSCard, now?: Date, userScheduler?: FSRS) {
  const s = userScheduler ?? defaultScheduler;
  return s.repeat(card, now ?? new Date());
}

export function mapState(state: State): string {
  return STATE_MAP[state] ?? "new";
}

export { createEmptyCard, defaultScheduler as scheduler, FSRSRating, State };
