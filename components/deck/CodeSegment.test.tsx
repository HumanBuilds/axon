import { describe, test, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CodeSegment, type CodeSegmentProps } from './CodeSegment';

// Mock InlineCodeEditor
vi.mock('./InlineCodeEditor', () => ({
    InlineCodeEditor: (props: Record<string, unknown>) => (
        <div data-testid="inline-code-editor">
            <span data-testid="language">{props.language as string}</span>
            <span data-testid="code">{props.code as string}</span>
            {props.isRunning && <span data-testid="running">running</span>}
        </div>
    ),
}));

// Mock ExecutionOutput
vi.mock('./ExecutionOutput', () => ({
    ExecutionOutput: (props: { result: { success: boolean } }) => (
        <div data-testid="execution-output">
            {props.result.success ? 'success' : 'error'}
        </div>
    ),
}));

function makeProps(overrides: Partial<CodeSegmentProps> = {}): CodeSegmentProps {
    return {
        segment: {
            type: 'code',
            content: 'console.log("hi")',
            language: 'javascript',
            startIndex: 0,
            endIndex: 0,
        },
        index: 1,
        runningIndex: null,
        executionResult: null,
        deleteCodeBlock: vi.fn(),
        updateCodeBlock: vi.fn(),
        updateCodeBlockLanguage: vi.fn(),
        handleRunCode: vi.fn(),
        ...overrides,
    };
}

describe('CodeSegment', () => {
    test('should render InlineCodeEditor with correct props', () => {
        render(<CodeSegment {...makeProps()} />);
        expect(screen.getByTestId('inline-code-editor')).toBeTruthy();
        expect(screen.getByTestId('language').textContent).toBe('javascript');
        expect(screen.getByTestId('code').textContent).toBe('console.log("hi")');
    });

    test('should call deleteCodeBlock when delete button is clicked', () => {
        const deleteCodeBlock = vi.fn();
        render(<CodeSegment {...makeProps({ deleteCodeBlock })} />);
        const deleteButton = screen.getByTitle('Remove code block');
        fireEvent.click(deleteButton);
        expect(deleteCodeBlock).toHaveBeenCalledWith(1);
    });

    test('should show execution output when executionResult matches index', () => {
        render(
            <CodeSegment
                {...makeProps({
                    executionResult: {
                        index: 1,
                        result: { success: true, stdout: 'hi', stderr: '', exitCode: 0, signal: null },
                    },
                })}
            />
        );
        expect(screen.getByTestId('execution-output')).toBeTruthy();
        expect(screen.getByText('success')).toBeTruthy();
    });

    test('should not show execution output when executionResult is for different index', () => {
        render(
            <CodeSegment
                {...makeProps({
                    executionResult: {
                        index: 3,
                        result: { success: true, stdout: 'hi', stderr: '', exitCode: 0, signal: null },
                    },
                })}
            />
        );
        expect(screen.queryByTestId('execution-output')).toBeNull();
    });

    test('should show running state when runningIndex matches', () => {
        render(<CodeSegment {...makeProps({ runningIndex: 1 })} />);
        expect(screen.getByTestId('running')).toBeTruthy();
    });
});
