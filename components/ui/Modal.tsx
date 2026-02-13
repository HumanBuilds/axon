'use client';

import { motion, AnimatePresence } from 'framer-motion';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    icon?: React.ReactNode;
    className?: string;
    children: React.ReactNode;
    footer?: React.ReactNode;
}

export function Modal({
    isOpen,
    onClose,
    title,
    icon,
    className,
    children,
    footer,
}: ModalProps) {
    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    onClick={onClose}
                >
                    {/* Overlay */}
                    <div className="absolute inset-0 bg-base-content/60" />

                    {/* Container */}
                    <div
                        className={`relative w-full max-w-2xl bg-base-100 border-[3px] border-primary shadow-[8px_8px_0px_0px_rgba(50,17,212,0.2)] flex flex-col ${className ?? ''}`}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <header className="flex items-center justify-between px-6 py-4 border-b-2 border-primary/10">
                            <div className="flex items-center gap-3">
                                {icon}
                                <h2 className="text-lg font-bold uppercase tracking-wider">{title}</h2>
                            </div>
                            <button
                                type="button"
                                onClick={onClose}
                                className="hover:bg-primary/5 p-1 transition-colors"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="18" y1="6" x2="6" y2="18" />
                                    <line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                            </button>
                        </header>

                        {/* Scrollable content */}
                        <div className="overflow-y-auto max-h-[80vh]">
                            {children}
                        </div>

                        {/* Footer (optional) */}
                        {footer && (
                            <footer className="px-6 py-4 border-t-2 border-primary/10 bg-base-200 flex items-center justify-between">
                                {footer}
                            </footer>
                        )}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
