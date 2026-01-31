'use client';

import { Rating } from 'ts-fsrs';

interface ReviewButtonsProps {
    intervals: { [key in Rating]: string };
    onRate: (rating: Rating) => void;
    disabled?: boolean;
}

export function ReviewButtons({ intervals, onRate, disabled }: ReviewButtonsProps) {
    const buttons = [
        { rating: Rating.Again, label: 'Again', style: 'btn-error' },
        { rating: Rating.Hard, label: 'Hard', style: 'btn-warning' },
        { rating: Rating.Good, label: 'Good', style: 'btn-success' },
        { rating: Rating.Easy, label: 'Easy', style: 'btn-info' },
    ];

    return (
        <div className="flex gap-4 justify-center flex-wrap">
            {buttons.map(({ rating, label, style }) => (
                <button
                    key={rating}
                    className={`btn ${style} flex-col h-auto py-2 min-w-[100px]`}
                    onClick={(e) => {
                        e.stopPropagation();
                        onRate(rating);
                    }}
                    disabled={disabled}
                >
                    <span className="text-lg font-bold">{label}</span>
                    <span className="text-xs opacity-75">{intervals[rating]}</span>
                </button>
            ))}
        </div>
    );
}
