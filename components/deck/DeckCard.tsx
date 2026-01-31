'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { AddCardButton } from './AddCardButton';
import { updateDeckName } from '@/lib/actions/decks';

interface DeckCardProps {
    id: string;
    name: string;
    cardCount: number;
    dueCount: number;
    color?: string;
}

export function DeckCard({ id, name, cardCount, dueCount, color = '#6366f1' }: DeckCardProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState(name);
    const [isHovering, setIsHovering] = useState(false);
    const hoverTimerRef = useRef<NodeJS.Timeout | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isHovering && !isEditing) {
            hoverTimerRef.current = setTimeout(() => {
                setIsEditing(true);
            }, 1500); // 1.5 seconds hover to edit
        } else {
            if (hoverTimerRef.current) {
                clearTimeout(hoverTimerRef.current);
            }
        }

        return () => {
            if (hoverTimerRef.current) {
                clearTimeout(hoverTimerRef.current);
            }
        };
    }, [isHovering, isEditing]);

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [isEditing]);

    const handleUpdateName = async () => {
        if (editName.trim() === '' || editName === name) {
            setIsEditing(false);
            setEditName(name);
            return;
        }

        try {
            await updateDeckName(id, editName);
            setIsEditing(false);
        } catch (error) {
            console.error('Failed to update deck name:', error);
            setEditName(name);
            setIsEditing(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleUpdateName();
        } else if (e.key === 'Escape') {
            setEditName(name);
            setIsEditing(false);
        }
    };

    return (
        <div
            className="card bg-base-100 shadow-sm hover:shadow-md transition-shadow border border-base-300 overflow-hidden"
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
        >
            <div
                className="h-2 w-full"
                style={{ backgroundColor: color }}
            />
            <div className="card-body">
                <div className="flex justify-between items-start mb-4">
                    {isEditing ? (
                        <input
                            ref={inputRef}
                            type="text"
                            className="input input-sm input-bordered w-full font-bold text-lg h-9"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            onBlur={handleUpdateName}
                            onKeyDown={handleKeyDown}
                        />
                    ) : (
                        <h2
                            className={`card-title text-2xl tracking-tight transition-opacity ${isHovering ? 'opacity-70' : ''}`}
                            title="Hover to edit name"
                        >
                            {name}
                        </h2>
                    )}
                    <div className="badge badge-neutral ml-2">{cardCount} cards</div>
                </div>

                <div className="card-actions justify-between items-center">
                    <div>
                        {dueCount > 0 ? (
                            <span className="text-sm font-bold text-error">
                                {dueCount} due
                            </span>
                        ) : (
                            <span className="text-sm opacity-40">Done</span>
                        )}
                    </div>
                    <div className="flex gap-2">
                        <AddCardButton deckId={id} />
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
