'use client';

import { useState } from 'react';
import { createCard } from '@/lib/actions/cards';
import { CardContentEditor } from './CardContentEditor';
import { FormModal } from '@/components/ui/FormModal';

interface AddCardButtonProps {
    deckId: string;
}

export function AddCardButton({ deckId }: AddCardButtonProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [front, setFront] = useState('');
    const [back, setBack] = useState('');

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const formData = new FormData();
        formData.append('front', front);
        formData.append('back', back);

        try {
            await createCard(deckId, formData);
            handleClose();
        } catch (err: any) {
            setError(err.message || 'Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setIsOpen(false);
        setFront('');
        setBack('');
        setError(null);
    };

    return (
        <>
            <button
                onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsOpen(true);
                }}
                className="btn btn-square btn-sm btn-ghost border border-base-300"
                title="Add Card"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            </button>

            <FormModal
                isOpen={isOpen}
                onClose={handleClose}
                title="Add New Card"
                loading={loading}
                error={error}
                onSubmit={handleSubmit}
                submitLabel="Add Card"
                loadingLabel="Adding..."
                submitDisabled={!front.trim() && !back.trim()}
                className="max-w-5xl max-h-[90vh] overflow-y-auto"
            >
                <div className="flex flex-col md:flex-row gap-8 relative">
                    {/* Front Side */}
                    <div className="flex-1 space-y-4">
                        <label className="label p-0">
                            <span className="label-text font-black uppercase text-xs tracking-widest opacity-60">Front (Question)</span>
                        </label>
                        <CardContentEditor
                            value={front}
                            onChange={setFront}
                            placeholder="What's the question? (Markdown supported)"
                            autoFocus={isOpen}
                        />
                    </div>

                    {/* Divider */}
                    <div className="hidden md:flex flex-col items-center justify-center">
                        <div className="w-[1px] h-full bg-base-300 relative">
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-base-100 p-2 border-2 border-neutral">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-40"><path d="m9 18 6-6-6-6" /></svg>
                            </div>
                        </div>
                    </div>
                    <div className="divider md:hidden"></div>

                    {/* Back Side */}
                    <div className="flex-1 space-y-4">
                        <label className="label p-0">
                            <span className="label-text font-black uppercase text-xs tracking-widest opacity-60">Back (Answer)</span>
                        </label>
                        <CardContentEditor
                            value={back}
                            onChange={setBack}
                            placeholder="And the answer is... (Markdown supported)"
                        />
                    </div>
                </div>
            </FormModal>
        </>
    );
}
