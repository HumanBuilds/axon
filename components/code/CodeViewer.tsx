'use client';

import { useEffect, useState } from 'react';
import { highlightCode } from '@/lib/code/shiki-singleton';
import { getDisplayName, isExecutableLanguage } from '@/lib/code/languages';
import { CodeActionBar } from './CodeActionBar';

interface CodeViewerProps {
    code: string;
    language: string;
    canEdit?: boolean;
    onEdit?: () => void;
    onRun?: () => void;
}

export function CodeViewer({
    code,
    language,
    canEdit = false,
    onEdit,
    onRun,
}: CodeViewerProps) {
    const [html, setHtml] = useState<string | null>(null);
    const [isHovered, setIsHovered] = useState(false);
    const canRun = isExecutableLanguage(language);

    useEffect(() => {
        let isMounted = true;

        highlightCode(code, language)
            .then((result) => {
                if (isMounted) setHtml(result);
            })
            .catch((err) => {
                console.error('Shiki highlighting error:', err);
            });

        return () => {
            isMounted = false;
        };
    }, [code, language]);

    return (
        <div
            className="relative"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Header bar */}
            <div className="flex items-center justify-between px-4 py-2 bg-[#161b22] border-b border-white/10">
                <span className="text-xs font-bold uppercase tracking-widest opacity-60 text-white">
                    {getDisplayName(language)}
                </span>

                {/* Action bar - visible on hover */}
                <div
                    className={`transition-opacity duration-150 ${
                        isHovered ? 'opacity-100' : 'opacity-0'
                    }`}
                >
                    <CodeActionBar
                        code={code}
                        canEdit={canEdit}
                        canRun={canRun}
                        onEdit={onEdit}
                        onRun={onRun}
                    />
                </div>
            </div>

            {/* Code content */}
            <div className="p-4 overflow-auto">
                {html ? (
                    <div
                        className="shiki-code"
                        dangerouslySetInnerHTML={{ __html: html }}
                    />
                ) : (
                    <div className="animate-pulse">
                        <div className="h-4 bg-white/10 rounded w-3/4 mb-2"></div>
                        <div className="h-4 bg-white/10 rounded w-1/2 mb-2"></div>
                        <div className="h-4 bg-white/10 rounded w-5/6"></div>
                    </div>
                )}
            </div>
        </div>
    );
}
