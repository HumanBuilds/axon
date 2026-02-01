/**
 * Singleton Shiki highlighter to avoid recreation on each render
 */

import { createHighlighter, type Highlighter, type BundledLanguage } from 'shiki';

let highlighterPromise: Promise<Highlighter> | null = null;

const THEME = 'github-dark';

// Common languages to preload
const PRELOAD_LANGUAGES: BundledLanguage[] = [
    'javascript',
    'typescript',
    'python',
    'rust',
    'go',
    'java',
    'c',
    'cpp',
    'json',
    'html',
    'css',
    'bash',
    'sql',
    'markdown',
];

/**
 * Gets or creates the singleton Shiki highlighter
 */
export async function getHighlighter(): Promise<Highlighter> {
    if (!highlighterPromise) {
        highlighterPromise = createHighlighter({
            themes: [THEME],
            langs: PRELOAD_LANGUAGES,
        });
    }
    return highlighterPromise;
}

/**
 * Highlights code using Shiki
 */
export async function highlightCode(code: string, language: string): Promise<string> {
    const highlighter = await getHighlighter();

    // Load language if not already loaded
    const loadedLangs = highlighter.getLoadedLanguages();
    const normalizedLang = language.toLowerCase();

    if (!loadedLangs.includes(normalizedLang as BundledLanguage)) {
        try {
            await highlighter.loadLanguage(normalizedLang as BundledLanguage);
        } catch {
            // Fall back to plaintext if language is not supported
            return highlighter.codeToHtml(code, {
                lang: 'plaintext',
                theme: THEME,
            });
        }
    }

    return highlighter.codeToHtml(code, {
        lang: normalizedLang,
        theme: THEME,
    });
}

/**
 * Gets the current theme name
 */
export function getThemeName(): string {
    return THEME;
}
