'use client';

import Link from 'next/link';

interface DeckCardProps {
    id: string;
    name: string;
    description: string | null;
    cardCount: number;
    dueCount: number;
    color?: string;
}

export function DeckCard({ id, name, description, cardCount, dueCount, color = '#6366f1' }: DeckCardProps) {
    return (
        <div className="card bg-base-100 shadow-sm hover:shadow-md transition-shadow border border-base-300 overflow-hidden">
            <div
                className="h-2 w-full"
                style={{ backgroundColor: color }}
            />
            <div className="card-body">
                <div className="flex justify-between items-start">
                    <h2 className="card-title text-2xl tracking-tight">{name}</h2>
                    <div className="badge badge-neutral">{cardCount} cards</div>
                </div>
                <p className="opacity-60 text-sm line-clamp-2 min-h-[2.5rem]">
                    {description || 'No description provided.'}
                </p>
                <div className="card-actions justify-between items-center mt-4">
                    <div>
                        {dueCount > 0 ? (
                            <span className="text-sm font-bold text-error">
                                {dueCount} due for review
                            </span>
                        ) : (
                            <span className="text-sm opacity-40">All caught up!</span>
                        )}
                    </div>
                    <div className="flex gap-2">
                        <Link href={`/decks/${id}`} className="btn btn-ghost btn-sm">Edit</Link>
                        {cardCount > 0 ? (
                            <Link
                                href={`/decks/${id}/study`}
                                className={`btn btn-sm ${dueCount > 0 ? 'btn-primary' : 'btn-ghost border-base-300'}`}
                            >
                                Study
                            </Link>
                        ) : (
                            <button className="btn btn-sm btn-disabled" disabled>
                                Study
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
