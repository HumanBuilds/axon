'use client';

import { useState, useMemo, useCallback } from 'react';
import { getDisplayName, isExecutableLanguage, POPULAR_LANGUAGES } from '@/lib/code/languages';
import { executeCode, type ExecutionResult, type ExecutionError } from '@/lib/code/executor';
import { parseContent, reconstructContent, isEmptyContent, type ContentSegment } from '@/lib/code/markdown-utils';
import { InlineCodeEditor } from './InlineCodeEditor';
import { ExecutionOutput } from './ExecutionOutput';

interface CardContentEditorProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    side: 'front' | 'back';
}

interface InsertionPointProps {
    onActivate: () => void;
}

function InsertionPoint({ onActivate }: InsertionPointProps) {
    return (
        <button
            type="button"
            onClick={onActivate}
            className="w-full h-8 flex items-center justify-center group cursor-pointer relative opacity-0 hover:opacity-100 transition-opacity duration-150"
        >
            {/* Line */}
            <div className="absolute inset-x-3 h-px bg-base-300" />
            {/* Plus icon */}
            <div className="z-10 bg-base-100 px-2">
                <div className="w-5 h-5 rounded-full border-2 border-base-300 flex items-center justify-center transition-transform duration-150 group-hover:scale-110">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-base-content/50">
                        <line x1="12" y1="5" x2="12" y2="19"></line>
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                </div>
            </div>
        </button>
    );
}

export function CardContentEditor({ value, onChange, placeholder }: CardContentEditorProps) {
    const [showLangPicker, setShowLangPicker] = useState(false);
    const [runningIndex, setRunningIndex] = useState<number | null>(null);
    const [executionResult, setExecutionResult] = useState<{ index: number; result: ExecutionResult | ExecutionError } | null>(null);
    const [activeInsertionPoints, setActiveInsertionPoints] = useState<Set<number>>(new Set());

    const segments = useMemo(() => parseContent(value), [value]);

    // Activate an insertion point (expand to textarea)
    const activateInsertionPoint = useCallback((index: number) => {
        setActiveInsertionPoints(prev => new Set(prev).add(index));
    }, []);

    // Handle textarea blur - collapse if empty
    const handleTextareaBlur = useCallback((index: number, content: string) => {
        if (isEmptyContent(content)) {
            setActiveInsertionPoints(prev => {
                const next = new Set(prev);
                next.delete(index);
                return next;
            });
        }
    }, []);

    // Determine if a text segment should show textarea or insertion point
    const shouldShowTextarea = useCallback((segment: ContentSegment, index: number): boolean => {
        // Always show textarea for first segment when card has no code blocks (initial empty state)
        const hasCodeBlocks = segments.some(s => s.type === 'code');
        if (index === 0 && !hasCodeBlocks) {
            return true;
        }
        // Show textarea if it has non-empty content or is actively expanded
        return !isEmptyContent(segment.content) || activeInsertionPoints.has(index);
    }, [activeInsertionPoints, segments]);

    // Update a specific segment
    const updateSegment = useCallback((index: number, newContent: string) => {
        const newSegments = [...segments];
        newSegments[index] = { ...newSegments[index], content: newContent };
        onChange(reconstructContent(newSegments));
    }, [segments, onChange]);

    // Update code in a code block
    const updateCodeBlock = useCallback((index: number, newCode: string) => {
        const newSegments = [...segments];
        newSegments[index] = { ...newSegments[index], content: newCode };
        onChange(reconstructContent(newSegments));
    }, [segments, onChange]);

    // Delete a code block
    const deleteCodeBlock = useCallback((index: number) => {
        const newSegments = segments.filter((_, i) => i !== index);
        if (newSegments.length === 0) {
            newSegments.push({ type: 'text', content: '', startIndex: 0, endIndex: 0 });
        }
        onChange(reconstructContent(newSegments));
        // Clear execution result if deleting that block
        if (executionResult?.index === index) {
            setExecutionResult(null);
        }
    }, [segments, onChange, executionResult]);

    // Update language of a code block
    const updateCodeBlockLanguage = useCallback((index: number, newLanguage: string) => {
        const newSegments = [...segments];
        if (newSegments[index]?.type === 'code') {
            newSegments[index] = { ...newSegments[index], language: newLanguage };
            onChange(reconstructContent(newSegments));
        }
    }, [segments, onChange]);

    // Clean piston paths and filenames from error output
    const cleanErrorOutput = (output: string): string => {
        return output
            // Replace full piston paths with "card.ext:line"
            .replace(/\/piston\/jobs\/[a-f0-9-]+\/file0\.code(\.\w+)?/g, 'card$1')
            // Replace standalone file0.code references
            .replace(/file0\.code(\.\w+)?/g, 'card$1');
    };

    // Run code in a code block
    const handleRunCode = useCallback(async (index: number) => {
        const segment = segments[index];
        if (segment?.type !== 'code') return;

        setRunningIndex(index);
        setExecutionResult(null);

        try {
            const result = await executeCode(segment.language || 'javascript', segment.content);
            setExecutionResult({ index, result });
        } catch (error) {
            setExecutionResult({
                index,
                result: {
                    success: false,
                    errorType: 'NETWORK_ERROR',
                    message: error instanceof Error ? error.message : 'Unknown error',
                },
            });
        } finally {
            setRunningIndex(null);
        }
    }, [segments]);

    // Add a new code block after a text segment
    const addCodeBlock = useCallback((afterIndex: number, language: string) => {
        const newSegments = [...segments];
        const newCodeBlock: ContentSegment = {
            type: 'code',
            content: '// your code here',
            language,
            startIndex: 0,
            endIndex: 0,
        };

        // Insert after the specified index
        newSegments.splice(afterIndex + 1, 0, newCodeBlock);

        // Add a text segment after if the next one isn't text
        if (afterIndex + 2 >= newSegments.length || newSegments[afterIndex + 2]?.type !== 'text') {
            newSegments.splice(afterIndex + 2, 0, {
                type: 'text',
                content: '',
                startIndex: 0,
                endIndex: 0,
            });
        }

        onChange(reconstructContent(newSegments));
        setShowLangPicker(false);
    }, [segments, onChange]);

    return (
        <div className="border border-base-300 rounded-lg overflow-hidden bg-base-100 focus-within:border-primary transition-colors">
            {/* Toolbar */}
            <div className="flex items-center justify-end px-3 py-1.5 bg-base-200/50 border-b border-base-300">
                <div className="relative">
                    <button
                        type="button"
                        onClick={() => setShowLangPicker(!showLangPicker)}
                        className={`btn btn-xs gap-1 ${showLangPicker ? 'btn-primary' : 'btn-ghost opacity-60 hover:opacity-100'}`}
                        title="Add Code Block"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="16 18 22 12 16 6"></polyline>
                            <polyline points="8 6 2 12 8 18"></polyline>
                        </svg>
                        <span>Code</span>
                    </button>
                    {showLangPicker && (
                        <div className="absolute top-full right-0 mt-1 z-50 bg-base-100 border border-base-300 rounded-lg shadow-xl p-2 min-w-48">
                            <div className="text-[10px] font-bold uppercase tracking-widest opacity-40 px-2 py-1">Select Language</div>
                            <div className="max-h-48 overflow-y-auto">
                                {POPULAR_LANGUAGES.map((lang) => (
                                    <button
                                        key={lang}
                                        type="button"
                                        onClick={() => addCodeBlock(segments.length - 1, lang)}
                                        className="w-full text-left px-2 py-1.5 text-sm hover:bg-base-200 rounded flex items-center justify-between gap-2"
                                    >
                                        <span>{getDisplayName(lang)}</span>
                                        {isExecutableLanguage(lang) && (
                                            <span className="text-[9px] font-bold uppercase tracking-wider text-green-500 opacity-60">Run</span>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Content area */}
            <div>
                {segments.map((segment, index) => (
                    <div key={`${segment.type}-${index}`}>
                        {segment.type === 'text' ? (
                            shouldShowTextarea(segment, index) ? (
                                <textarea
                                    className="w-full resize-none font-mono text-sm p-3 bg-transparent focus:outline-none"
                                    placeholder={index === 0 ? placeholder : undefined}
                                    value={segment.content}
                                    onChange={(e) => updateSegment(index, e.target.value)}
                                    onBlur={(e) => handleTextareaBlur(index, e.target.value)}
                                    rows={Math.max(1, segment.content.split('\n').length || 1)}
                                    autoFocus={activeInsertionPoints.has(index)}
                                />
                            ) : (
                                <InsertionPoint
                                    onActivate={() => activateInsertionPoint(index)}
                                />
                            )
                        ) : (
                            <div className="px-3">
                                <div className="relative group bg-[#0d1117] rounded-lg overflow-hidden">
                                    {/* Delete button */}
                                    <button
                                        type="button"
                                        onClick={() => deleteCodeBlock(index)}
                                        className="absolute top-3 right-3 z-10 w-6 h-6 flex items-center justify-center rounded bg-white/5 text-white/40 hover:text-white hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-all"
                                        title="Remove code block"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <polyline points="3 6 5 6 21 6"></polyline>
                                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                        </svg>
                                    </button>
                                    {/* Inline code editor */}
                                    <InlineCodeEditor
                                        code={segment.content}
                                        language={segment.language || 'plaintext'}
                                        onChange={(newCode) => updateCodeBlock(index, newCode)}
                                        onLanguageChange={(newLang) => updateCodeBlockLanguage(index, newLang)}
                                        canRun={isExecutableLanguage(segment.language || '')}
                                        onRun={() => handleRunCode(index)}
                                        isRunning={runningIndex === index}
                                    />
                                    {/* Execution output */}
                                    {executionResult?.index === index && (
                                        <ExecutionOutput result={executionResult.result} cleanOutput={cleanErrorOutput} />
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
