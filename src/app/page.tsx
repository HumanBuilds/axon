import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Dashboard } from "@/components/layout/Dashboard";

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: decks } = await supabase
    .from("decks")
    .select("*, cards(count)")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  // Fetch due counts per deck
  const now = new Date().toISOString();
  const { data: dueData } = await supabase
    .from("card_states")
    .select("card_id, cards!inner(deck_id)")
    .eq("user_id", user.id)
    .lte("due", now);

  const dueCounts: Record<string, number> = {};
  if (dueData) {
    for (const row of dueData) {
      const deckId = (row.cards as unknown as { deck_id: string })?.deck_id;
      if (deckId) {
        dueCounts[deckId] = (dueCounts[deckId] ?? 0) + 1;
      }
    }
  }

  return <Dashboard decks={decks ?? []} dueCounts={dueCounts} />;
}
