import { describe, test, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TextSegment, type TextSegmentProps } from './TextSegment';

// Mock Markdown component to avoid complex rendering
vi.mock('@/components/ui/Markdown', () => ({
    Markdown: ({ children }: { children: string }) => <div data-testid="markdown">{children}</div>,
}));

function makeProps(overrides: Partial<TextSegmentProps> = {}): TextSegmentProps {
    return {
        segment: { type: 'text', content: '', startIndex: 0, endIndex: 0 },
        index: 0,
        editingIndex: null,
        setEditingIndex: vi.fn(),
        shouldShowTextarea: vi.fn(() => true),
        updateSegment: vi.fn(),
        activateInsertionPoint: vi.fn(),
        handleTextareaBlur: vi.fn(),
        ...overrides,
    };
}

describe('TextSegment', () => {
    // --- Insertion Point State ---

    test('should render insertion point when shouldShowTextarea returns false', () => {
        const activateInsertionPoint = vi.fn();
        const { container } = render(
            <TextSegment
                {...makeProps({
                    shouldShowTextarea: () => false,
                    activateInsertionPoint,
                })}
            />
        );
        const button = container.querySelector('button');
        expect(button).toBeTruthy();
        fireEvent.click(button!);
        expect(activateInsertionPoint).toHaveBeenCalledWith(0);
    });

    // --- Textarea State ---

    test('should render textarea when empty content and shouldShowTextarea is true', () => {
        render(
            <TextSegment
                {...makeProps({
                    segment: { type: 'text', content: '', startIndex: 0, endIndex: 0 },
                })}
            />
        );
        expect(screen.getByRole('textbox')).toBeTruthy();
    });

    test('should render textarea when editingIndex matches', () => {
        render(
            <TextSegment
                {...makeProps({
                    segment: { type: 'text', content: 'some text', startIndex: 0, endIndex: 9 },
                    index: 2,
                    editingIndex: 2,
                })}
            />
        );
        expect(screen.getByRole('textbox')).toBeTruthy();
    });

    test('should call updateSegment on textarea change', () => {
        const updateSegment = vi.fn();
        render(
            <TextSegment
                {...makeProps({
                    updateSegment,
                })}
            />
        );
        fireEvent.change(screen.getByRole('textbox'), { target: { value: 'new text' } });
        expect(updateSegment).toHaveBeenCalledWith(0, 'new text');
    });

    test('should call setEditingIndex on textarea focus', () => {
        const setEditingIndex = vi.fn();
        render(
            <TextSegment
                {...makeProps({
                    setEditingIndex,
                })}
            />
        );
        fireEvent.focus(screen.getByRole('textbox'));
        expect(setEditingIndex).toHaveBeenCalledWith(0);
    });

    test('should call handleTextareaBlur and clear editingIndex on blur', () => {
        const handleTextareaBlur = vi.fn();
        const setEditingIndex = vi.fn();
        render(
            <TextSegment
                {...makeProps({
                    handleTextareaBlur,
                    setEditingIndex,
                })}
            />
        );
        fireEvent.blur(screen.getByRole('textbox'));
        expect(handleTextareaBlur).toHaveBeenCalledWith(0, '');
        expect(setEditingIndex).toHaveBeenCalledWith(null);
    });

    test('should show placeholder only for first segment', () => {
        render(
            <TextSegment
                {...makeProps({
                    placeholder: 'Type here...',
                    index: 0,
                })}
            />
        );
        expect(screen.getByPlaceholderText('Type here...')).toBeTruthy();
    });

    test('should not show placeholder for non-first segments', () => {
        render(
            <TextSegment
                {...makeProps({
                    placeholder: 'Type here...',
                    index: 2,
                })}
            />
        );
        const textarea = screen.getByRole('textbox');
        expect(textarea.getAttribute('placeholder')).toBeNull();
    });

    // --- Markdown Preview State ---

    test('should render markdown preview when content is non-empty and not editing', () => {
        const setEditingIndex = vi.fn();
        render(
            <TextSegment
                {...makeProps({
                    segment: { type: 'text', content: '**bold text**', startIndex: 0, endIndex: 13 },
                    editingIndex: null,
                    setEditingIndex,
                })}
            />
        );
        expect(screen.getByTestId('markdown')).toBeTruthy();
        expect(screen.getByText('**bold text**')).toBeTruthy();
        fireEvent.click(screen.getByTestId('markdown').parentElement!);
        expect(setEditingIndex).toHaveBeenCalledWith(0);
    });
});
