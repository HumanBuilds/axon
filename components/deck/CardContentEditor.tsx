'use client';

import { LanguageSelectDropdown } from '@/components/ui/LanguageSelectDropdown';
import { useCardContentEditor } from './useCardContentEditor';
import { TextSegment } from './TextSegment';
import { CodeSegment } from './CodeSegment';

interface CardContentEditorProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    autoFocus?: boolean;
}

export function CardContentEditor({ value, onChange, placeholder, autoFocus = false }: CardContentEditorProps) {
    const {
        segments,
        showLangPicker, setShowLangPicker, codeButtonRef,
        runningIndex, executionResult,
        editingIndex, setEditingIndex,
        updateSegment, updateCodeBlock, deleteCodeBlock,
        updateCodeBlockLanguage, addCodeBlock,
        activateInsertionPoint, handleTextareaBlur, shouldShowTextarea,
        handleRunCode,
    } = useCardContentEditor({ value, onChange });

    return (
        <div className="border border-base-300 rounded-lg overflow-hidden bg-base-100 focus-within:border-primary transition-colors">
            {/* Toolbar */}
            <div className="flex items-center justify-end px-3 py-1.5 bg-base-200/50 border-b border-base-300">
                <div className="relative">
                    <button
                        ref={codeButtonRef}
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
                    <LanguageSelectDropdown
                        triggerRef={codeButtonRef}
                        isOpen={showLangPicker}
                        onClose={() => setShowLangPicker(false)}
                        onSelect={(lang) => addCodeBlock(segments.length - 1, lang)}
                        variant="light"
                    />
                </div>
            </div>

            {/* Content area */}
            <div>
                {segments.map((segment, index) => (
                    <div key={`${segment.type}-${index}`}>
                        {segment.type === 'text' ? (
                            <TextSegment
                                segment={segment}
                                index={index}
                                placeholder={index === 0 ? placeholder : undefined}
                                autoFocus={autoFocus && index === 0}
                                editingIndex={editingIndex}
                                setEditingIndex={setEditingIndex}
                                shouldShowTextarea={shouldShowTextarea}
                                updateSegment={updateSegment}
                                activateInsertionPoint={activateInsertionPoint}
                                handleTextareaBlur={handleTextareaBlur}
                            />
                        ) : (
                            <CodeSegment
                                segment={segment}
                                index={index}
                                runningIndex={runningIndex}
                                executionResult={executionResult}
                                deleteCodeBlock={deleteCodeBlock}
                                updateCodeBlock={updateCodeBlock}
                                updateCodeBlockLanguage={updateCodeBlockLanguage}
                                handleRunCode={handleRunCode}
                            />
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
