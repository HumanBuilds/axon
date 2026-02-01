'use server';

import { revalidatePath } from 'next/cache';
import { createEmptyCard, fsrsToDBCard } from '@/lib/fsrs';
import { requireAuth } from './auth';

export async function createCard(deckId: string, formData: FormData) {
    const { supabase } = await requireAuth();

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
