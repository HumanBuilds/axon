'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';

interface FlashcardProps {
    front: string;
    back: string;
}

export function Flashcard({ front, back }: FlashcardProps) {
    const [isFlipped, setIsFlipped] = useState(false);

    return (
        <div
            className="perspective-1000 w-full max-w-2xl h-96 cursor-pointer"
            onClick={() => setIsFlipped(!isFlipped)}
        >
            <motion.div
                className="relative w-full h-full"
                initial={false}
                animate={{ rotateY: isFlipped ? 180 : 0 }}
                transition={{ duration: 0.6, type: 'spring', stiffness: 100 }}
                style={{ transformStyle: 'preserve-3d' }}
            >
                {/* Front */}
                <div className="card bg-base-100 shadow-xl absolute inset-0 backface-hidden">
                    <div className="card-body items-center justify-center text-center">
                        <div className="prose prose-lg">
                            <ReactMarkdown>{front}</ReactMarkdown>
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
                    className="card bg-base-200 shadow-xl absolute inset-0 backface-hidden"
                    style={{ transform: 'rotateY(180deg)' }}
                >
                    <div className="card-body items-center justify-center text-center">
                        <div className="prose prose-lg">
                            <ReactMarkdown>{back}</ReactMarkdown>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
