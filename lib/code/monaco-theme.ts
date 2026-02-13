/**
 * Shared Monaco Editor theme matching github-light (Shiki theme)
 */
export const axonDarkTheme = {
    base: 'vs' as const,
    inherit: true,
    rules: [
        { token: 'comment', foreground: '64748b', fontStyle: 'italic' },
        { token: 'keyword', foreground: '7c3aed' },
        { token: 'string', foreground: '059669' },
        { token: 'number', foreground: '2563eb' },
        { token: 'type', foreground: 'c2410c' },
        { token: 'function', foreground: '2563eb' },
        { token: 'variable', foreground: 'c2410c' },
        { token: 'constant', foreground: '2563eb' },
        { token: 'operator', foreground: '7c3aed' },
    ],
    colors: {
        'editor.background': '#f8fafc',
        'editor.foreground': '#1e293b',
        'editor.lineHighlightBackground': '#f1f5f9',
        'editor.selectionBackground': '#c7d2fe',
        'editorCursor.foreground': '#1e293b',
        'editorLineNumber.foreground': '#94a3b8',
        'editorLineNumber.activeForeground': '#475569',
        'editor.inactiveSelectionBackground': '#c7d2fe55',
    },
};
