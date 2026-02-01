/**
 * Language configuration mapping between Monaco Editor and Piston API
 */

export interface LanguageConfig {
    monacoLanguage: string;
    pistonLanguage: string;
    pistonVersion: string;
    displayName: string;
    executable: boolean;
}

const languageConfigs: Record<string, LanguageConfig> = {
    javascript: {
        monacoLanguage: 'javascript',
        pistonLanguage: 'javascript',
        pistonVersion: '18.15.0',
        displayName: 'JavaScript',
        executable: true,
    },
    typescript: {
        monacoLanguage: 'typescript',
        pistonLanguage: 'typescript',
        pistonVersion: '5.0.3',
        displayName: 'TypeScript',
        executable: true,
    },
    python: {
        monacoLanguage: 'python',
        pistonLanguage: 'python',
        pistonVersion: '3.10.0',
        displayName: 'Python',
        executable: true,
    },
    rust: {
        monacoLanguage: 'rust',
        pistonLanguage: 'rust',
        pistonVersion: '1.68.2',
        displayName: 'Rust',
        executable: true,
    },
    go: {
        monacoLanguage: 'go',
        pistonLanguage: 'go',
        pistonVersion: '1.16.2',
        displayName: 'Go',
        executable: true,
    },
    java: {
        monacoLanguage: 'java',
        pistonLanguage: 'java',
        pistonVersion: '15.0.2',
        displayName: 'Java',
        executable: true,
    },
    c: {
        monacoLanguage: 'c',
        pistonLanguage: 'c',
        pistonVersion: '10.2.0',
        displayName: 'C',
        executable: true,
    },
    cpp: {
        monacoLanguage: 'cpp',
        pistonLanguage: 'c++',
        pistonVersion: '10.2.0',
        displayName: 'C++',
        executable: true,
    },
    csharp: {
        monacoLanguage: 'csharp',
        pistonLanguage: 'csharp',
        pistonVersion: '6.12.0',
        displayName: 'C#',
        executable: true,
    },
    ruby: {
        monacoLanguage: 'ruby',
        pistonLanguage: 'ruby',
        pistonVersion: '3.0.1',
        displayName: 'Ruby',
        executable: true,
    },
    php: {
        monacoLanguage: 'php',
        pistonLanguage: 'php',
        pistonVersion: '8.2.3',
        displayName: 'PHP',
        executable: true,
    },
    swift: {
        monacoLanguage: 'swift',
        pistonLanguage: 'swift',
        pistonVersion: '5.3.3',
        displayName: 'Swift',
        executable: true,
    },
    kotlin: {
        monacoLanguage: 'kotlin',
        pistonLanguage: 'kotlin',
        pistonVersion: '1.8.20',
        displayName: 'Kotlin',
        executable: true,
    },
    bash: {
        monacoLanguage: 'shell',
        pistonLanguage: 'bash',
        pistonVersion: '5.2.0',
        displayName: 'Bash',
        executable: true,
    },
    sql: {
        monacoLanguage: 'sql',
        pistonLanguage: 'sqlite3',
        pistonVersion: '3.36.0',
        displayName: 'SQL',
        executable: true,
    },
    // Non-executable languages
    html: {
        monacoLanguage: 'html',
        pistonLanguage: '',
        pistonVersion: '',
        displayName: 'HTML',
        executable: false,
    },
    css: {
        monacoLanguage: 'css',
        pistonLanguage: '',
        pistonVersion: '',
        displayName: 'CSS',
        executable: false,
    },
    json: {
        monacoLanguage: 'json',
        pistonLanguage: '',
        pistonVersion: '',
        displayName: 'JSON',
        executable: false,
    },
    yaml: {
        monacoLanguage: 'yaml',
        pistonLanguage: '',
        pistonVersion: '',
        displayName: 'YAML',
        executable: false,
    },
    markdown: {
        monacoLanguage: 'markdown',
        pistonLanguage: '',
        pistonVersion: '',
        displayName: 'Markdown',
        executable: false,
    },
    xml: {
        monacoLanguage: 'xml',
        pistonLanguage: '',
        pistonVersion: '',
        displayName: 'XML',
        executable: false,
    },
};

// Aliases for common language identifiers
const aliases: Record<string, string> = {
    js: 'javascript',
    ts: 'typescript',
    py: 'python',
    rb: 'ruby',
    rs: 'rust',
    cs: 'csharp',
    'c++': 'cpp',
    sh: 'bash',
    shell: 'bash',
    yml: 'yaml',
    md: 'markdown',
};

/**
 * Resolves language aliases to canonical names
 */
function resolveAlias(lang: string): string {
    const normalized = lang.toLowerCase().trim();
    return aliases[normalized] || normalized;
}

/**
 * Gets the language configuration for a given language identifier
 */
export function getLanguageConfig(lang: string): LanguageConfig | null {
    const resolved = resolveAlias(lang);
    return languageConfigs[resolved] || null;
}

/**
 * Checks if a language is executable via Piston
 */
export function isExecutableLanguage(lang: string): boolean {
    const config = getLanguageConfig(lang);
    return config?.executable ?? false;
}

/**
 * Gets the Monaco language ID for a given language
 */
export function getMonacoLanguage(lang: string): string {
    const config = getLanguageConfig(lang);
    return config?.monacoLanguage || 'plaintext';
}

/**
 * Gets the display name for a language
 */
export function getDisplayName(lang: string): string {
    const config = getLanguageConfig(lang);
    return config?.displayName || lang.toUpperCase();
}

/**
 * Gets all supported language identifiers (including aliases)
 */
export function getSupportedLanguages(): string[] {
    return [...Object.keys(languageConfigs), ...Object.keys(aliases)];
}

/**
 * Popular languages for UI dropdowns
 */
export const POPULAR_LANGUAGES = [
    'javascript',
    'typescript',
    'python',
    'rust',
    'go',
    'java',
    'c',
    'cpp',
    'sql',
    'bash',
    'html',
    'css',
    'json',
] as const;
