/**
 * Code Executor Tests
 *
 * Tests code execution via Piston API with mocked network calls.
 * Focus: error handling, timeout behavior, language support.
 */

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { executeCode, cleanErrorOutput } from './executor';

// Mock fetch globally
global.fetch = vi.fn();
global.performance = {
  now: vi.fn(() => Date.now()),
} as any;

describe('Code Executor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  test('should execute JavaScript code successfully', async () => {
    const mockResponse = {
      run: {
        stdout: 'Hello, World!\n',
        stderr: '',
        code: 0,
        signal: null,
        output: 'Hello, World!\n',
      },
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const result = await executeCode('javascript', 'console.log("Hello, World!");');

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.stdout).toBe('Hello, World!\n');
      expect(result.stderr).toBe('');
      expect(result.exitCode).toBe(0);
    }
  });

  test('should execute Python code successfully', async () => {
    const mockResponse = {
      run: {
        stdout: '42\n',
        stderr: '',
        code: 0,
        signal: null,
        output: '42\n',
      },
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const result = await executeCode('python', 'print(42)');

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.stdout).toBe('42\n');
    }
  });

  test('should return error for unsupported language', async () => {
    const result = await executeCode('fortran', 'PRINT *, "Hello"');

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errorType).toBe('UNSUPPORTED_LANGUAGE');
      expect(result.message).toContain('fortran');
    }
  });

  test('should return error for non-executable language', async () => {
    const result = await executeCode('html', '<h1>Hello</h1>');

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errorType).toBe('UNSUPPORTED_LANGUAGE');
    }
  });

  test('should handle runtime errors with stderr', async () => {
    const mockResponse = {
      run: {
        stdout: '',
        stderr: 'Error: Division by zero\n',
        code: 1,
        signal: null,
        output: 'Error: Division by zero\n',
      },
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const result = await executeCode('python', '1 / 0');

    expect(result.success).toBe(true); // Piston call succeeded
    if (result.success) {
      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('Error');
    }
  });

  test('should handle compilation errors', async () => {
    const mockResponse = {
      compile: {
        stdout: '',
        stderr: 'error: expected semicolon',
        code: 1,
        signal: null,
        output: 'error: expected semicolon',
      },
      run: {
        stdout: '',
        stderr: '',
        code: 0,
        signal: null,
        output: '',
      },
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const result = await executeCode('rust', 'fn main() { println!("test") }');

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('semicolon');
    }
  });

  test('should handle Piston API errors', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 500,
      text: async () => 'Internal Server Error',
    });

    const result = await executeCode('javascript', 'console.log("test");');

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errorType).toBe('EXECUTION_FAILED');
      expect(result.message).toContain('500');
    }
  });

  test('should handle network errors', async () => {
    (global.fetch as any).mockRejectedValueOnce(new Error('Network connection failed'));

    const result = await executeCode('javascript', 'console.log("test");');

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errorType).toBe('NETWORK_ERROR');
      expect(result.message).toContain('Network connection failed');
    }
  });

  test('should timeout after 10 seconds', async () => {
    // Create proper AbortError
    const abortError = new Error('The operation was aborted');
    abortError.name = 'AbortError';

    // Mock fetch to reject with abort error
    (global.fetch as any).mockRejectedValueOnce(abortError);

    const result = await executeCode('javascript', 'while(true) {}');

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errorType).toBe('TIMEOUT');
      expect(result.message).toContain('10 seconds');
    }
  }, 10000);

  test('should include execution time in successful results', async () => {
    // Clear all previous mocks
    vi.clearAllMocks();

    const mockResponse = {
      run: {
        stdout: 'done',
        stderr: '',
        code: 0,
        signal: null,
        output: 'done',
      },
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const result = await executeCode('javascript', 'console.log("done");');

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.executionTime).toBeGreaterThanOrEqual(0);
      expect(typeof result.executionTime).toBe('number');
    }
  });

  test('should send correct request to Piston API', async () => {
    const mockResponse = {
      run: {
        stdout: '',
        stderr: '',
        code: 0,
        signal: null,
        output: '',
      },
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const code = 'print("test")';
    await executeCode('python', code);

    expect(global.fetch).toHaveBeenCalledTimes(1);

    const callArgs = (global.fetch as any).mock.calls[0];
    const [url, options] = callArgs;

    expect(url).toContain('/execute');
    expect(options.method).toBe('POST');
    expect(options.headers['Content-Type']).toBe('application/json');

    const body = JSON.parse(options.body);
    expect(body.language).toBe('python');
    expect(body.files[0].content).toBe(code);
  });

  test('should work with language aliases', async () => {
    const mockResponse = {
      run: {
        stdout: 'test',
        stderr: '',
        code: 0,
        signal: null,
        output: 'test',
      },
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    // Use alias 'js' instead of 'javascript'
    const result = await executeCode('js', 'console.log("test");');

    expect(result.success).toBe(true);
  });

  test('should handle empty stdout and stderr', async () => {
    // Clear all previous mocks
    vi.clearAllMocks();

    const mockResponse = {
      run: {
        stdout: '',
        stderr: '',
        code: 0,
        signal: null,
        output: '',
      },
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const result = await executeCode('javascript', '// empty program');

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.stdout).toBe('');
      expect(result.stderr).toBe('');
    }
  });

  test('should handle signal termination', async () => {
    // Clear all previous mocks
    vi.clearAllMocks();

    const mockResponse = {
      run: {
        stdout: '',
        stderr: 'Killed',
        code: 137,
        signal: 'SIGKILL',
        output: 'Killed',
      },
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const result = await executeCode('python', 'import os; os.kill(os.getpid(), 9)');

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.signal).toBe('SIGKILL');
      expect(result.exitCode).toBe(137);
    }
  });
});

describe('cleanErrorOutput', () => {
  test('should replace full piston job paths', () => {
    const input = '/piston/jobs/abc123-def456/file0.code: line 1: syntax error';
    expect(cleanErrorOutput(input)).toBe('card: line 1: syntax error');
  });

  test('should replace piston paths with file extensions', () => {
    const input = '/piston/jobs/abc123-def456/file0.code.py:3: SyntaxError';
    expect(cleanErrorOutput(input)).toBe('card.py:3: SyntaxError');
  });

  test('should replace standalone file0.code references', () => {
    const input = 'file0.code: error at line 5';
    expect(cleanErrorOutput(input)).toBe('card: error at line 5');
  });

  test('should replace file0.code with extension', () => {
    const input = 'file0.code.js:10: TypeError: undefined is not a function';
    expect(cleanErrorOutput(input)).toBe('card.js:10: TypeError: undefined is not a function');
  });

  test('should handle multiple replacements in one string', () => {
    const input = '/piston/jobs/aaa-bbb/file0.code.rs:1: error\nfile0.code.rs:2: note';
    expect(cleanErrorOutput(input)).toBe('card.rs:1: error\ncard.rs:2: note');
  });

  test('should return empty string unchanged', () => {
    expect(cleanErrorOutput('')).toBe('');
  });
});
