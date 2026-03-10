import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ExportPanel } from "@/components/import/ExportPanel";

export default async function ExportPage({
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

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link href={`/decks/${deckId}`} className="text-gray-400 hover:text-gray-600">&larr;</Link>
          <h1 className="text-xl font-bold text-gray-900">Export: {deck.name}</h1>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-4 py-8">
        <ExportPanel deckId={deckId} deckName={deck.name} />
      </main>
    </div>
  );
}
