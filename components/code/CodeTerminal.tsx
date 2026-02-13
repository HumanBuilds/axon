'use client';

import type { ExecutionResult, ExecutionError } from '@/lib/code/executor';

interface CodeTerminalProps {
    result: ExecutionResult | ExecutionError | null;
    isLoading: boolean;
    onClose: () => void;
}

export function CodeTerminal({ result, isLoading, onClose }: CodeTerminalProps) {
    const handleClose = (e: React.MouseEvent) => {
        e.stopPropagation();
        onClose();
    };

    return (
        <div className="border-t border-slate-200 bg-slate-50 animate-slide-up">
            {/* Terminal header */}
            <div className="flex items-center justify-between px-4 py-2 bg-slate-100 border-b border-slate-200">
                <div className="flex items-center gap-2">
                    <svg
                        className="w-4 h-4 text-slate-500"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <polyline points="4 17 10 11 4 5" />
                        <line x1="12" y1="19" x2="20" y2="19" />
                    </svg>
                    <span className="text-xs font-medium text-slate-500">Output</span>

                    {/* Exit code badge */}
                    {result && result.success && (
                        <span
                            className={`px-1.5 py-0.5 text-[10px] font-medium ${
                                result.exitCode === 0
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-red-100 text-red-700'
                            }`}
                        >
                            exit {result.exitCode}
                        </span>
                    )}

                    {/* Error badge */}
                    {result && !result.success && (
                        <span className="px-1.5 py-0.5 text-[10px] font-medium bg-red-100 text-red-700">
                            {result.errorType}
                        </span>
                    )}
                </div>

                <button
                    onClick={handleClose}
                    className="p-1 hover:bg-slate-200 transition-colors"
                    title="Close terminal"
                >
                    <svg
                        className="w-4 h-4 text-slate-500"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                </button>
            </div>

            {/* Terminal content */}
            <div className="p-4 font-mono text-sm max-h-48 overflow-auto">
                {isLoading && (
                    <div className="flex items-center gap-2 text-slate-500">
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                            <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                                fill="none"
                            />
                            <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            />
                        </svg>
                        <span>Running...</span>
                    </div>
                )}

                {!isLoading && result && result.success && (
                    <div className="space-y-2">
                        {/* stdout */}
                        {result.stdout && (
                            <pre className="text-green-600 whitespace-pre-wrap break-words">
                                {result.stdout}
                            </pre>
                        )}

                        {/* stderr */}
                        {result.stderr && (
                            <pre className="text-red-600 whitespace-pre-wrap break-words">
                                {result.stderr}
                            </pre>
                        )}

                        {/* Empty output */}
                        {!result.stdout && !result.stderr && (
                            <span className="text-slate-400 italic">
                                No output
                            </span>
                        )}

                        {/* Execution time */}
                        {result.executionTime && (
                            <div className="text-slate-400 text-xs mt-2">
                                Completed in {Math.round(result.executionTime)}ms
                            </div>
                        )}
                    </div>
                )}

                {!isLoading && result && !result.success && (
                    <div className="text-red-600">
                        <div className="font-semibold mb-1">Error</div>
                        <div className="text-red-500">{result.message}</div>
                    </div>
                )}
            </div>
        </div>
    );
}
