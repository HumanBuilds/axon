import { createClient } from '@/lib/supabase/server';
import { StudySession } from '@/components/flashcard/StudySession';
import { notFound } from 'next/navigation';

export default async function StudyPage({ params }: { params: Promise<{ deckId: string }> }) {
    const { deckId } = await params;
    const supabase = await createClient();

    // Fetch cards due for review
    const { data: cards, error } = await supabase
        .from('cards')
        .select('*')
        .eq('deck_id', deckId)
        .lte('due', new Date().toISOString())
        .order('due', { ascending: true })
        .limit(20);

    if (error) {
        console.error('Error fetching cards:', error);
    }

    return (
        <div className="container mx-auto px-4 py-12">
            <h1 className="text-3xl font-black tracking-tight mb-12 text-center uppercase opacity-20">Study Session</h1>
            <StudySession initialCards={cards ?? []} />
        </div>
    );
}
