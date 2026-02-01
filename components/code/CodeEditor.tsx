'use client';

import { useRef, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { getMonacoLanguage, getDisplayName } from '@/lib/code/languages';
import { axonDarkTheme } from '@/lib/code/monaco-theme';
import type { OnMount, BeforeMount } from '@monaco-editor/react';
import type { editor } from 'monaco-editor';

// Lazy load Monaco editor
const Editor = dynamic(() => import('@monaco-editor/react'), {
    ssr: false,
    loading: () => (
        <div className="flex items-center justify-center h-32 bg-[#0d1117]">
            <div className="flex items-center gap-2 text-white/60">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
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
                <span className="text-sm">Loading editor...</span>
            </div>
        </div>
    ),
});

interface CodeEditorProps {
    code: string;
    language: string;
    onChange: (code: string) => void;
    onSave: () => void;
    onCancel: () => void;
    compact?: boolean;
}

const FORMAT_DEBOUNCE_MS = 1000;

export function CodeEditor({
    code,
    language,
    onChange,
    onSave,
    onCancel,
    compact = false,
}: CodeEditorProps) {
    const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
    const formatTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const monacoLanguage = getMonacoLanguage(language);

    const handleBeforeMount: BeforeMount = (monaco) => {
        monaco.editor.defineTheme('axon-dark', axonDarkTheme);
    };

    // Format the document
    const formatDocument = useCallback(async () => {
        const editor = editorRef.current;
        if (!editor) return;

        try {
            const formatAction = editor.getAction('editor.action.formatDocument');
            if (formatAction) {
                await formatAction.run();
            }
        } catch (err) {
            // Formatting not available for this language
            console.debug('Format not available:', err);
        }
    }, []);

    // Debounced format - formats after user stops typing
    const scheduleFormat = useCallback(() => {
        if (formatTimeoutRef.current) {
            clearTimeout(formatTimeoutRef.current);
        }
        formatTimeoutRef.current = setTimeout(() => {
            formatDocument();
        }, FORMAT_DEBOUNCE_MS);
    }, [formatDocument]);

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (formatTimeoutRef.current) {
                clearTimeout(formatTimeoutRef.current);
            }
        };
    }, []);

    // Format and save
    const formatAndSave = useCallback(async () => {
        // Clear any pending format
        if (formatTimeoutRef.current) {
            clearTimeout(formatTimeoutRef.current);
        }

        await formatDocument();
        onSave();
    }, [formatDocument, onSave]);

    const handleEditorMount: OnMount = (editor, monaco) => {
        editorRef.current = editor;

        // Focus the editor
        editor.focus();

        // Add keyboard shortcuts
        editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
            formatAndSave();
        });

        editor.addCommand(monaco.KeyCode.Escape, () => {
            onCancel();
        });
    };

    const handleChange = useCallback((value: string | undefined) => {
        onChange(value || '');
        scheduleFormat();
    }, [onChange, scheduleFormat]);

    const editorHeight = compact ? '120px' : '200px';

    return (
        <div className="flex flex-col">
            {/* Header bar */}
            <div className="flex items-center justify-between px-3 py-1.5 bg-[#161b22] border-b border-white/10">
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-white/60">
                        {getDisplayName(language)}
                    </span>
                </div>
                <div className="flex items-center gap-1">
                    <span className="text-[9px] text-white/30 hidden sm:inline">
                        Cmd+S save | Esc cancel
                    </span>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onCancel();
                        }}
                        className="p-1 rounded hover:bg-white/10 transition-colors"
                        title="Cancel (Esc)"
                    >
                        <svg
                            className="w-3.5 h-3.5 text-white/60"
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
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            formatAndSave();
                        }}
                        className="p-1 rounded hover:bg-white/10 transition-colors"
                        title="Save (Cmd+S)"
                    >
                        <svg
                            className="w-3.5 h-3.5 text-green-400"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <polyline points="20 6 9 17 4 12" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Editor */}
            <div onClick={(e) => e.stopPropagation()}>
                <Editor
                    height={editorHeight}
                    language={monacoLanguage}
                    value={code}
                    theme="axon-dark"
                    beforeMount={handleBeforeMount}
                    onMount={handleEditorMount}
                    onChange={handleChange}
                    options={{
                        minimap: { enabled: false },
                        fontSize: 13,
                        lineNumbers: 'on',
                        scrollBeyondLastLine: false,
                        automaticLayout: true,
                        tabSize: 2,
                        formatOnPaste: true,
                        formatOnType: true,
                        padding: { top: 12, bottom: 12 },
                        scrollbar: {
                            vertical: 'auto',
                            horizontal: 'auto',
                            verticalScrollbarSize: 6,
                            horizontalScrollbarSize: 6,
                        },
                        lineNumbersMinChars: 3,
                        folding: false,
                        glyphMargin: false,
                    }}
                />
            </div>
        </div>
    );
}
