import { isEmptyContent, type ContentSegment } from '@/lib/code/markdown-utils';
import { Markdown } from '@/components/ui/Markdown';

interface InsertionPointProps {
    onActivate: () => void;
}

function InsertionPoint({ onActivate }: InsertionPointProps) {
    return (
        <button
            type="button"
            onClick={onActivate}
            className="w-full h-8 flex items-center justify-center group cursor-pointer relative opacity-100 lg:opacity-0 lg:hover:opacity-100 transition-opacity duration-150"
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

export interface TextSegmentProps {
    segment: ContentSegment;
    index: number;
    placeholder?: string;
    autoFocus?: boolean;
    editingIndex: number | null;
    setEditingIndex: (index: number | null) => void;
    shouldShowTextarea: (segment: ContentSegment, index: number) => boolean;
    updateSegment: (index: number, newContent: string) => void;
    activateInsertionPoint: (index: number) => void;
    handleTextareaBlur: (index: number, content: string) => void;
}

export function TextSegment({
    segment,
    index,
    placeholder,
    autoFocus,
    editingIndex,
    setEditingIndex,
    shouldShowTextarea,
    updateSegment,
    activateInsertionPoint,
    handleTextareaBlur,
}: TextSegmentProps) {
    if (!shouldShowTextarea(segment, index)) {
        return (
            <InsertionPoint
                onActivate={() => activateInsertionPoint(index)}
            />
        );
    }

    if (editingIndex === index || isEmptyContent(segment.content)) {
        return (
            <textarea
                className="w-full resize-none font-mono text-sm p-3 bg-transparent focus:outline-none"
                placeholder={index === 0 ? placeholder : undefined}
                value={segment.content}
                onChange={(e) => updateSegment(index, e.target.value)}
                onFocus={() => setEditingIndex(index)}
                onBlur={(e) => {
                    handleTextareaBlur(index, e.target.value);
                    setEditingIndex(null);
                }}
                rows={Math.max(1, segment.content.split('\n').length || 1)}
                autoFocus={editingIndex === index || (autoFocus && index === 0)}
            />
        );
    }

    return (
        <div
            onClick={() => setEditingIndex(index)}
            className="w-full min-h-[2.5rem] p-3 cursor-text hover:bg-base-200/30 transition-colors prose prose-sm flashcard-prose max-w-none"
        >
            <Markdown>{segment.content}</Markdown>
        </div>
    );
}
