"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { CardSource } from "@/lib/types";

export async function getCards(deckId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("cards")
    .select("*")
    .eq("deck_id", deckId)
    .eq("user_id", user.id)
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

  const { error } = await supabase
    .from("cards")
    .delete()
    .eq("id", cardId)
    .eq("user_id", user.id);

  if (error) throw error;
}

export async function getDueCards(deckId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("card_states")
    .select("*, cards(*)")
    .eq("cards.deck_id", deckId)
    .eq("user_id", user.id)
    .lte("due", now)
    .order("due", { ascending: true });

  if (error) throw error;
  return data;
}
