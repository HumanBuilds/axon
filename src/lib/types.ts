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
  archived_at: string | null;
  embedding: number[] | null;
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
  learning_steps: number;
}

export interface ReviewLog {
  id: string;
  card_id: string | null;
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
  display_name: string | null;
  desired_retention: number;
  max_new_cards_per_day: number;
  max_reviews_per_day: number;
  learning_steps: string[];
  relearning_steps: string[];
  fsrs_weights: number[] | null;
  last_optimization: string | null;
  interleaving_enabled: boolean;
  agent_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface ImportRecord {
  id: string;
  user_id: string;
  format: ImportFormat;
  filename: string;
  deck_id: string | null;
  card_count: number;
  error_count: number;
  status: "pending" | "processing" | "completed" | "failed";
  error_message: string | null;
  imported_at: string;
}
