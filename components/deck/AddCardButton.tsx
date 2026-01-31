'use client';

import { useState, useRef } from 'react';
import { createCard } from '@/lib/actions/cards';

interface AddCardButtonProps {
    deckId: string;
}

export function AddCardButton({ deckId }: AddCardButtonProps) {
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
            await createCard(deckId, formData);
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

            {/* Modal */}
            <div className={`modal ${isOpen ? 'modal-open' : ''}`} onClick={(e) => e.stopPropagation()}>
                <div className="modal-box bg-base-100 border border-base-300 max-w-4xl">
                    <h3 className="font-black text-2xl tracking-tight mb-8">Add New Card</h3>

                    <form ref={formRef} onSubmit={handleSubmit}>
                        <div className="flex flex-col md:flex-row gap-8 relative">
                            {/* Front Side */}
                            <div className="flex-1 space-y-4">
                                <div className="form-control">
                                    <label className="label">
                                        <span className="label-text font-black uppercase text-xs tracking-widest opacity-60">Front (Question)</span>
                                    </label>
                                    <textarea
                                        name="front"
                                        className="textarea textarea-bordered h-48 w-full resize-none font-medium text-lg focus:textarea-primary"
                                        placeholder="What's the question?"
                                        required
                                    ></textarea>
                                </div>
                            </div>

                            {/* Divider */}
                            <div className="hidden md:flex flex-col items-center justify-center">
                                <div className="w-[1px] h-full bg-base-300 relative">
                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-base-100 p-2 border border-base-300 rounded-sm">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-40"><path d="m9 18 6-6-6-6" /></svg>
                                    </div>
                                </div>
                            </div>
                            <div className="divider md:hidden"></div>

                            {/* Back Side */}
                            <div className="flex-1 space-y-4">
                                <div className="form-control">
                                    <label className="label">
                                        <span className="label-text font-black uppercase text-xs tracking-widest opacity-60">Back (Answer)</span>
                                    </label>
                                    <textarea
                                        name="back"
                                        className="textarea textarea-bordered h-48 w-full resize-none font-medium text-lg focus:textarea-primary"
                                        placeholder="And the answer is..."
                                        required
                                    ></textarea>
                                </div>
                            </div>
                        </div>

                        {error && (
                            <div className="alert alert-error text-sm py-2 mt-6">
                                <span>{error}</span>
                            </div>
                        )}

                        <div className="modal-action flex gap-2 mt-10">
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
                                className={`btn btn-primary px-10 ${loading ? 'loading' : ''}`}
                                disabled={loading}
                            >
                                {loading ? 'Adding...' : 'Add Card'}
                            </button>
                        </div>
                    </form>
                </div>
                <div className="modal-backdrop" onClick={() => !loading && setIsOpen(false)}></div>
            </div>
        </>
    );
}
