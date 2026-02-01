'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { CodeBlock } from '@/components/code';

interface MarkdownProps {
    children: string;
    className?: string;
    readOnly?: boolean;
}

function MarkdownCodeBlock({ children, className, ...props }: any) {
    const match = /language-(\w+)/.exec(className || '');
    const language = match ? match[1] : null;

    if (language && typeof children === 'string') {
        // Remove trailing newline that react-markdown adds
        const code = children.replace(/\n$/, '');
        return <CodeBlock code={code} language={language} readOnly={true} />;
    }

    return (
        <code
            className="bg-base-200 px-1.5 py-0.5 rounded font-mono text-sm text-secondary border border-base-300/50"
            {...props}
        >
            {children}
        </code>
    );
}

export function Markdown({ children, className = '', readOnly = true }: MarkdownProps) {
    return (
        <div className={className}>
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                    code: MarkdownCodeBlock
                }}
            >
                {children}
            </ReactMarkdown>
        </div>
    );
}
