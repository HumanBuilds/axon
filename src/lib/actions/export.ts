"use server";

import { createClient } from "@/lib/supabase/server";
import Papa from "papaparse";

export async function exportDeckJSON(deckId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: deck } = await supabase
    .from("decks")
    .select("*")
    .eq("id", deckId)
    .eq("user_id", user.id)
    .single();

  if (!deck) throw new Error("Deck not found");

  const { data: cards } = await supabase
    .from("cards")
    .select("front, back, tags")
    .eq("deck_id", deckId)
    .eq("user_id", user.id)
    .is("archived_at", null)
    .order("created_at", { ascending: true });

  return JSON.stringify(
    {
      deck_name: deck.name,
      description: deck.description,
      cards: cards ?? [],
    },
    null,
    2
  );
}

export async function exportDeckCSV(deckId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: cards } = await supabase
    .from("cards")
    .select("front, back, tags")
    .eq("deck_id", deckId)
    .eq("user_id", user.id)
    .is("archived_at", null)
    .order("created_at", { ascending: true });

  const rows = (cards ?? []).map((c) => ({
    front: c.front,
    back: c.back,
    tags: (c.tags ?? []).join(", "),
  }));

  return Papa.unparse(rows);
}
