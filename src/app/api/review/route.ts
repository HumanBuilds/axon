import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { reviewCard, createNewCard, mapState, createScheduler } from "@/lib/fsrs";
import type { Rating } from "@/lib/types";
import { State, type Card as FSRSCard } from "ts-fsrs";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { card_id, rating } = body as { card_id: string; rating: Rating };

  if (!card_id || !rating) {
    return NextResponse.json({ error: "Missing card_id or rating" }, { status: 400 });
  }

  // Get current card state
  const { data: cardState } = await supabase
    .from("card_states")
    .select("*")
    .eq("card_id", card_id)
    .eq("user_id", user.id)
    .single();

  // Build FSRS card from state (or create new)
  const now = new Date();
  let fsrsCard: FSRSCard;

  if (cardState) {
    fsrsCard = {
      due: new Date(cardState.due),
      stability: cardState.stability,
      difficulty: cardState.difficulty,
      elapsed_days: cardState.last_review
        ? (now.getTime() - new Date(cardState.last_review).getTime()) / (1000 * 60 * 60 * 24)
        : 0,
      scheduled_days: cardState.scheduled_days,
      reps: cardState.reps,
      lapses: cardState.lapses,
      state: stateFromString(cardState.state),
      last_review: cardState.last_review ? new Date(cardState.last_review) : undefined,
      learning_steps: cardState.learning_steps ?? 0,
    } as FSRSCard;
  } else {
    fsrsCard = createNewCard();
  }

  // Load user profile for per-user scheduler
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("desired_retention, fsrs_weights")
    .eq("id", user.id)
    .single();

  const userScheduler = createScheduler(profile ?? undefined);

  // Compute next state
  const result = reviewCard(fsrsCard, rating, now, userScheduler);
  const newCard = result.card;

  const stateBefore = {
    stability: fsrsCard.stability,
    difficulty: fsrsCard.difficulty,
    state: mapState(fsrsCard.state),
  };

  const stateAfter = {
    stability: newCard.stability,
    difficulty: newCard.difficulty,
    state: mapState(newCard.state),
  };

  // Upsert card state
  const { error: stateError } = await supabase
    .from("card_states")
    .upsert({
      card_id,
      user_id: user.id,
      stability: newCard.stability,
      difficulty: newCard.difficulty,
      state: mapState(newCard.state),
      due: newCard.due.toISOString(),
      last_review: now.toISOString(),
      reps: newCard.reps,
      lapses: newCard.lapses,
      scheduled_days: newCard.scheduled_days,
      learning_steps: newCard.learning_steps ?? 0,
    });

  if (stateError) {
    return NextResponse.json({ error: stateError.message }, { status: 500 });
  }

  // Write review log
  const { error: logError } = await supabase.from("review_logs").insert({
    card_id,
    user_id: user.id,
    rating,
    elapsed_days: fsrsCard.elapsed_days,
    scheduled_days: newCard.scheduled_days,
    state_before: stateBefore,
    state_after: stateAfter,
    reviewed_at: now.toISOString(),
  });

  if (logError) {
    return NextResponse.json({ error: logError.message }, { status: 500 });
  }

  return NextResponse.json({
    next_due: newCard.due.toISOString(),
    state: mapState(newCard.state),
    stability: newCard.stability,
    difficulty: newCard.difficulty,
  });
}

function stateFromString(s: string): State {
  switch (s) {
    case "learning": return State.Learning;
    case "review": return State.Review;
    case "relearning": return State.Relearning;
    default: return State.New;
  }
}
