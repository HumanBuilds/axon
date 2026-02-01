'use client';

import { useState } from 'react';
import type { ExecutionResult, ExecutionError } from '@/lib/code/executor';

export interface ExecutionOutputProps {
    result: ExecutionResult | ExecutionError;
    cleanOutput: (output: string) => string;
}

export function ExecutionOutput({ result, cleanOutput }: ExecutionOutputProps) {
    const [copied, setCopied] = useState(false);

    // Determine if this is an error (non-zero exit code or execution failure)
    const isError = !result.success || (result.success && result.exitCode !== 0);

    // Get the output text
    const getOutputText = (): string => {
        if (!result.success) {
            return result.message;
        }
        // For errors, prefer stderr, fall back to stdout
        if (isError && result.stderr) {
            return result.stderr;
        }
        // For success, show stdout
        return result.stdout || result.stderr || '';
    };

    const outputText = getOutputText();
    const cleanedOutput = cleanOutput(outputText);

    const handleCopy = () => {
        navigator.clipboard.writeText(cleanedOutput);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (!outputText && result.success) {
        return (
            <div className="border-t border-white/10 p-3 font-mono text-xs">
                <span className="text-white/30 italic">No output</span>
            </div>
        );
    }

    return (
        <div className="border-t border-white/10 p-3 font-mono text-xs">
            <div className="flex items-start justify-between gap-2">
                <pre className={`flex-1 whitespace-pre-wrap ${isError ? 'text-red-400' : 'text-green-400'}`}>
                    {cleanedOutput}
                </pre>
                <button
                    type="button"
                    onClick={handleCopy}
                    className="shrink-0 p-1 rounded hover:bg-white/10 transition-colors"
                    title="Copy output"
                >
                    {copied ? (
                        <svg className="w-3.5 h-3.5 text-green-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                        </svg>
                    ) : (
                        <svg className="w-3.5 h-3.5 text-white/40 hover:text-white/70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                        </svg>
                    )}
                </button>
            </div>
        </div>
    );
}
