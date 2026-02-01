/**
 * Utilities for parsing markdown content with code blocks
 */

export interface ContentSegment {
    type: 'text' | 'code';
    content: string;
    language?: string;
    startIndex: number;
    endIndex: number;
}

/**
 * Parse markdown content into segments of text and code blocks
 */
export function parseContent(content: string): ContentSegment[] {
    const segments: ContentSegment[] = [];
    const codeBlockRegex = /```(\w*)\n([\s\S]*?)```/g;

    let lastIndex = 0;
    let match;

    while ((match = codeBlockRegex.exec(content)) !== null) {
        // Always add text before this code block (even if empty)
        const textContent = content.slice(lastIndex, match.index);
        segments.push({
            type: 'text',
            content: textContent,
            startIndex: lastIndex,
            endIndex: match.index,
        });

        // Add the code block
        segments.push({
            type: 'code',
            content: match[2],
            language: match[1] || 'plaintext',
            startIndex: match.index,
            endIndex: match.index + match[0].length,
        });

        lastIndex = match.index + match[0].length;
    }

    // Always add text after last code block (even if empty)
    segments.push({
        type: 'text',
        content: content.slice(lastIndex),
        startIndex: lastIndex,
        endIndex: content.length,
    });

    // If no segments (empty content), add empty text segment
    if (segments.length === 0) {
        segments.push({
            type: 'text',
            content: '',
            startIndex: 0,
            endIndex: 0,
        });
    }

    return segments;
}

/**
 * Reconstruct markdown from segments
 */
export function reconstructContent(segments: ContentSegment[]): string {
    return segments.map(seg => {
        if (seg.type === 'code') {
            return `\`\`\`${seg.language || ''}\n${seg.content}\`\`\``;
        }
        return seg.content;
    }).join('');
}

/**
 * Check if content is empty or whitespace-only
 */
export function isEmptyContent(content: string): boolean {
    return content.trim().length === 0;
}
