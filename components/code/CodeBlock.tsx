'use client';

import { useState, useCallback } from 'react';
import { CodeViewer } from './CodeViewer';
import { CodeEditor } from './CodeEditor';
import { CodeTerminal } from './CodeTerminal';
import { executeCode, type ExecutionResult, type ExecutionError } from '@/lib/code/executor';

type CodeBlockState = 'viewing' | 'editing' | 'running';

interface CodeBlockProps {
    code: string;
    language: string;
    readOnly?: boolean;
    defaultEditing?: boolean;
    compact?: boolean;
    onCodeChange?: (code: string) => void;
}

export function CodeBlock({
    code: initialCode,
    language,
    readOnly = false,
    defaultEditing = false,
    compact = false,
    onCodeChange,
}: CodeBlockProps) {
    const [state, setState] = useState<CodeBlockState>(defaultEditing && !readOnly ? 'editing' : 'viewing');
    const [code, setCode] = useState(initialCode);
    const [editCode, setEditCode] = useState(initialCode);
    const [executionResult, setExecutionResult] = useState<ExecutionResult | ExecutionError | null>(null);
    const [isExecuting, setIsExecuting] = useState(false);

    const handleEdit = useCallback(() => {
        setEditCode(code);
        setState('editing');
    }, [code]);

    const handleSave = useCallback(() => {
        setCode(editCode);
        onCodeChange?.(editCode);
        setState('viewing');
    }, [editCode, onCodeChange]);

    const handleCancel = useCallback(() => {
        setEditCode(code);
        setState('viewing');
    }, [code]);

    const handleRun = useCallback(async () => {
        setState('running');
        setIsExecuting(true);
        setExecutionResult(null);

        try {
            const result = await executeCode(language, code);
            setExecutionResult(result);
        } catch (error) {
            setExecutionResult({
                success: false,
                errorType: 'NETWORK_ERROR',
                message: error instanceof Error ? error.message : 'An unknown error occurred',
            });
        } finally {
            setIsExecuting(false);
        }
    }, [language, code]);

    const handleCloseTerminal = useCallback(() => {
        setState('viewing');
        setExecutionResult(null);
    }, []);

    return (
        <div data-code-block className={`rounded-xl overflow-hidden border border-base-300 shadow-xl bg-[#0d1117] ${compact ? 'my-2' : 'my-6'}`}>
            {state === 'editing' ? (
                <CodeEditor
                    code={editCode}
                    language={language}
                    onChange={setEditCode}
                    onSave={handleSave}
                    onCancel={handleCancel}
                    compact={compact}
                />
            ) : (
                <CodeViewer
                    code={code}
                    language={language}
                    canEdit={!readOnly}
                    onEdit={handleEdit}
                    onRun={handleRun}
                />
            )}

            {(state === 'running' || executionResult) && (
                <CodeTerminal
                    result={executionResult}
                    isLoading={isExecuting}
                    onClose={handleCloseTerminal}
                />
            )}
        </div>
    );
}
