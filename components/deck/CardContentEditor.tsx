'use client';

import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { getDisplayName, isExecutableLanguage, getMonacoLanguage } from '@/lib/code/languages';
import { executeCode, type ExecutionResult, type ExecutionError } from '@/lib/code/executor';
import type { OnMount, BeforeMount } from '@monaco-editor/react';
import type { editor } from 'monaco-editor';

// Lazy load Monaco editor
const Editor = dynamic(() => import('@monaco-editor/react'), {
    ssr: false,
    loading: () => (
        <div className="flex items-center justify-center h-24 bg-[#0d1117]">
            <div className="flex items-center gap-2 text-white/40 text-sm">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Loading...
            </div>
        </div>
    ),
});

// Theme for inline editor
const inlineEditorTheme = {
    base: 'vs-dark' as const,
    inherit: true,
    rules: [
        { token: 'comment', foreground: '8b949e', fontStyle: 'italic' },
        { token: 'keyword', foreground: 'ff7b72' },
        { token: 'string', foreground: 'a5d6ff' },
        { token: 'number', foreground: '79c0ff' },
        { token: 'type', foreground: 'ffa657' },
        { token: 'function', foreground: 'd2a8ff' },
    ],
    colors: {
        'editor.background': '#0d1117',
        'editor.foreground': '#c9d1d9',
        'editor.lineHighlightBackground': '#161b2200',
        'editor.selectionBackground': '#264f78',
        'editorCursor.foreground': '#c9d1d9',
        'editorLineNumber.foreground': '#6e7681',
    },
};

interface InlineCodeEditorProps {
    code: string;
    language: string;
    onChange: (code: string) => void;
    onLanguageChange?: (language: string) => void;
    onRun?: () => void;
    canRun?: boolean;
    isRunning?: boolean;
}

function InlineCodeEditor({ code, language, onChange, onLanguageChange, onRun, canRun, isRunning }: InlineCodeEditorProps) {
    const [showLangDropdown, setShowLangDropdown] = useState(false);
    const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
    const formatTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const monacoLanguage = getMonacoLanguage(language);

    // Calculate height based on content
    const lineCount = Math.max(3, code.split('\n').length);
    const height = Math.min(300, lineCount * 19 + 24);

    const handleBeforeMount: BeforeMount = (monaco) => {
        monaco.editor.defineTheme('inline-dark', inlineEditorTheme);
    };

    const formatDocument = useCallback(async () => {
        const editor = editorRef.current;
        if (!editor) return;
        try {
            const formatAction = editor.getAction('editor.action.formatDocument');
            if (formatAction) await formatAction.run();
        } catch {}
    }, []);

    const scheduleFormat = useCallback(() => {
        if (formatTimeoutRef.current) clearTimeout(formatTimeoutRef.current);
        formatTimeoutRef.current = setTimeout(formatDocument, 1000);
    }, [formatDocument]);

    useEffect(() => {
        return () => {
            if (formatTimeoutRef.current) clearTimeout(formatTimeoutRef.current);
        };
    }, []);

    const handleMount: OnMount = (editor) => {
        editorRef.current = editor;
    };

    const handleChange = useCallback((value: string | undefined) => {
        onChange(value || '');
        scheduleFormat();
    }, [onChange, scheduleFormat]);

    return (
        <div className="relative p-3">
            {/* Header with language selector and run button */}
            <div className="flex items-center justify-between mb-2 pr-8">
                {/* Language selector */}
                <div className="relative">
                    <button
                        type="button"
                        onClick={() => setShowLangDropdown(!showLangDropdown)}
                        className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-white/40 hover:text-white/70 transition-colors"
                    >
                        {getDisplayName(language)}
                        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="6 9 12 15 18 9" />
                        </svg>
                    </button>
                    {showLangDropdown && onLanguageChange && (
                        <div className="absolute top-full left-0 mt-1 z-50 bg-[#1c2128] border border-white/10 rounded-lg shadow-xl p-1 min-w-36 max-h-48 overflow-y-auto">
                            {POPULAR_LANGUAGES.map((lang) => (
                                <button
                                    key={lang}
                                    type="button"
                                    onClick={() => {
                                        onLanguageChange(lang);
                                        setShowLangDropdown(false);
                                    }}
                                    className={`w-full text-left px-2 py-1 text-xs rounded flex items-center justify-between gap-2 ${
                                        lang === language ? 'bg-white/10 text-white' : 'text-white/60 hover:bg-white/5 hover:text-white'
                                    }`}
                                >
                                    <span>{getDisplayName(lang)}</span>
                                    {isExecutableLanguage(lang) && (
                                        <span className="text-[8px] font-bold uppercase text-green-500/60">Run</span>
                                    )}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
                {/* Run button */}
                {canRun && onRun && (
                    <button
                        type="button"
                        onClick={onRun}
                        disabled={isRunning}
                        className={`h-6 flex items-center gap-1 px-2 text-[10px] font-medium text-green-400/80 hover:text-green-400 hover:bg-white/5 rounded transition-all ${isRunning ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                    >
                        {isRunning ? (
                            <>
                                <svg className="w-3 h-3 animate-spin" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                </svg>
                                Running
                            </>
                        ) : (
                            <>
                                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                                    <polygon points="5 3 19 12 5 21 5 3" />
                                </svg>
                                Run
                            </>
                        )}
                    </button>
                )}
            </div>
            <div>
                <Editor
                    height={`${height}px`}
                    language={monacoLanguage}
                    value={code}
                    theme="inline-dark"
                    beforeMount={handleBeforeMount}
                    onMount={handleMount}
                    onChange={handleChange}
                    options={{
                        minimap: { enabled: false },
                        fontSize: 13,
                        lineNumbers: 'off',
                        scrollBeyondLastLine: false,
                        automaticLayout: true,
                        tabSize: 2,
                        formatOnPaste: true,
                        formatOnType: true,
                        padding: { top: 0, bottom: 0 },
                        scrollbar: {
                            vertical: 'hidden',
                            horizontal: 'auto',
                            verticalScrollbarSize: 0,
                            horizontalScrollbarSize: 6,
                        },
                        folding: false,
                        glyphMargin: false,
                        lineDecorationsWidth: 12,
                        lineNumbersMinChars: 0,
                        renderLineHighlight: 'none',
                        overviewRulerLanes: 0,
                        hideCursorInOverviewRuler: true,
                        overviewRulerBorder: false,
                    }}
                />
            </div>
        </div>
    );
}

// Execution output display component
interface ExecutionOutputProps {
    result: ExecutionResult | ExecutionError;
    cleanOutput: (output: string) => string;
}

function ExecutionOutput({ result, cleanOutput }: ExecutionOutputProps) {
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

interface CardContentEditorProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    side: 'front' | 'back';
}

interface ContentSegment {
    type: 'text' | 'code';
    content: string;
    language?: string;
    startIndex: number;
    endIndex: number;
}

// Popular languages for the dropdown
const POPULAR_LANGUAGES = [
    'javascript',
    'typescript',
    'python',
    'rust',
    'go',
    'java',
    'c',
    'cpp',
    'sql',
    'bash',
    'html',
    'css',
    'json',
];

// Parse markdown content into segments of text and code blocks
function parseContent(content: string): ContentSegment[] {
    const segments: ContentSegment[] = [];
    const codeBlockRegex = /```(\w*)\n([\s\S]*?)```/g;

    let lastIndex = 0;
    let match;

    while ((match = codeBlockRegex.exec(content)) !== null) {
        // Always add text before this code block (even if empty)
        const textContent = content.slice(lastIndex, match.index);
        segments.push({
            type: 'text',
            content: textContent,
            startIndex: lastIndex,
            endIndex: match.index,
        });

        // Add the code block
        segments.push({
            type: 'code',
            content: match[2],
            language: match[1] || 'plaintext',
            startIndex: match.index,
            endIndex: match.index + match[0].length,
        });

        lastIndex = match.index + match[0].length;
    }

    // Always add text after last code block (even if empty)
    segments.push({
        type: 'text',
        content: content.slice(lastIndex),
        startIndex: lastIndex,
        endIndex: content.length,
    });

    // If no segments (empty content), add empty text segment
    if (segments.length === 0) {
        segments.push({
            type: 'text',
            content: '',
            startIndex: 0,
            endIndex: 0,
        });
    }

    return segments;
}

// Reconstruct markdown from segments
function reconstructContent(segments: ContentSegment[]): string {
    return segments.map(seg => {
        if (seg.type === 'code') {
            return `\`\`\`${seg.language || ''}\n${seg.content}\`\`\``;
        }
        return seg.content;
    }).join('');
}

export function CardContentEditor({ value, onChange, placeholder, side }: CardContentEditorProps) {
    const [showLangPicker, setShowLangPicker] = useState(false);
    const [activeTextIndex, setActiveTextIndex] = useState(0);
    const [runningIndex, setRunningIndex] = useState<number | null>(null);
    const [executionResult, setExecutionResult] = useState<{ index: number; result: ExecutionResult | ExecutionError } | null>(null);

    const segments = useMemo(() => parseContent(value), [value]);

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
                content: '\n',
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
                            <textarea
                                className="w-full resize-none font-mono text-sm p-3 bg-transparent focus:outline-none"
                                placeholder={index === 0 ? placeholder : undefined}
                                value={segment.content}
                                onChange={(e) => updateSegment(index, e.target.value)}
                                onFocus={() => setActiveTextIndex(index)}
                                rows={Math.max(1, segment.content.split('\n').length || 1)}
                            />
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
