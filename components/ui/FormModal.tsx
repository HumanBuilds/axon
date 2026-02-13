'use client';

interface FormModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    loading?: boolean;
    error?: string | null;
    onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
    submitLabel?: string;
    loadingLabel?: string;
    submitDisabled?: boolean;
    className?: string;
    children: React.ReactNode;
}

export function FormModal({
    isOpen,
    onClose,
    title,
    loading = false,
    error,
    onSubmit,
    submitLabel = 'Submit',
    loadingLabel,
    submitDisabled = false,
    className,
    children,
}: FormModalProps) {
    const handleClose = () => {
        if (!loading) onClose();
    };

    return (
        <div
            className={`modal ${isOpen ? 'modal-open' : ''}`}
            onClick={(e) => e.stopPropagation()}
        >
            {isOpen && (
                <div className={`modal-box bg-base-100 border-2 border-neutral ${className ?? ''}`}>
                    <h3 className="font-black text-2xl tracking-tight mb-6">{title}</h3>

                    <form onSubmit={onSubmit}>
                        {children}

                        {error && (
                            <div className="alert alert-error text-sm py-2 mt-6">
                                <span>{error}</span>
                            </div>
                        )}

                        <div className="modal-action flex gap-2">
                            <button
                                type="button"
                                onClick={handleClose}
                                className="btn btn-ghost"
                                disabled={loading}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className={`btn btn-primary ${loading ? 'loading' : ''}`}
                                disabled={loading || submitDisabled}
                            >
                                {loading ? (loadingLabel ?? `${submitLabel}...`) : submitLabel}
                            </button>
                        </div>
                    </form>
                </div>
            )}
            <div className="modal-backdrop" onClick={handleClose}></div>
        </div>
    );
}
