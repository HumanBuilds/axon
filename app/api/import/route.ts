import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createNewCard } from '@/lib/fsrs';

interface ImportDeck {
  name: string;
  cards: { front: string; back: string; tags: string[] }[];
}

interface ImportPayload {
  decks: ImportDeck[];
}

const BATCH_SIZE = 500;

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { decks } = (await request.json()) as ImportPayload;

    if (!decks || !Array.isArray(decks) || decks.length === 0) {
      return NextResponse.json(
        { error: 'No decks provided' },
        { status: 400 },
      );
    }

    const results: { deckName: string; deckId: string; cardCount: number }[] = [];

    for (const deck of decks) {
      if (!deck.name || !deck.cards || deck.cards.length === 0) continue;

      // Create the deck
      const { data: newDeck, error: deckError } = await supabase
        .from('decks')
        .insert({ name: deck.name, user_id: user.id })
        .select('id')
        .single();

      if (deckError || !newDeck) {
        console.error('Failed to create deck:', deckError);
        continue;
      }

      // Insert cards in batches
      let insertedCount = 0;

      for (let i = 0; i < deck.cards.length; i += BATCH_SIZE) {
        const batch = deck.cards.slice(i, i + BATCH_SIZE).map((card) =>
          createNewCard(newDeck.id, card.front, card.back, card.tags),
        );

        const { error: cardsError } = await supabase
          .from('cards')
          .insert(batch);

        if (cardsError) {
          console.error('Failed to insert card batch:', cardsError);
        } else {
          insertedCount += batch.length;
        }
      }

      results.push({
        deckName: deck.name,
        deckId: newDeck.id,
        cardCount: insertedCount,
      });
    }

    return NextResponse.json({ success: true, results });
  } catch (error) {
    console.error('Import API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
