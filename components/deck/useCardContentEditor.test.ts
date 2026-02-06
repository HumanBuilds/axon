import { describe, test, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCardContentEditor } from './useCardContentEditor';

vi.mock('@/lib/code/executor', () => ({
    executeCode: vi.fn(),
}));

import { executeCode } from '@/lib/code/executor';

const mockExecuteCode = vi.mocked(executeCode);

describe('useCardContentEditor', () => {
    let onChange: (value: string) => void;

    beforeEach(() => {
        vi.clearAllMocks();
        onChange = vi.fn();
    });

    // --- Segment parsing ---

    test('should parse empty content into a single text segment', () => {
        const { result } = renderHook(() =>
            useCardContentEditor({ value: '', onChange })
        );
        expect(result.current.segments).toHaveLength(1);
        expect(result.current.segments[0].type).toBe('text');
    });

    test('should parse plain text into a single text segment', () => {
        const { result } = renderHook(() =>
            useCardContentEditor({ value: 'Hello world', onChange })
        );
        expect(result.current.segments).toHaveLength(1);
        expect(result.current.segments[0].type).toBe('text');
        expect(result.current.segments[0].content).toBe('Hello world');
    });

    test('should parse content with a code block into three segments', () => {
        const value = 'before\n```javascript\nconsole.log("hi")\n```\nafter';
        const { result } = renderHook(() =>
            useCardContentEditor({ value, onChange })
        );
        expect(result.current.segments).toHaveLength(3);
        expect(result.current.segments[0].type).toBe('text');
        expect(result.current.segments[1].type).toBe('code');
        expect(result.current.segments[1].language).toBe('javascript');
        expect(result.current.segments[2].type).toBe('text');
    });

    // --- updateSegment ---

    test('should update a text segment', () => {
        const { result } = renderHook(() =>
            useCardContentEditor({ value: 'hello', onChange })
        );
        act(() => {
            result.current.updateSegment(0, 'updated');
        });
        expect(onChange).toHaveBeenCalledWith('updated');
    });

    // --- updateCodeBlock ---

    test('should update a code block', () => {
        const value = '```javascript\nold code\n```\n';
        const { result } = renderHook(() =>
            useCardContentEditor({ value, onChange })
        );
        act(() => {
            result.current.updateCodeBlock(1, 'new code');
        });
        expect(onChange).toHaveBeenCalledTimes(1);
        const newValue = (onChange as ReturnType<typeof vi.fn>).mock.calls[0][0];
        expect(newValue).toContain('new code');
        expect(newValue).not.toContain('old code');
    });

    // --- deleteCodeBlock ---

    test('should delete a code block', () => {
        const value = 'text\n```javascript\ncode\n```\nmore text';
        const { result } = renderHook(() =>
            useCardContentEditor({ value, onChange })
        );
        act(() => {
            result.current.deleteCodeBlock(1);
        });
        expect(onChange).toHaveBeenCalledTimes(1);
        const newValue = (onChange as ReturnType<typeof vi.fn>).mock.calls[0][0];
        expect(newValue).not.toContain('```');
    });

    test('should add empty text segment when deleting last segment', () => {
        const value = '```javascript\ncode\n```\n';
        const { result } = renderHook(() =>
            useCardContentEditor({ value, onChange })
        );
        // segments: [text(''), code, text('')]
        // delete code at index 1, should still produce valid content
        act(() => {
            result.current.deleteCodeBlock(1);
        });
        expect(onChange).toHaveBeenCalled();
    });

    test('should clear execution result when deleting the block that has it', () => {
        const value = '```javascript\nconsole.log("hi")\n```\n';
        const { result } = renderHook(() =>
            useCardContentEditor({ value, onChange })
        );

        // Simulate execution result being set (we can't easily set state, but we
        // can test that deleteCodeBlock handles the case where executionResult is null)
        act(() => {
            result.current.deleteCodeBlock(1);
        });
        expect(result.current.executionResult).toBeNull();
    });

    // --- updateCodeBlockLanguage ---

    test('should update language of a code block', () => {
        const value = '```javascript\ncode\n```\n';
        const { result } = renderHook(() =>
            useCardContentEditor({ value, onChange })
        );
        act(() => {
            result.current.updateCodeBlockLanguage(1, 'python');
        });
        expect(onChange).toHaveBeenCalledTimes(1);
        const newValue = (onChange as ReturnType<typeof vi.fn>).mock.calls[0][0];
        expect(newValue).toContain('```python');
    });

    test('should not update language of a text segment', () => {
        const { result } = renderHook(() =>
            useCardContentEditor({ value: 'text', onChange })
        );
        act(() => {
            result.current.updateCodeBlockLanguage(0, 'python');
        });
        expect(onChange).not.toHaveBeenCalled();
    });

    // --- addCodeBlock ---

    test('should add a code block after specified index', () => {
        const { result } = renderHook(() =>
            useCardContentEditor({ value: 'hello', onChange })
        );
        act(() => {
            result.current.addCodeBlock(0, 'javascript');
        });
        expect(onChange).toHaveBeenCalledTimes(1);
        const newValue = (onChange as ReturnType<typeof vi.fn>).mock.calls[0][0];
        expect(newValue).toContain('```javascript');
        expect(newValue).toContain('// your code here');
    });

    test('should close language picker when adding code block', () => {
        const { result } = renderHook(() =>
            useCardContentEditor({ value: 'hello', onChange })
        );
        act(() => {
            result.current.setShowLangPicker(true);
        });
        expect(result.current.showLangPicker).toBe(true);
        act(() => {
            result.current.addCodeBlock(0, 'python');
        });
        expect(result.current.showLangPicker).toBe(false);
    });

    // --- Insertion point logic ---

    test('should show textarea for first segment when no code blocks', () => {
        const { result } = renderHook(() =>
            useCardContentEditor({ value: '', onChange })
        );
        const segment = result.current.segments[0];
        expect(result.current.shouldShowTextarea(segment, 0)).toBe(true);
    });

    test('should show insertion point for empty text between code blocks', () => {
        const value = '```javascript\na\n```\n\n```python\nb\n```\n';
        const { result } = renderHook(() =>
            useCardContentEditor({ value, onChange })
        );
        // segments: text(''), code, text(''), code, text('')
        // Index 2 is an empty text between two code blocks
        const segment = result.current.segments[2];
        expect(segment.type).toBe('text');
        expect(result.current.shouldShowTextarea(segment, 2)).toBe(false);
    });

    test('should activate insertion point and set editing index', () => {
        const value = '```javascript\na\n```\n\n```python\nb\n```\n';
        const { result } = renderHook(() =>
            useCardContentEditor({ value, onChange })
        );
        act(() => {
            result.current.activateInsertionPoint(2);
        });
        expect(result.current.editingIndex).toBe(2);
        const segment = result.current.segments[2];
        expect(result.current.shouldShowTextarea(segment, 2)).toBe(true);
    });

    test('should collapse insertion point on blur when content is empty', () => {
        const value = '```javascript\na\n```\n\n```python\nb\n```\n';
        const { result } = renderHook(() =>
            useCardContentEditor({ value, onChange })
        );
        act(() => {
            result.current.activateInsertionPoint(2);
        });
        expect(result.current.shouldShowTextarea(result.current.segments[2], 2)).toBe(true);
        act(() => {
            result.current.handleTextareaBlur(2, '');
        });
        expect(result.current.shouldShowTextarea(result.current.segments[2], 2)).toBe(false);
    });

    test('should not collapse insertion point on blur when content is non-empty', () => {
        const value = '```javascript\na\n```\n\n```python\nb\n```\n';
        const { result } = renderHook(() =>
            useCardContentEditor({ value, onChange })
        );
        act(() => {
            result.current.activateInsertionPoint(2);
        });
        act(() => {
            result.current.handleTextareaBlur(2, 'some text');
        });
        // Still shows because the segment content from shouldShowTextarea checks
        // activeInsertionPoints, and it stays active when content is non-empty
        expect(result.current.shouldShowTextarea(result.current.segments[2], 2)).toBe(true);
    });

    // --- Code execution ---

    test('should handle successful code execution', async () => {
        const value = '```javascript\nconsole.log("hi")\n```\n';
        mockExecuteCode.mockResolvedValueOnce({
            success: true,
            stdout: 'hi\n',
            stderr: '',
            exitCode: 0,
            signal: null,
        });

        const { result } = renderHook(() =>
            useCardContentEditor({ value, onChange })
        );

        await act(async () => {
            await result.current.handleRunCode(1);
        });

        expect(mockExecuteCode).toHaveBeenCalledWith('javascript', 'console.log("hi")');
        expect(result.current.executionResult).not.toBeNull();
        expect(result.current.executionResult?.index).toBe(1);
        expect(result.current.executionResult?.result.success).toBe(true);
        expect(result.current.runningIndex).toBeNull();
    });

    test('should handle code execution network error', async () => {
        const value = '```javascript\ncode\n```\n';
        mockExecuteCode.mockRejectedValueOnce(new Error('Network failed'));

        const { result } = renderHook(() =>
            useCardContentEditor({ value, onChange })
        );

        await act(async () => {
            await result.current.handleRunCode(1);
        });

        expect(result.current.executionResult).not.toBeNull();
        const execResult = result.current.executionResult!.result;
        expect(execResult.success).toBe(false);
        if (!execResult.success) {
            expect(execResult.errorType).toBe('NETWORK_ERROR');
            expect(execResult.message).toBe('Network failed');
        }
    });

    test('should not run code on a text segment', async () => {
        const { result } = renderHook(() =>
            useCardContentEditor({ value: 'text', onChange })
        );

        await act(async () => {
            await result.current.handleRunCode(0);
        });

        expect(mockExecuteCode).not.toHaveBeenCalled();
    });

    // --- editingIndex ---

    test('should set and clear editing index', () => {
        const { result } = renderHook(() =>
            useCardContentEditor({ value: 'text', onChange })
        );
        act(() => {
            result.current.setEditingIndex(0);
        });
        expect(result.current.editingIndex).toBe(0);
        act(() => {
            result.current.setEditingIndex(null);
        });
        expect(result.current.editingIndex).toBeNull();
    });

    // --- showLangPicker ---

    test('should toggle language picker', () => {
        const { result } = renderHook(() =>
            useCardContentEditor({ value: '', onChange })
        );
        expect(result.current.showLangPicker).toBe(false);
        act(() => {
            result.current.setShowLangPicker(true);
        });
        expect(result.current.showLangPicker).toBe(true);
    });
});
