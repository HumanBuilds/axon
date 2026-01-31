'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function createDeck(formData: FormData) {
    const supabase = await createClient();

    // Get user session
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        throw new Error('Unauthorized');
    }

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

    revalidatePath('/decks');
}
