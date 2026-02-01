'use client';

import { useState } from 'react';

interface CodeActionBarProps {
    code: string;
    canEdit?: boolean;
    canRun?: boolean;
    onEdit?: () => void;
    onRun?: () => void;
}

export function CodeActionBar({
    code,
    canEdit = false,
    canRun = false,
    onEdit,
    onRun,
}: CodeActionBarProps) {
    const [copied, setCopied] = useState(false);

    const handleCopy = (e: React.MouseEvent) => {
        e.stopPropagation();
        navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleEdit = (e: React.MouseEvent) => {
        e.stopPropagation();
        onEdit?.();
    };

    const handleRun = (e: React.MouseEvent) => {
        e.stopPropagation();
        onRun?.();
    };

    return (
        <div className="flex items-center gap-1">
            {/* Copy button */}
            <button
                onClick={handleCopy}
                className="p-1.5 rounded hover:bg-white/10 transition-colors"
                title="Copy code"
            >
                {copied ? (
                    <svg
                        className="w-4 h-4 text-green-400"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <polyline points="20 6 9 17 4 12" />
                    </svg>
                ) : (
                    <svg
                        className="w-4 h-4 text-white/60 hover:text-white/90"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                    </svg>
                )}
            </button>

            {/* Edit button */}
            {canEdit && (
                <button
                    onClick={handleEdit}
                    className="p-1.5 rounded hover:bg-white/10 transition-colors"
                    title="Edit code"
                >
                    <svg
                        className="w-4 h-4 text-white/60 hover:text-white/90"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                </button>
            )}

            {/* Run button */}
            {canRun && (
                <button
                    onClick={handleRun}
                    className="p-1.5 rounded hover:bg-white/10 transition-colors"
                    title="Run code"
                >
                    <svg
                        className="w-4 h-4 text-green-400/80 hover:text-green-400"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                    >
                        <polygon points="5 3 19 12 5 21 5 3" />
                    </svg>
                </button>
            )}
        </div>
    );
}
