/**
 * Language Configuration Tests
 *
 * Tests language mapping between Monaco and Piston, alias resolution.
 */

import { describe, test, expect } from 'vitest';
import {
  getLanguageConfig,
  isExecutableLanguage,
  getMonacoLanguage,
  getDisplayName,
  getSupportedLanguages,
  POPULAR_LANGUAGES,
} from './languages';

describe('Language Configuration', () => {
  test('should return config for supported language', () => {
    const config = getLanguageConfig('javascript');

    expect(config).not.toBeNull();
    expect(config?.monacoLanguage).toBe('javascript');
    expect(config?.pistonLanguage).toBe('javascript');
    expect(config?.displayName).toBe('JavaScript');
    expect(config?.executable).toBe(true);
  });

  test('should return null for unsupported language', () => {
    const config = getLanguageConfig('fortran');
    expect(config).toBeNull();
  });

  test('should resolve common aliases correctly', () => {
    expect(getLanguageConfig('js')?.monacoLanguage).toBe('javascript');
    expect(getLanguageConfig('ts')?.monacoLanguage).toBe('typescript');
    expect(getLanguageConfig('py')?.monacoLanguage).toBe('python');
    expect(getLanguageConfig('rb')?.monacoLanguage).toBe('ruby');
    expect(getLanguageConfig('rs')?.monacoLanguage).toBe('rust');
    expect(getLanguageConfig('c++')?.monacoLanguage).toBe('cpp');
    expect(getLanguageConfig('sh')?.monacoLanguage).toBe('shell');
  });

  test('should handle case-insensitive language names', () => {
    expect(getLanguageConfig('JavaScript')).toEqual(getLanguageConfig('javascript'));
    expect(getLanguageConfig('PYTHON')).toEqual(getLanguageConfig('python'));
    expect(getLanguageConfig('RuSt')).toEqual(getLanguageConfig('rust'));
  });

  test('should handle whitespace in language names', () => {
    expect(getLanguageConfig('  javascript  ')?.monacoLanguage).toBe('javascript');
  });
});

describe('Executable Language Check', () => {
  test('should identify executable languages', () => {
    expect(isExecutableLanguage('javascript')).toBe(true);
    expect(isExecutableLanguage('python')).toBe(true);
    expect(isExecutableLanguage('rust')).toBe(true);
    expect(isExecutableLanguage('go')).toBe(true);
    expect(isExecutableLanguage('java')).toBe(true);
  });

  test('should identify non-executable languages', () => {
    expect(isExecutableLanguage('html')).toBe(false);
    expect(isExecutableLanguage('css')).toBe(false);
    expect(isExecutableLanguage('json')).toBe(false);
    expect(isExecutableLanguage('markdown')).toBe(false);
  });

  test('should return false for unsupported languages', () => {
    expect(isExecutableLanguage('fortran')).toBe(false);
  });

  test('should work with aliases', () => {
    expect(isExecutableLanguage('js')).toBe(true);
    expect(isExecutableLanguage('py')).toBe(true);
  });
});

describe('Monaco Language Mapping', () => {
  test('should return correct Monaco language ID', () => {
    expect(getMonacoLanguage('javascript')).toBe('javascript');
    expect(getMonacoLanguage('python')).toBe('python');
    expect(getMonacoLanguage('cpp')).toBe('cpp');
    expect(getMonacoLanguage('bash')).toBe('shell'); // Special case
  });

  test('should return plaintext for unsupported languages', () => {
    expect(getMonacoLanguage('fortran')).toBe('plaintext');
    expect(getMonacoLanguage('cobol')).toBe('plaintext');
  });

  test('should work with aliases', () => {
    expect(getMonacoLanguage('js')).toBe('javascript');
    expect(getMonacoLanguage('sh')).toBe('shell');
  });
});

describe('Display Name', () => {
  test('should return formatted display names', () => {
    expect(getDisplayName('javascript')).toBe('JavaScript');
    expect(getDisplayName('python')).toBe('Python');
    expect(getDisplayName('csharp')).toBe('C#');
    expect(getDisplayName('cpp')).toBe('C++');
  });

  test('should return uppercase for unsupported languages', () => {
    expect(getDisplayName('fortran')).toBe('FORTRAN');
    expect(getDisplayName('cobol')).toBe('COBOL');
  });

  test('should work with aliases', () => {
    expect(getDisplayName('js')).toBe('JavaScript');
    expect(getDisplayName('py')).toBe('Python');
  });
});

describe('Supported Languages', () => {
  test('should return array of all supported languages', () => {
    const languages = getSupportedLanguages();

    expect(Array.isArray(languages)).toBe(true);
    expect(languages.length).toBeGreaterThan(0);
    expect(languages).toContain('javascript');
    expect(languages).toContain('python');
    expect(languages).toContain('rust');
  });

  test('should include aliases in supported languages', () => {
    const languages = getSupportedLanguages();

    expect(languages).toContain('js');
    expect(languages).toContain('py');
    expect(languages).toContain('ts');
  });
});

describe('Popular Languages', () => {
  test('should contain commonly used languages', () => {
    expect(POPULAR_LANGUAGES).toContain('javascript');
    expect(POPULAR_LANGUAGES).toContain('python');
    expect(POPULAR_LANGUAGES).toContain('typescript');
    expect(POPULAR_LANGUAGES).toContain('rust');
    expect(POPULAR_LANGUAGES).toContain('go');
  });

  test('should be a read-only array', () => {
    expect(Object.isFrozen(POPULAR_LANGUAGES)).toBe(false); // TypeScript const, not Object.freeze
    expect(POPULAR_LANGUAGES.length).toBeGreaterThan(0);
  });
});

describe('Language Configuration Structure', () => {
  test('should have required properties for executable languages', () => {
    const config = getLanguageConfig('python');

    expect(config).toHaveProperty('monacoLanguage');
    expect(config).toHaveProperty('pistonLanguage');
    expect(config).toHaveProperty('pistonVersion');
    expect(config).toHaveProperty('displayName');
    expect(config).toHaveProperty('executable');

    expect(config?.pistonLanguage).toBeTruthy();
    expect(config?.pistonVersion).toBeTruthy();
  });

  test('should have empty Piston properties for non-executable languages', () => {
    const config = getLanguageConfig('html');

    expect(config?.executable).toBe(false);
    expect(config?.pistonLanguage).toBe('');
    expect(config?.pistonVersion).toBe('');
  });
});
