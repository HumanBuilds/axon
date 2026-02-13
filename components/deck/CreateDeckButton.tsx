'use client';

import { useState } from 'react';
import { createDeck } from '@/lib/actions/decks';
import { Modal } from '@/components/ui/FormModal';

interface CreateDeckButtonProps {
    className?: string;
    children?: React.ReactNode;
}

export function CreateDeckButton({ className, children }: CreateDeckButtonProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const formData = new FormData(e.currentTarget);
        try {
            await createDeck(formData);
            setIsOpen(false);
        } catch (err: any) {
            setError(err.message || 'Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        if (loading) return;
        setIsOpen(false);
        setError(null);
    };

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className={className || "btn btn-primary px-8"}
            >
                {children || '+ Create Deck'}
            </button>

            <Modal
                isOpen={isOpen}
                onClose={handleClose}
                title="Create New Deck"
                icon={
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                        <path d="M12 3h7a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5" />
                        <line x1="12" y1="8" x2="12" y2="16" />
                        <line x1="8" y1="12" x2="16" y2="12" />
                    </svg>
                }
                footer={
                    <>
                        <div />
                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={handleClose}
                                disabled={loading}
                                className="btn-primary-ghost"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                form="create-deck-form"
                                disabled={loading}
                                className="btn-primary"
                            >
                                {loading ? 'Creating...' : 'Create Deck'}
                            </button>
                        </div>
                    </>
                }
            >
                <form id="create-deck-form" onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-primary/60">
                            Deck Name
                        </label>
                        <input
                            name="name"
                            type="text"
                            placeholder="e.g. Spanish Vocabulary"
                            className="input input-bordered w-full"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-primary/60">
                            Description (optional)
                        </label>
                        <textarea
                            name="description"
                            className="textarea textarea-bordered h-24 w-full"
                            placeholder="What is this deck about?"
                        ></textarea>
                    </div>

                    {error && (
                        <div className="px-4 py-2 border-2 border-error bg-error/10 text-error text-sm font-bold">
                            {error}
                        </div>
                    )}
                </form>
            </Modal>
        </>
    );
}
