import { createClient } from '@/lib/supabase/server';
import { DeckCard } from '@/components/deck/DeckCard';
import { CreateDeckButton } from '@/components/deck/CreateDeckButton';
import { redirect } from 'next/navigation';

export default async function Home() {
  const supabase = await createClient();

  // Get user session
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    // If not logged in, we could show a landing page or redirect
    // But user said "replace it with what is currently the decks page"
    // Most "decks" dashboard systems require login.
    // I'll redirect to login for now, or keep a minimal hero.
    // Let's keep a minimal hero if no user, to be safe.
    return (
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
    );
  }

  // Fetch decks for logged in user
  const { data: decks, error } = await supabase
    .from('decks')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching decks:', error);
  }

  return (
    <div className="py-12">
      <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-16  md:text-left transition-all">
        <div>
          <h1 className="text-5xl font-black tracking-tight mb-2">My Decks</h1>
          <p className="opacity-50 text-lg font-medium">Select a deck or create a new one.</p>
        </div>
        <CreateDeckButton />
      </div>

      {(!decks || decks.length === 0) ? (
        <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-base-300 rounded-lg bg-base-200/30">
          <p className="text-xl opacity-50 mb-8 font-medium">You don't have any decks yet.</p>
          <CreateDeckButton className="btn btn-primary px-10">
            Create your first deck
          </CreateDeckButton>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 justify-items-center">
          {decks.map((deck) => (
            <div key={deck.id} className="w-full max-w-sm">
              <DeckCard
                id={deck.id}
                name={deck.name}
                cardCount={deck.card_count || 0}
                dueCount={0}
                color={deck.color}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
