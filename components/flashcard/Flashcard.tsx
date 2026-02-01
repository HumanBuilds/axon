'use client';

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Markdown } from '@/components/ui/Markdown';

interface FlashcardProps {
    front: string;
    back: string;
}

export function Flashcard({ front, back }: FlashcardProps) {
    const [isFlipped, setIsFlipped] = useState(false);

    // Handle card flip - only flip if clicking on the card background, not on interactive elements
    const handleCardClick = useCallback((e: React.MouseEvent) => {
        // Check if click originated from within a code block or button
        const target = e.target as HTMLElement;
        const isCodeBlock = target.closest('[data-code-block]') || target.closest('.shiki-code');
        const isButton = target.closest('button');

        if (!isCodeBlock && !isButton) {
            setIsFlipped(!isFlipped);
        }
    }, [isFlipped]);

    return (
        <div
            className="perspective-1000 w-full max-w-2xl min-h-96 cursor-pointer"
            onClick={handleCardClick}
        >
            <motion.div
                className="relative w-full min-h-96"
                initial={false}
                animate={{ rotateY: isFlipped ? 180 : 0 }}
                transition={{ duration: 0.6, type: 'spring', stiffness: 100 }}
                style={{ transformStyle: 'preserve-3d' }}
            >
                {/* Front */}
                <div className="card bg-base-100 shadow-xl absolute inset-0 backface-hidden overflow-auto">
                    <div className="card-body items-center justify-center">
                        <div data-code-block className="w-full max-w-full">
                            <Markdown className="prose prose-lg axonic-reading-container max-w-none">
                                {front}
                            </Markdown>
                        </div>
                        {!isFlipped && (
                            <div className="card-actions justify-center mt-4">
                                <p className="text-xs opacity-50">Click to flip</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Back */}
                <div
                    className="card bg-base-200 shadow-xl absolute inset-0 backface-hidden overflow-auto"
                    style={{ transform: 'rotateY(180deg)' }}
                >
                    <div className="card-body items-center justify-center">
                        <div data-code-block className="w-full max-w-full">
                            <Markdown className="prose prose-lg axonic-reading-container max-w-none">
                                {back}
                            </Markdown>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
