'use client';

import { useState, useMemo } from 'react';
import { Flashcard } from './Flashcard';
import { ReviewButtons } from './ReviewButtons';
import { DatabaseCard, Rating, getReviewPreview } from '@/lib/fsrs';

interface StudySessionProps {
    initialCards: DatabaseCard[];
}

const REQUEUE_THRESHOLD_MS = 30 * 60 * 1000; // 30 minutes

export function StudySession({ initialCards }: StudySessionProps) {
    const [queue, setQueue] = useState<DatabaseCard[]>(initialCards);
    const [reviewedCount, setReviewedCount] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const currentCard = queue[0] ?? null;

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
                const { nextDue } = await response.json();

                setQueue(prev => {
                    const rest = prev.slice(1);

                    // If nextDue is within 30 minutes, re-add to end of queue
                    if (nextDue) {
                        const msUntilDue = new Date(nextDue).getTime() - Date.now();
                        if (msUntilDue < REQUEUE_THRESHOLD_MS) {
                            return [...rest, currentCard];
                        }
                    }

                    return rest;
                });
                setReviewedCount(prev => prev + 1);
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

    if (queue.length === 0 && reviewedCount > 0) {
        return (
            <div className="flex flex-col items-center justify-center h-96">
                <h2 className="text-2xl font-bold mb-4">Session Complete!</h2>
                <p className="opacity-70 mb-8">You've reviewed all cards for now.</p>
                <button
                    className="btn btn-primary"
                    onClick={() => window.location.href = '/'}
                >
                    Back to Dashboard
                </button>
            </div>
        );
    }

    if (queue.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-96">
                <h2 className="text-2xl font-bold mb-4">No cards due!</h2>
                <p className="opacity-70 mb-8">Check back later for more reviews.</p>
                <button
                    className="btn btn-primary"
                    onClick={() => window.location.href = '/'}
                >
                    Back to Dashboard
                </button>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center gap-8 w-full max-w-4xl mx-auto py-8">
            <div className="w-full flex justify-between items-center px-4">
                <span className="text-sm opacity-50">
                    {reviewedCount} reviewed · {queue.length} remaining
                </span>
            </div>

            <Flashcard key={`${currentCard!.id}-${reviewedCount}`} front={currentCard!.front} back={currentCard!.back} />

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
