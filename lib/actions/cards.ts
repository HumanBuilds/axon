'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { createEmptyCard, fsrsToDBCard } from '@/lib/fsrs';

export async function createCard(deckId: string, formData: FormData) {
    const supabase = await createClient();

    // Get user session to ensure they own the deck (RLS will handle this, but good to check)
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        throw new Error('Unauthorized');
    }

    const front = formData.get('front') as string;
    const back = formData.get('back') as string;

    if (!front || !back) {
        throw new Error('Front and back content are required');
    }

    // Create initial FSRS state for the card
    const emptyCard = createEmptyCard();
    const fsrsState = fsrsToDBCard(emptyCard);

    const { error } = await supabase
        .from('cards')
        .insert({
            deck_id: deckId,
            front,
            back,
            ...fsrsState
        });

    if (error) {
        console.error('Error creating card:', error);
        throw new Error(error.message);
    }

    revalidatePath('/');
}
