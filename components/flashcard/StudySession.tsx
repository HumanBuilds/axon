'use client';

import { useState, useMemo } from 'react';
import { Flashcard } from './Flashcard';
import { ReviewButtons } from './ReviewButtons';
import { DatabaseCard, Rating, getReviewPreview } from '@/lib/fsrs';

interface StudySessionProps {
    initialCards: DatabaseCard[];
}

export function StudySession({ initialCards }: StudySessionProps) {
    const [cards, setCards] = useState<DatabaseCard[]>(initialCards);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const currentCard = cards[currentIndex];

    const intervals = useMemo(() => {
        if (!currentCard) return {} as { [key in Rating]: string };
        const previews = getReviewPreview(currentCard);
        const map = {} as { [key in Rating]: string };
        previews.forEach(p => {
            map[p.rating] = p.interval;
        });
        return map;
    }, [currentCard]);

    const handleRate = async (rating: Rating) => {
        if (!currentCard || isSubmitting) return;

        setIsSubmitting(true);
        try {
            const response = await fetch('/api/review', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ cardId: currentCard.id, rating }),
            });

            if (response.ok) {
                // Move to next card
                setCurrentIndex(prev => prev + 1);
            } else {
                alert('Failed to save review');
            }
        } catch (error) {
            console.error('Error submitting review:', error);
            alert('Error submitting review');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (currentIndex >= cards.length) {
        return (
            <div className="flex flex-col items-center justify-center h-96">
                <h2 className="text-2xl font-bold mb-4">Session Complete!</h2>
                <p className="opacity-70 mb-8">You've reviewed all cards for now.</p>
                <button
                    className="btn btn-primary"
                    onClick={() => window.location.href = '/decks'}
                >
                    Back to Decks
                </button>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center gap-8 w-full max-w-4xl mx-auto py-8">
            <div className="w-full flex justify-between items-center px-4">
                <span className="text-sm opacity-50">
                    Card {currentIndex + 1} of {cards.length}
                </span>
                <div className="radial-progress text-primary" style={{ "--value": (currentIndex / cards.length) * 100, "--size": "3rem" } as any} role="progressbar">
                    {Math.round((currentIndex / cards.length) * 100)}%
                </div>
            </div>

            <Flashcard front={currentCard.front} back={currentCard.back} />

            <div className="w-full mt-4">
                <ReviewButtons
                    intervals={intervals}
                    onRate={handleRate}
                    disabled={isSubmitting}
                />
            </div>
        </div>
    );
}
