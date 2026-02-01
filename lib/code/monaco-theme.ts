/**
 * Shared Monaco Editor theme matching github-dark (Shiki theme)
 */
export const axonDarkTheme = {
    base: 'vs-dark' as const,
    inherit: true,
    rules: [
        { token: 'comment', foreground: '8b949e', fontStyle: 'italic' },
        { token: 'keyword', foreground: 'ff7b72' },
        { token: 'string', foreground: 'a5d6ff' },
        { token: 'number', foreground: '79c0ff' },
        { token: 'type', foreground: 'ffa657' },
        { token: 'function', foreground: 'd2a8ff' },
        { token: 'variable', foreground: 'ffa657' },
        { token: 'constant', foreground: '79c0ff' },
        { token: 'operator', foreground: 'ff7b72' },
    ],
    colors: {
        'editor.background': '#0d1117',
        'editor.foreground': '#c9d1d9',
        'editor.lineHighlightBackground': '#161b22',
        'editor.selectionBackground': '#264f78',
        'editorCursor.foreground': '#c9d1d9',
        'editorLineNumber.foreground': '#8b949e',
        'editorLineNumber.activeForeground': '#c9d1d9',
        'editor.inactiveSelectionBackground': '#264f7855',
    },
};
