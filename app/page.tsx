import Image from 'next/image';
import { createClient } from '@/lib/supabase/server';
import { DeckCard } from '@/components/deck/DeckCard';
import { CreateDeckButton } from '@/components/deck/CreateDeckButton';
import { ImportDeckButton } from '@/components/deck/ImportDeckButton';
import { Sidebar } from '@/components/layout/Sidebar';
import { ReviewStatusBanner } from '@/components/deck/ReviewStatusBanner';

export default async function Home() {
  const supabase = await createClient();

  // Get user session
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col items-center justify-center py-32 px-4 text-center">
          <h1 className="text-7xl font-black tracking-tighter mb-6 bg-gradient-to-br from-primary to-secondary bg-clip-text text-transparent leading-none py-1">
            Master your mind.
          </h1>
          <p className="text-xl md:text-2xl opacity-70 mb-10 leading-relaxed max-w-2xl mx-auto">
            Axon uses advanced spaced repetition to ensure you never forget.
          </p>
          <div className="flex gap-4">
            <a href="/signup" className="btn btn-primary btn-lg px-12">Get Started</a>
            <a href="/login" className="btn btn-outline btn-lg px-12">Login</a>
          </div>
        </div>
      </div>
    );
  }

  // Fetch decks and due cards in parallel
  const now = new Date().toISOString();
  const [decksResult, dueCardsResult] = await Promise.all([
    supabase
      .from('decks')
      .select('*')
      .order('created_at', { ascending: false }),
    supabase
      .from('cards')
      .select('deck_id')
      .lte('due', now)
      .order('due', { ascending: true }),
  ]);

  const { data: decks, error } = decksResult;
  if (error) {
    console.error('Error fetching decks:', error);
  }

  if (dueCardsResult.error) {
    console.error('Error fetching due cards:', dueCardsResult.error);
  }
  const dueCards = dueCardsResult.data ?? [];
  const dueCountMap: Record<string, number> = {};
  for (const card of dueCards) {
    dueCountMap[card.deck_id] = (dueCountMap[card.deck_id] || 0) + 1;
  }
  const totalDueCount = dueCards.length;
  const firstDueDeckId = dueCards.length > 0 ? dueCards[0].deck_id : null;

  return (
    <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 flex gap-8">
      <Sidebar />
      <main className="flex-1 min-w-0 flex flex-col">
        <div className={`border-b border-base-300 pb-6 ${(!decks || decks.length === 0) ? 'mb-10' : ''}`}>
          <div className="flex items-center justify-between gap-4">
            <h1 className="text-3xl font-black tracking-tight">My Decks</h1>
          </div>
          <p className="text-base-content/70 mt-1 mb-0 max-w-lg leading-relaxed">
            Manage and organize your flashcards with ease. Create sophisticated study paths through structured content.
          </p>
        </div>

        {decks && decks.length > 0 && (
          <ReviewStatusBanner totalDueCount={totalDueCount} firstDueDeckId={firstDueDeckId} />
        )}

        {(!decks || decks.length === 0) ? (
          <div className="flex-1 flex flex-col items-center justify-center py-12 px-6 border-2 border-dashed border-base-300 bg-base-100/50">
            <div className="relative mb-8">
              <Image
                src="/assets/empty-library.svg"
                alt="Empty library illustration"
                width={200}
                height={150}
                priority
              />
            </div>
            <div className="max-w-md text-center">
              <h2 className="text-xl font-bold tracking-tight mb-3">Your library is empty.</h2>
              <p className="text-base-content/70 leading-relaxed mb-8">
                Start by creating a deck of flashcards. You can organize your study materials into structured content for better focus and systematic learning.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <CreateDeckButton className="btn btn-primary px-8 text-sm font-bold uppercase tracking-wider">
                  Create Your First Deck
                </CreateDeckButton>
                <ImportDeckButton className="btn btn-outline px-8 text-sm font-bold uppercase tracking-wider">
                  Import Data
                </ImportDeckButton>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8 justify-items-center">
            {decks.map((deck) => (
              <div key={deck.id} className="w-full max-w-sm">
                <DeckCard
                  id={deck.id}
                  name={deck.name}
                  cardCount={deck.card_count || 0}
                  dueCount={dueCountMap[deck.id] || 0}
                  color={deck.color}
                />
              </div>
            ))}
            <div className="w-full max-w-sm">
              <CreateDeckButton className="w-full h-full min-h-[160px] border-2 border-dashed border-primary bg-transparent text-primary hover:border-solid hover:shadow-axon transition-all flex flex-col items-center justify-center gap-2">
                <img src="/assets/plus.svg" alt="" className="w-6 h-6" />
                <span className="text-sm font-bold">Create New Deck</span>
              </CreateDeckButton>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
