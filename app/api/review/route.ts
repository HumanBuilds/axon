import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { reviewCard, Rating } from '@/lib/fsrs';

export async function POST(request: NextRequest) {
    try {
        const { cardId, rating } = await request.json();
        const supabase = await createClient();

        // Fetch current card state
        const { data: card, error: fetchError } = await supabase
            .from('cards')
            .select('*')
            .eq('id', cardId)
            .single();

        if (fetchError || !card) {
            return NextResponse.json({ error: 'Card not found' }, { status: 404 });
        }

        // Calculate new FSRS state
        const { updatedCard, reviewLog } = reviewCard(card, rating as Rating);

        // Update card and create review log
        const { error: updateError } = await supabase
            .from('cards')
            .update(updatedCard)
            .eq('id', cardId);

        if (updateError) {
            return NextResponse.json({ error: 'Failed to update card' }, { status: 500 });
        }

        const { error: logError } = await supabase
            .from('review_logs')
            .insert(reviewLog);

        if (logError) {
            console.error('Failed to save review log:', logError);
            // We don't fail the whole request if only the log fails, 
            // but in production we might want more robust error handling.
        }

        return NextResponse.json({ success: true, nextDue: updatedCard.due });
    } catch (error) {
        console.error('Review API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
