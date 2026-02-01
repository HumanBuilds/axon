'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { getDisplayName, getMonacoLanguage } from '@/lib/code/languages';
import { LanguageSelectDropdown } from '@/components/ui/LanguageSelectDropdown';
import { axonDarkTheme } from '@/lib/code/monaco-theme';
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

export interface InlineCodeEditorProps {
    code: string;
    language: string;
    onChange: (code: string) => void;
    onLanguageChange?: (language: string) => void;
    onRun?: () => void;
    canRun?: boolean;
    isRunning?: boolean;
}

export function InlineCodeEditor({ code, language, onChange, onLanguageChange, onRun, canRun, isRunning }: InlineCodeEditorProps) {
    const [showLangDropdown, setShowLangDropdown] = useState(false);
    const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
    const langButtonRef = useRef<HTMLButtonElement>(null);
    const formatTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const monacoLanguage = getMonacoLanguage(language);

    // Calculate height based on content
    const lineCount = Math.max(3, code.split('\n').length);
    const height = Math.min(300, lineCount * 19 + 24);

    const handleBeforeMount: BeforeMount = (monaco) => {
        monaco.editor.defineTheme('inline-dark', axonDarkTheme);
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
                        ref={langButtonRef}
                        type="button"
                        onClick={() => setShowLangDropdown(!showLangDropdown)}
                        className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-white/40 hover:text-white/70 transition-colors"
                    >
                        {getDisplayName(language)}
                        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="6 9 12 15 18 9" />
                        </svg>
                    </button>
                    {onLanguageChange && (
                        <LanguageSelectDropdown
                            triggerRef={langButtonRef}
                            isOpen={showLangDropdown}
                            onClose={() => setShowLangDropdown(false)}
                            onSelect={onLanguageChange}
                            currentLanguage={language}
                            variant="dark"
                        />
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
