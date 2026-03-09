export type CardSource = "manual" | "ai_generated" | "imported";
export type CardFSRSState = "new" | "learning" | "review" | "relearning";
export type Rating = "again" | "hard" | "good" | "easy";
export type ImportFormat = "anki_apkg" | "csv" | "tsv" | "json";

export interface Card {
  id: string;
  deck_id: string;
  user_id: string;
  front: string;
  back: string;
  tags: string[];
  source: CardSource;
  created_at: string;
  updated_at: string;
}

export interface CardState {
  card_id: string;
  user_id: string;
  stability: number;
  difficulty: number;
  retrievability: number;
  state: CardFSRSState;
  due: string;
  last_review: string | null;
  reps: number;
  lapses: number;
  scheduled_days: number;
}

export interface ReviewLog {
  id: string;
  card_id: string;
  user_id: string;
  rating: Rating;
  elapsed_days: number;
  scheduled_days: number;
  state_before: Record<string, unknown>;
  state_after: Record<string, unknown>;
  reviewed_at: string;
}

export interface Deck {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  id: string;
  email: string;
  display_name: string | null;
  desired_retention: number;
  created_at: string;
}
