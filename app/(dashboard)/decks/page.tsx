import { createClient } from '@/lib/supabase/server';
import { DeckCard } from '@/components/deck/DeckCard';
import Link from 'next/link';

export default async function DecksPage() {
    const supabase = await createClient();

    // Fetch decks
    const { data: decks, error } = await supabase
        .from('decks')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching decks:', error);
    }

    return (
        <div className="container mx-auto px-4 py-12">
            <div className="flex justify-between items-center mb-12">
                <div>
                    <h1 className="text-4xl font-black tracking-tight mb-2">My Decks</h1>
                    <p className="opacity-50">Select a deck to start your study session.</p>
                </div>
                <button className="btn btn-primary px-8">
                    + Create Deck
                </button>
            </div>

            {(!decks || decks.length === 0) ? (
                <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-base-300 rounded-lg">
                    <p className="text-lg opacity-50 mb-6">You don't have any decks yet.</p>
                    <button className="btn btn-primary btn-outline">
                        Create your first deck
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {decks.map((deck) => (
                        <DeckCard
                            key={deck.id}
                            id={deck.id}
                            name={deck.name}
                            description={deck.description}
                            cardCount={deck.card_count || 0}
                            dueCount={0} // We'd need a separate query or join for this in a real app
                            color={deck.color}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
