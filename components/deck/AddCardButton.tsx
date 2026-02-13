'use client';

import { useState } from 'react';
import { createCard } from '@/lib/actions/cards';
import { CardContentEditor } from './CardContentEditor';
import { Modal } from '@/components/ui/Modal';

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
        if (loading) return;
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

            <Modal
                isOpen={isOpen}
                onClose={handleClose}
                title="Add New Card"
                className="max-w-2xl"
                footer={
                    <>
                        <div className="flex gap-3 ml-auto">
                            <button
                                type="submit"
                                form="add-card-form"
                                disabled={loading || (!front.trim() && !back.trim())}
                                className="btn-primary"
                            >
                                {loading ? 'Adding...' : 'Create Card'}
                            </button>
                        </div>
                    </>
                }
            >
                <form id="add-card-form" onSubmit={handleSubmit} className="p-6">
                    <div className="space-y-6">
                        {/* Front Side */}
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <label className="text-xs font-bold uppercase tracking-widest text-primary">Front (Question)</label>
                                <span className="text-[10px] font-mono text-primary">Markdown Supported</span>
                            </div>
                            <div className="h-[200px]">
                                <CardContentEditor
                                    value={front}
                                    onChange={setFront}
                                    placeholder="What's the question? (Markdown supported)"
                                    autoFocus={isOpen}
                                />
                            </div>
                        </div>

                        {/* Back Side */}
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <label className="text-xs font-bold uppercase tracking-widest text-primary">Back (Answer)</label>
                                <span className="text-[10px] font-mono text-primary">Markdown Supported</span>
                            </div>
                            <div className="h-[200px]">
                                <CardContentEditor
                                    value={back}
                                    onChange={setBack}
                                    placeholder="And the answer is... (Markdown supported)"
                                />
                            </div>
                        </div>
                    </div>

                    {error && (
                        <div className="mt-4 px-4 py-2 border-2 border-error bg-error/10 text-error text-sm font-bold">
                            {error}
                        </div>
                    )}
                </form>
            </Modal>
        </>
    );
}
