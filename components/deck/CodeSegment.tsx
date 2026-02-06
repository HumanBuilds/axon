import { isExecutableLanguage } from '@/lib/code/languages';
import type { ExecutionResult, ExecutionError } from '@/lib/code/executor';
import type { ContentSegment } from '@/lib/code/markdown-utils';
import { InlineCodeEditor } from './InlineCodeEditor';
import { ExecutionOutput } from './ExecutionOutput';

export interface CodeSegmentProps {
    segment: ContentSegment;
    index: number;
    runningIndex: number | null;
    executionResult: { index: number; result: ExecutionResult | ExecutionError } | null;
    deleteCodeBlock: (index: number) => void;
    updateCodeBlock: (index: number, newCode: string) => void;
    updateCodeBlockLanguage: (index: number, newLanguage: string) => void;
    handleRunCode: (index: number) => void;
}

export function CodeSegment({
    segment,
    index,
    runningIndex,
    executionResult,
    deleteCodeBlock,
    updateCodeBlock,
    updateCodeBlockLanguage,
    handleRunCode,
}: CodeSegmentProps) {
    return (
        <div className="px-3">
            <div className="relative group bg-[#0d1117] rounded-lg overflow-hidden">
                {/* Delete button */}
                <button
                    type="button"
                    onClick={() => deleteCodeBlock(index)}
                    className="absolute top-3 right-3 z-10 w-6 h-6 flex items-center justify-center rounded bg-white/5 text-white/40 hover:text-white hover:bg-white/10 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all"
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
                    <ExecutionOutput result={executionResult.result} />
                )}
            </div>
        </div>
    );
}
