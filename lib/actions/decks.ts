'use server';

import { revalidatePath } from 'next/cache';
import { requireAuth } from './auth';

export async function createDeck(formData: FormData) {
    const { supabase, user } = await requireAuth();

    const name = formData.get('name') as string;
    const description = formData.get('description') as string;

    if (!name) {
        throw new Error('Name is required');
    }

    const { error } = await supabase
        .from('decks')
        .insert({
            user_id: user.id,
            name,
            description,
        });

    if (error) {
        console.error('Error creating deck:', error);
        throw new Error(error.message);
    }

    revalidatePath('/');
}

export async function updateDeckName(deckId: string, name: string) {
    const { supabase, user } = await requireAuth();

    if (!name) {
        throw new Error('Name is required');
    }

    const { error } = await supabase
        .from('decks')
        .update({ name })
        .eq('id', deckId)
        .eq('user_id', user.id);

    if (error) {
        console.error('Error updating deck:', error);
        throw new Error(error.message);
    }

    revalidatePath('/');
}
