"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createNewCard } from "@/lib/fsrs";
import type { ImportFormat } from "@/lib/types";

interface ImportedCard {
  front: string;
  back: string;
  tags?: string[];
}

async function batchInsertCards(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  deckId: string,
  cards: ImportedCard[],
  batchSize = 200
) {
  let inserted = 0;
  let errors = 0;

  for (let i = 0; i < cards.length; i += batchSize) {
    const batch = cards.slice(i, i + batchSize);
    const now = new Date();

    const cardRows = batch.map((c) => ({
      deck_id: deckId,
      user_id: userId,
      front: c.front,
      back: c.back,
      tags: c.tags ?? [],
      source: "imported" as const,
    }));

    const { data: insertedCards, error } = await supabase
      .from("cards")
      .insert(cardRows)
      .select("id");

    if (error) {
      errors += batch.length;
      continue;
    }

    // Create card_states for each inserted card
    const newFSRS = createNewCard(now);
    const stateRows = (insertedCards ?? []).map((c) => ({
      card_id: c.id,
      user_id: userId,
      stability: newFSRS.stability,
      difficulty: newFSRS.difficulty,
      state: "new" as const,
      due: now.toISOString(),
      reps: 0,
      lapses: 0,
      scheduled_days: 0,
      learning_steps: 0,
    }));

    if (stateRows.length > 0) {
      await supabase.from("card_states").insert(stateRows);
    }

    inserted += insertedCards?.length ?? 0;
  }

  return { inserted, errors };
}

export async function importJSON(json: string, filename: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  let parsed;
  try {
    parsed = JSON.parse(json);
  } catch {
    throw new Error("Invalid JSON");
  }

  if (!parsed.deck_name || !Array.isArray(parsed.cards) || parsed.cards.length === 0) {
    throw new Error("JSON must have deck_name and a non-empty cards array");
  }

  // Create deck
  const { data: deck, error: deckError } = await supabase
    .from("decks")
    .insert({ name: parsed.deck_name, description: parsed.description ?? null, user_id: user.id })
    .select()
    .single();

  if (deckError || !deck) throw deckError ?? new Error("Failed to create deck");

  // Create import record
  const { data: record } = await supabase.from("import_records").insert({
    user_id: user.id,
    format: "json" as ImportFormat,
    filename,
    deck_id: deck.id,
    status: "processing",
  }).select().single();

  const validCards: ImportedCard[] = parsed.cards.filter(
    (c: Record<string, unknown>) => c.front && typeof c.front === "string" && c.back && typeof c.back === "string"
  );

  const { inserted, errors } = await batchInsertCards(supabase, user.id, deck.id, validCards);

  // Update import record
  if (record) {
    await supabase.from("import_records").update({
      card_count: inserted,
      error_count: errors + (parsed.cards.length - validCards.length),
      status: "completed",
    }).eq("id", record.id);
  }

  revalidatePath("/");
  return { deckId: deck.id, deckName: deck.name, cardCount: inserted, errorCount: errors };
}

export async function importCSV(
  rows: string[][],
  mapping: { front: number; back: number; tags?: number },
  deckName: string,
  filename: string
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Create deck
  const { data: deck, error: deckError } = await supabase
    .from("decks")
    .insert({ name: deckName, user_id: user.id })
    .select()
    .single();

  if (deckError || !deck) throw deckError ?? new Error("Failed to create deck");

  const { data: record } = await supabase.from("import_records").insert({
    user_id: user.id,
    format: filename.endsWith(".tsv") ? ("tsv" as ImportFormat) : ("csv" as ImportFormat),
    filename,
    deck_id: deck.id,
    status: "processing",
  }).select().single();

  const cards: ImportedCard[] = [];
  for (const row of rows) {
    const front = row[mapping.front]?.trim();
    const back = row[mapping.back]?.trim();
    if (!front || !back) continue;
    const tags = mapping.tags !== undefined && row[mapping.tags]
      ? row[mapping.tags].split(/[,;]/).map((t) => t.trim()).filter(Boolean)
      : [];
    cards.push({ front, back, tags });
  }

  const { inserted, errors } = await batchInsertCards(supabase, user.id, deck.id, cards);

  if (record) {
    await supabase.from("import_records").update({
      card_count: inserted,
      error_count: errors + (rows.length - cards.length),
      status: "completed",
    }).eq("id", record.id);
  }

  revalidatePath("/");
  return { deckId: deck.id, deckName, cardCount: inserted, errorCount: errors };
}

export async function importAnki(
  cards: ImportedCard[],
  deckName: string,
  filename: string
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: deck, error: deckError } = await supabase
    .from("decks")
    .insert({ name: deckName, user_id: user.id })
    .select()
    .single();

  if (deckError || !deck) throw deckError ?? new Error("Failed to create deck");

  const { data: record } = await supabase.from("import_records").insert({
    user_id: user.id,
    format: "anki_apkg" as ImportFormat,
    filename,
    deck_id: deck.id,
    status: "processing",
  }).select().single();

  const { inserted, errors } = await batchInsertCards(supabase, user.id, deck.id, cards);

  if (record) {
    await supabase.from("import_records").update({
      card_count: inserted,
      error_count: errors,
      status: "completed",
    }).eq("id", record.id);
  }

  revalidatePath("/");
  return { deckId: deck.id, deckName, cardCount: inserted, errorCount: errors };
}
