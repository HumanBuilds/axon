'use client';

import { useState, useRef } from 'react';
import { createDeck } from '@/lib/actions/decks';

interface CreateDeckButtonProps {
    className?: string;
    children?: React.ReactNode;
}

export function CreateDeckButton({ className, children }: CreateDeckButtonProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const formRef = useRef<HTMLFormElement>(null);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const formData = new FormData(e.currentTarget);
        try {
            await createDeck(formData);
            setIsOpen(false);
            formRef.current?.reset();
        } catch (err: any) {
            setError(err.message || 'Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className={className || "btn btn-primary px-8"}
            >
                {children || '+ Create Deck'}
            </button>

            {/* Modal */}
            <div className={`modal ${isOpen ? 'modal-open' : ''}`}>
                <div className="modal-box bg-base-100 border border-base-300">
                    <h3 className="font-black text-2xl tracking-tight mb-6">Create New Deck</h3>

                    <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
                        <div className="form-control">
                            <label className="label">
                                <span className="label-text font-bold">Deck Name</span>
                            </label>
                            <input
                                name="name"
                                type="text"
                                placeholder="e.g. Spanish Vocabulary"
                                className="input input-bordered"
                                required
                            />
                        </div>

                        <div className="form-control">
                            <label className="label">
                                <span className="label-text font-bold">Description (optional)</span>
                            </label>
                            <textarea
                                name="description"
                                className="textarea textarea-bordered h-24"
                                placeholder="What is this deck about?"
                            ></textarea>
                        </div>

                        {error && (
                            <div className="alert alert-error text-sm py-2">
                                <span>{error}</span>
                            </div>
                        )}

                        <div className="modal-action flex gap-2">
                            <button
                                type="button"
                                onClick={() => setIsOpen(false)}
                                className="btn btn-ghost"
                                disabled={loading}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className={`btn btn-primary ${loading ? 'loading' : ''}`}
                                disabled={loading}
                            >
                                {loading ? 'Creating...' : 'Create Deck'}
                            </button>
                        </div>
                    </form>
                </div>
                <div className="modal-backdrop" onClick={() => !loading && setIsOpen(false)}></div>
            </div>
        </>
    );
}
