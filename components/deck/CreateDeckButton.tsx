'use client';

import { useState } from 'react';
import { createDeck } from '@/lib/actions/decks';
import { FormModal } from '@/components/ui/FormModal';

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

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className={className || "btn btn-primary px-8"}
            >
                {children || '+ Create Deck'}
            </button>

            <FormModal
                isOpen={isOpen}
                onClose={() => { setIsOpen(false); setError(null); }}
                title="Create New Deck"
                loading={loading}
                error={error}
                onSubmit={handleSubmit}
                submitLabel="Create Deck"
                loadingLabel="Creating..."
            >
                <div className="space-y-4">
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
                </div>
            </FormModal>
        </>
    );
}
