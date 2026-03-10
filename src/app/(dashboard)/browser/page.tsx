import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { searchCards, getUserTags } from "@/lib/actions/cards";
import { CardBrowser } from "@/components/browser/CardBrowser";
import type { Deck } from "@/lib/types";

export default async function BrowserPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: decks } = await supabase
    .from("decks")
    .select("*")
    .eq("user_id", user.id)
    .order("name", { ascending: true });

  const result = await searchCards({ page: 1, limit: 50, sort: "created" });
  const allTags = await getUserTags();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link href="/" className="text-gray-400 hover:text-gray-600">&larr;</Link>
          <h1 className="text-xl font-bold text-gray-900">Card Browser</h1>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 py-8">
        <CardBrowser
          initialCards={result.cards as never[]}
          initialTotal={result.total}
          decks={(decks ?? []) as Deck[]}
          allTags={allTags}
        />
      </main>
    </div>
  );
}
