import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { StudySession } from "@/components/flashcard/StudySession";

export default async function StudyPage({
  params,
}: {
  params: Promise<{ deckId: string }>;
}) {
  const { deckId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: deck } = await supabase
    .from("decks")
    .select("*")
    .eq("id", deckId)
    .eq("user_id", user.id)
    .single();

  if (!deck) redirect("/");

  // Get cards with their states
  const { data: cards } = await supabase
    .from("cards")
    .select("*")
    .eq("deck_id", deckId)
    .eq("user_id", user.id);

  const cardIds = (cards ?? []).map((c) => c.id);

  const now = new Date().toISOString();
  const { data: dueStates } = await supabase
    .from("card_states")
    .select("*")
    .in("card_id", cardIds.length > 0 ? cardIds : ["none"])
    .eq("user_id", user.id)
    .lte("due", now);

  // Also include new cards that have no state yet
  const cardsWithState = new Set((dueStates ?? []).map((s) => s.card_id));
  const newCards = (cards ?? []).filter((c) => !cardsWithState.has(c.id));

  // Build study queue: due cards first, then new cards
  const dueCards = (dueStates ?? [])
    .map((state) => {
      const card = (cards ?? []).find((c) => c.id === state.card_id);
      return card ? { ...card, state } : null;
    })
    .filter(Boolean);

  const studyQueue = [
    ...dueCards,
    ...newCards.slice(0, 20).map((c) => ({ ...c, state: null })),
  ];

  return (
    <StudySession
      deckId={deckId}
      deckName={deck.name}
      cards={studyQueue as Array<{ id: string; front: string; back: string; state: unknown }>}
    />
  );
}
