"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { CardSource, CardFSRSState } from "@/lib/types";
import { createNewCard } from "@/lib/fsrs";

export async function getCards(deckId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("cards")
    .select("*")
    .eq("deck_id", deckId)
    .eq("user_id", user.id)
    .is("archived_at", null)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data;
}

export async function createCard(
  deckId: string,
  front: string,
  back: string,
  tags: string[] = [],
  source: CardSource = "manual"
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("cards")
    .insert({
      deck_id: deckId,
      user_id: user.id,
      front,
      back,
      tags,
      source,
    })
    .select()
    .single();

  if (error) throw error;

  // Initialize FSRS card_state so new cards appear in due queue
  const now = new Date();
  const newFSRS = createNewCard(now);
  const { error: stateError } = await supabase.from("card_states").insert({
    card_id: data.id,
    user_id: user.id,
    stability: newFSRS.stability,
    difficulty: newFSRS.difficulty,
    state: "new",
    due: now.toISOString(),
    reps: 0,
    lapses: 0,
    scheduled_days: 0,
    learning_steps: 0,
  });

  if (stateError) {
    // Compensating action: delete the card if state insert fails
    await supabase.from("cards").delete().eq("id", data.id);
    throw stateError;
  }

  revalidatePath(`/decks/${deckId}`);
  return data;
}

export async function updateCard(
  cardId: string,
  front: string,
  back: string,
  tags?: string[]
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const updates: Record<string, unknown> = {
    front,
    back,
    updated_at: new Date().toISOString(),
  };
  if (tags !== undefined) updates.tags = tags;

  const { data, error } = await supabase
    .from("cards")
    .update(updates)
    .eq("id", cardId)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteCard(cardId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Soft-delete: set archived_at instead of hard delete
  const { error } = await supabase
    .from("cards")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", cardId)
    .eq("user_id", user.id);

  if (error) throw error;
}

export async function restoreCard(cardId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("cards")
    .update({ archived_at: null })
    .eq("id", cardId)
    .eq("user_id", user.id);

  if (error) throw error;
}

export async function getDueCards(deckId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const now = new Date().toISOString();

  // Use inner join to filter by deck_id correctly
  const { data, error } = await supabase
    .from("card_states")
    .select("*, cards!inner(*)")
    .eq("cards.deck_id", deckId)
    .eq("cards.archived_at", null)
    .eq("user_id", user.id)
    .lte("due", now)
    .order("due", { ascending: true });

  if (error) throw error;
  return data;
}

export async function searchCards(params: {
  query?: string;
  deckId?: string;
  state?: CardFSRSState;
  tags?: string[];
  sort?: "due" | "created" | "alpha";
  page?: number;
  limit?: number;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const limit = params.limit ?? 50;
  const offset = ((params.page ?? 1) - 1) * limit;

  let q = supabase
    .from("cards")
    .select("*, card_states(*), decks(name)", { count: "exact" })
    .eq("user_id", user.id)
    .is("archived_at", null);

  if (params.query) {
    q = q.or(`front.ilike.%${params.query}%,back.ilike.%${params.query}%`);
  }
  if (params.deckId) q = q.eq("deck_id", params.deckId);
  if (params.tags?.length) q = q.overlaps("tags", params.tags);

  // Sort
  if (params.sort === "alpha") {
    q = q.order("front", { ascending: true });
  } else if (params.sort === "created") {
    q = q.order("created_at", { ascending: false });
  } else {
    q = q.order("created_at", { ascending: false });
  }

  q = q.range(offset, offset + limit - 1);

  const { data, error, count } = await q;
  if (error) throw error;
  return { cards: data ?? [], total: count ?? 0 };
}

export async function getUserTags(): Promise<string[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data } = await supabase
    .from("cards")
    .select("tags")
    .eq("user_id", user.id)
    .is("archived_at", null);

  const allTags = new Set<string>();
  data?.forEach((card: { tags: string[] | null }) =>
    card.tags?.forEach((tag: string) => allTags.add(tag))
  );
  return Array.from(allTags).sort();
}

export async function bulkTagCards(
  cardIds: string[],
  addTags: string[],
  removeTags: string[]
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Fetch current tags for all cards
  const { data: cards } = await supabase
    .from("cards")
    .select("id, tags")
    .in("id", cardIds)
    .eq("user_id", user.id);

  if (!cards) return;

  for (const card of cards) {
    const currentTags = new Set(card.tags ?? []);
    addTags.forEach((t) => currentTags.add(t));
    removeTags.forEach((t) => currentTags.delete(t));

    await supabase
      .from("cards")
      .update({ tags: Array.from(currentTags) })
      .eq("id", card.id);
  }
}

export async function bulkDeleteCards(cardIds: string[]) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("cards")
    .update({ archived_at: new Date().toISOString() })
    .in("id", cardIds)
    .eq("user_id", user.id);

  if (error) throw error;
}

export async function bulkMoveCards(cardIds: string[], targetDeckId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("cards")
    .update({ deck_id: targetDeckId })
    .in("id", cardIds)
    .eq("user_id", user.id);

  if (error) throw error;
}
