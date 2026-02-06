import { useState, useMemo, useCallback, useRef } from 'react';
import { executeCode, type ExecutionResult, type ExecutionError } from '@/lib/code/executor';
import { parseContent, reconstructContent, isEmptyContent, type ContentSegment } from '@/lib/code/markdown-utils';

interface UseCardContentEditorProps {
    value: string;
    onChange: (value: string) => void;
}

export function useCardContentEditor({ value, onChange }: UseCardContentEditorProps) {
    const [showLangPicker, setShowLangPicker] = useState(false);
    const codeButtonRef = useRef<HTMLButtonElement>(null);
    const [runningIndex, setRunningIndex] = useState<number | null>(null);
    const [executionResult, setExecutionResult] = useState<{ index: number; result: ExecutionResult | ExecutionError } | null>(null);
    const [activeInsertionPoints, setActiveInsertionPoints] = useState<Set<number>>(new Set());
    const [editingIndex, setEditingIndex] = useState<number | null>(null);

    const segments = useMemo(() => parseContent(value), [value]);

    const activateInsertionPoint = useCallback((index: number) => {
        setActiveInsertionPoints(prev => new Set(prev).add(index));
        setEditingIndex(index);
    }, []);

    const handleTextareaBlur = useCallback((index: number, content: string) => {
        if (isEmptyContent(content)) {
            setActiveInsertionPoints(prev => {
                const next = new Set(prev);
                next.delete(index);
                return next;
            });
        }
    }, []);

    const shouldShowTextarea = useCallback((segment: ContentSegment, index: number): boolean => {
        const hasCodeBlocks = segments.some(s => s.type === 'code');
        if (index === 0 && !hasCodeBlocks) {
            return true;
        }
        return !isEmptyContent(segment.content) || activeInsertionPoints.has(index);
    }, [activeInsertionPoints, segments]);

    const updateSegment = useCallback((index: number, newContent: string) => {
        const newSegments = [...segments];
        newSegments[index] = { ...newSegments[index], content: newContent };
        onChange(reconstructContent(newSegments));
    }, [segments, onChange]);

    const updateCodeBlock = useCallback((index: number, newCode: string) => {
        const newSegments = [...segments];
        newSegments[index] = { ...newSegments[index], content: newCode };
        onChange(reconstructContent(newSegments));
    }, [segments, onChange]);

    const deleteCodeBlock = useCallback((index: number) => {
        const newSegments = segments.filter((_, i) => i !== index);
        if (newSegments.length === 0) {
            newSegments.push({ type: 'text', content: '', startIndex: 0, endIndex: 0 });
        }
        onChange(reconstructContent(newSegments));
        if (executionResult?.index === index) {
            setExecutionResult(null);
        }
    }, [segments, onChange, executionResult]);

    const updateCodeBlockLanguage = useCallback((index: number, newLanguage: string) => {
        const newSegments = [...segments];
        if (newSegments[index]?.type === 'code') {
            newSegments[index] = { ...newSegments[index], language: newLanguage };
            onChange(reconstructContent(newSegments));
        }
    }, [segments, onChange]);

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

    const addCodeBlock = useCallback((afterIndex: number, language: string) => {
        const newSegments = [...segments];
        const newCodeBlock: ContentSegment = {
            type: 'code',
            content: '// your code here',
            language,
            startIndex: 0,
            endIndex: 0,
        };

        newSegments.splice(afterIndex + 1, 0, newCodeBlock);

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

    return {
        segments,
        showLangPicker, setShowLangPicker, codeButtonRef,
        runningIndex, executionResult,
        editingIndex, setEditingIndex,
        updateSegment, updateCodeBlock, deleteCodeBlock,
        updateCodeBlockLanguage, addCodeBlock,
        activateInsertionPoint, handleTextareaBlur, shouldShowTextarea,
        handleRunCode,
    };
}
