'use client';

import { Rating } from 'ts-fsrs';

interface ReviewButtonsProps {
    intervals: { [key in Rating]: string };
    onRate: (rating: Rating) => void;
    disabled?: boolean;
}

export function ReviewButtons({ intervals, onRate, disabled }: ReviewButtonsProps) {
    const buttons = [
        { rating: Rating.Again, label: 'Again' },
        { rating: Rating.Hard, label: 'Hard' },
        { rating: Rating.Good, label: 'Good' },
        { rating: Rating.Easy, label: 'Easy' },
    ];

    return (
        <div className="flex gap-3 justify-center items-center flex-wrap">
            {buttons.map(({ rating, label }) => (
                <button
                    key={rating}
                    className="group flex flex-col items-center justify-center py-2 px-6 rounded-xl border border-base-300 bg-base-100 hover:bg-base-200 transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
                    onClick={(e) => {
                        e.stopPropagation();
                        onRate(rating);
                    }}
                    disabled={disabled}
                >
                    <span className="text-sm font-black uppercase tracking-wider font-[family-name:var(--font-header)]">
                        {label}
                    </span>
                    <span className="text-[10px] font-bold opacity-40 font-[family-name:var(--font-body)]">
                        {intervals[rating]}
                    </span>
                </button>
            ))}
        </div>
    );
}
