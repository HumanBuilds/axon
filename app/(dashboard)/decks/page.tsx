import { createClient } from '@/lib/supabase/server';
import { DeckCard } from '@/components/deck/DeckCard';
import { CreateDeckButton } from '@/components/deck/CreateDeckButton';

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
        <div className="max-w-5xl mx-auto px-4 py-12">
            <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-16 text-center md:text-left">
                <div>
                    <h1 className="text-5xl font-black tracking-tight mb-2">My Decks</h1>
                    <p className="opacity-50 text-lg">Select a deck to start your study session.</p>
                </div>
                <CreateDeckButton />
            </div>

            {(!decks || decks.length === 0) ? (
                <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-base-300 rounded-lg bg-base-200/50">
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
