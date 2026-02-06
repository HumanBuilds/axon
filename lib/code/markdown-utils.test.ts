/**
 * Markdown Utilities Tests
 *
 * Tests markdown content parsing and code block extraction.
 */

import { describe, test, expect } from 'vitest';
import { parseContent, reconstructContent, isEmptyContent } from './markdown-utils';

describe('Parse Content', () => {
  test('should parse plain text without code blocks', () => {
    const content = 'This is plain text.';
    const segments = parseContent(content);

    expect(segments).toHaveLength(1);
    expect(segments[0].type).toBe('text');
    expect(segments[0].content).toBe(content);
  });

  test('should parse single code block', () => {
    const content = '```javascript\nconsole.log("hello");\n```\n';
    const segments = parseContent(content);

    expect(segments).toHaveLength(3); // Empty text before, code, empty text after
    expect(segments[0].type).toBe('text');
    expect(segments[0].content).toBe('');
    expect(segments[1].type).toBe('code');
    expect(segments[1].language).toBe('javascript');
    expect(segments[1].content).toBe('console.log("hello");');
    expect(segments[2].type).toBe('text');
  });

  test('should parse code block without language specifier', () => {
    const content = '```\ncode here\n```\n';
    const segments = parseContent(content);

    expect(segments[1].type).toBe('code');
    expect(segments[1].language).toBe('plaintext');
    expect(segments[1].content).toBe('code here');
  });

  test('should parse text before and after code block', () => {
    const content = 'Introduction\n```python\nprint("hello")\n```\nConclusion';
    const segments = parseContent(content);

    expect(segments).toHaveLength(3);
    expect(segments[0].type).toBe('text');
    expect(segments[0].content).toBe('Introduction\n');
    expect(segments[1].type).toBe('code');
    expect(segments[1].language).toBe('python');
    expect(segments[1].content).toBe('print("hello")');
    expect(segments[2].type).toBe('text');
    expect(segments[2].content).toBe('Conclusion');
  });

  test('should parse multiple code blocks', () => {
    const content = `First block:
\`\`\`javascript
const x = 1;
\`\`\`
Middle text
\`\`\`python
y = 2
\`\`\`
End text`;

    const segments = parseContent(content);

    expect(segments).toHaveLength(5);
    expect(segments[0].type).toBe('text');
    expect(segments[1].type).toBe('code');
    expect(segments[1].language).toBe('javascript');
    expect(segments[2].type).toBe('text');
    expect(segments[2].content).toContain('Middle text');
    expect(segments[3].type).toBe('code');
    expect(segments[3].language).toBe('python');
    expect(segments[4].type).toBe('text');
  });

  test('should handle code block with trailing newline in code', () => {
    const content = '```js\nconsole.log("test");\n\n```\n';
    const segments = parseContent(content);

    // Trailing newline in code should be removed
    expect(segments[1].content).toBe('console.log("test");\n');
  });

  test('should handle empty content', () => {
    const content = '';
    const segments = parseContent(content);

    expect(segments).toHaveLength(1);
    expect(segments[0].type).toBe('text');
    expect(segments[0].content).toBe('');
  });

  test('should track correct start and end indices', () => {
    const content = 'Text\n```js\ncode\n```\nMore';
    const segments = parseContent(content);

    expect(segments[0].startIndex).toBe(0);
    expect(segments[0].endIndex).toBe(5); // "Text\n"
    expect(segments[1].startIndex).toBe(5);
    expect(segments[1].endIndex).toBe(5 + '```js\ncode\n```\n'.length);
  });

  test('should handle inline code (backticks) correctly', () => {
    const content = 'Use `console.log()` to print.';
    const segments = parseContent(content);

    // Single backticks should not be treated as code blocks
    expect(segments).toHaveLength(1);
    expect(segments[0].type).toBe('text');
    expect(segments[0].content).toBe(content);
  });

  test('should handle code blocks with special characters', () => {
    const content = '```javascript\nconst regex = /abc/;\n```\n';
    const segments = parseContent(content);

    // Special regex characters should be preserved
    expect(segments[1].type).toBe('code');
    expect(segments[1].content).toBe('const regex = /abc/;');
  });
});

describe('Reconstruct Content', () => {
  test('should reconstruct plain text', () => {
    const original = 'Plain text only.';
    const segments = parseContent(original);
    const reconstructed = reconstructContent(segments);

    expect(reconstructed).toBe(original);
  });

  test('should reconstruct content with single code block', () => {
    const original = '```javascript\nconsole.log("hello");\n```\n';
    const segments = parseContent(original);
    const reconstructed = reconstructContent(segments);

    expect(reconstructed).toBe(original);
  });

  test('should reconstruct content with text and code', () => {
    const original = 'Intro\n```python\nprint("test")\n```\nOutro';
    const segments = parseContent(original);
    const reconstructed = reconstructContent(segments);

    // Might add newlines to normalize formatting
    expect(reconstructed).toContain('Intro');
    expect(reconstructed).toContain('```python\nprint("test")\n```');
    expect(reconstructed).toContain('Outro');
  });

  test('should reconstruct multiple code blocks', () => {
    const original = `\`\`\`js
code1
\`\`\`
text
\`\`\`py
code2
\`\`\`
`;
    const segments = parseContent(original);
    const reconstructed = reconstructContent(segments);

    expect(reconstructed).toContain('```js');
    expect(reconstructed).toContain('code1');
    expect(reconstructed).toContain('```py');
    expect(reconstructed).toContain('code2');
  });

  test('should handle empty segments gracefully', () => {
    const segments = [
      { type: 'text' as const, content: '', startIndex: 0, endIndex: 0 },
    ];
    const reconstructed = reconstructContent(segments);

    expect(reconstructed).toBe('');
  });

  test('should ensure proper newlines around code blocks', () => {
    const segments = [
      { type: 'text' as const, content: 'Text', startIndex: 0, endIndex: 4 },
      { type: 'code' as const, content: 'code', language: 'js', startIndex: 4, endIndex: 10 },
      { type: 'text' as const, content: 'More', startIndex: 10, endIndex: 14 },
    ];

    const reconstructed = reconstructContent(segments);

    // Should have newlines separating text from code blocks
    expect(reconstructed).toContain('Text\n```');
    expect(reconstructed).toContain('```\nMore');
  });

  test('should preserve language specifier', () => {
    const segments = [
      { type: 'code' as const, content: 'test', language: 'typescript', startIndex: 0, endIndex: 5 },
    ];

    const reconstructed = reconstructContent(segments);

    expect(reconstructed).toContain('```typescript');
  });
});

describe('Round-trip Parsing', () => {
  test('should handle round-trip for various content types', () => {
    const testCases = [
      'Plain text',
      '```js\ncode\n```\n',
      'Before\n```py\ncode\n```\nAfter',
      '```\nno language\n```\n',
      '',
    ];

    testCases.forEach((content) => {
      const segments = parseContent(content);
      const reconstructed = reconstructContent(segments);
      const reparsed = parseContent(reconstructed);

      // Structure should be identical after round-trip
      expect(reparsed.length).toBe(segments.length);
      reparsed.forEach((seg, i) => {
        expect(seg.type).toBe(segments[i].type);
        if (seg.type === 'code') {
          expect(seg.language).toBe(segments[i].language);
        }
      });
    });
  });
});

describe('Is Empty Content', () => {
  test('should identify empty string as empty', () => {
    expect(isEmptyContent('')).toBe(true);
  });

  test('should identify whitespace-only as empty', () => {
    expect(isEmptyContent('   ')).toBe(true);
    expect(isEmptyContent('\n\n\n')).toBe(true);
    expect(isEmptyContent('\t\t')).toBe(true);
    expect(isEmptyContent('  \n  \t  ')).toBe(true);
  });

  test('should identify non-empty content', () => {
    expect(isEmptyContent('text')).toBe(false);
    expect(isEmptyContent('  text  ')).toBe(false);
    expect(isEmptyContent('\ntext\n')).toBe(false);
  });
});
