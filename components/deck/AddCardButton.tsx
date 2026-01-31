'use client';

import { useState, useRef } from 'react';
import { createCard } from '@/lib/actions/cards';
import ReactMarkdown from 'react-markdown';

interface AddCardButtonProps {
    deckId: string;
}

export function AddCardButton({ deckId }: AddCardButtonProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [front, setFront] = useState('');
    const [back, setBack] = useState('');
    const [previewFront, setPreviewFront] = useState(false);
    const [previewBack, setPreviewBack] = useState(false);
    const formRef = useRef<HTMLFormElement>(null);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const formData = new FormData();
        formData.append('front', front);
        formData.append('back', back);

        try {
            await createCard(deckId, formData);
            setIsOpen(false);
            setFront('');
            setBack('');
            setPreviewFront(false);
            setPreviewBack(false);
        } catch (err: any) {
            setError(err.message || 'Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    const insertCode = (side: 'front' | 'back') => {
        const textarea = document.querySelector(`textarea[name="${side}"]`) as HTMLTextAreaElement;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = textarea.value;
        const selection = text.substring(start, end);

        const before = text.substring(0, start);
        const after = text.substring(end);

        let newContent = '';
        if (selection.includes('\n')) {
            newContent = `${before}\n\`\`\`\n${selection}\n\`\`\`\n${after}`;
        } else {
            newContent = `${before}\`${selection}\`${after}`;
        }

        if (side === 'front') setFront(newContent);
        else setBack(newContent);

        textarea.focus();
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
                <div className="modal-box bg-base-100 border border-base-300 max-w-5xl">
                    <h3 className="font-black text-2xl tracking-tight mb-8">Add New Card</h3>

                    <form ref={formRef} onSubmit={handleSubmit}>
                        <div className="flex flex-col md:flex-row gap-8 relative">
                            {/* Front Side */}
                            <div className="flex-1 space-y-4">
                                <div className="flex justify-between items-end">
                                    <label className="label p-0">
                                        <span className="label-text font-black uppercase text-xs tracking-widest opacity-60">Front (Question)</span>
                                    </label>
                                    <div className="flex gap-1">
                                        <button
                                            type="button"
                                            onClick={() => insertCode('front')}
                                            className="btn btn-ghost btn-xs opacity-40 hover:opacity-100"
                                            title="Insert Code"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setPreviewFront(!previewFront)}
                                            className={`btn btn-xs ${previewFront ? 'btn-primary' : 'btn-ghost opacity-40 hover:opacity-100'}`}
                                        >
                                            {previewFront ? 'Edit' : 'Preview'}
                                        </button>
                                    </div>
                                </div>
                                {previewFront ? (
                                    <div className="h-48 w-full p-4 border border-base-300 rounded-lg overflow-auto bg-base-200/50 prose prose-sm max-w-none">
                                        <ReactMarkdown>{front || '*Empty*'}</ReactMarkdown>
                                    </div>
                                ) : (
                                    <textarea
                                        name="front"
                                        className="textarea textarea-bordered h-48 w-full resize-none font-mono text-sm focus:textarea-primary"
                                        placeholder="What's the question? (Markdown supported)"
                                        value={front}
                                        onChange={(e) => setFront(e.target.value)}
                                        required
                                    ></textarea>
                                )}
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
                                <div className="flex justify-between items-end">
                                    <label className="label p-0">
                                        <span className="label-text font-black uppercase text-xs tracking-widest opacity-60">Back (Answer)</span>
                                    </label>
                                    <div className="flex gap-1">
                                        <button
                                            type="button"
                                            onClick={() => insertCode('back')}
                                            className="btn btn-ghost btn-xs opacity-40 hover:opacity-100"
                                            title="Insert Code"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setPreviewBack(!previewBack)}
                                            className={`btn btn-xs ${previewBack ? 'btn-primary' : 'btn-ghost opacity-40 hover:opacity-100'}`}
                                        >
                                            {previewBack ? 'Edit' : 'Preview'}
                                        </button>
                                    </div>
                                </div>
                                {previewBack ? (
                                    <div className="h-48 w-full p-4 border border-base-300 rounded-lg overflow-auto bg-base-200/50 prose prose-sm max-w-none">
                                        <ReactMarkdown>{back || '*Empty*'}</ReactMarkdown>
                                    </div>
                                ) : (
                                    <textarea
                                        name="back"
                                        className="textarea textarea-bordered h-48 w-full resize-none font-mono text-sm focus:textarea-primary"
                                        placeholder="And the answer is... (Markdown supported)"
                                        value={back}
                                        onChange={(e) => setBack(e.target.value)}
                                        required
                                    ></textarea>
                                )}
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
