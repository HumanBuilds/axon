import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DeckDetail } from "@/components/deck/DeckDetail";

export default async function DeckPage({
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

  const { data: cards } = await supabase
    .from("cards")
    .select("*")
    .eq("deck_id", deckId)
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  const now = new Date().toISOString();
  const { count: dueCount } = await supabase
    .from("card_states")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .in("card_id", (cards ?? []).map((c) => c.id))
    .lte("due", now);

  return (
    <DeckDetail
      deck={deck}
      cards={cards ?? []}
      dueCount={dueCount ?? 0}
    />
  );
}
