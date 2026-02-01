/**
 * Piston API executor for running code snippets
 */

import { getLanguageConfig } from './languages';

const PISTON_URL = process.env.NEXT_PUBLIC_PISTON_URL || 'https://emkc.org/api/v2/piston';
const EXECUTION_TIMEOUT = 10000; // 10 seconds

export type ExecutionErrorType =
    | 'UNSUPPORTED_LANGUAGE'
    | 'EXECUTION_FAILED'
    | 'NETWORK_ERROR'
    | 'TIMEOUT';

export interface ExecutionResult {
    success: true;
    stdout: string;
    stderr: string;
    exitCode: number;
    signal: string | null;
    executionTime?: number;
}

export interface ExecutionError {
    success: false;
    errorType: ExecutionErrorType;
    message: string;
}

export type ExecutionResponse = ExecutionResult | ExecutionError;

interface PistonResponse {
    run: {
        stdout: string;
        stderr: string;
        code: number;
        signal: string | null;
        output: string;
    };
    compile?: {
        stdout: string;
        stderr: string;
        code: number;
        signal: string | null;
        output: string;
    };
}

/**
 * Executes code using the Piston API
 */
export async function executeCode(language: string, code: string): Promise<ExecutionResponse> {
    const config = getLanguageConfig(language);

    if (!config || !config.executable) {
        return {
            success: false,
            errorType: 'UNSUPPORTED_LANGUAGE',
            message: `Language "${language}" is not supported for execution`,
        };
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), EXECUTION_TIMEOUT);
    const startTime = performance.now();

    try {
        const response = await fetch(`${PISTON_URL}/execute`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                language: config.pistonLanguage,
                version: config.pistonVersion,
                files: [
                    {
                        content: code,
                    },
                ],
            }),
            signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            const errorText = await response.text().catch(() => 'Unknown error');
            return {
                success: false,
                errorType: 'EXECUTION_FAILED',
                message: `Piston API error: ${response.status} - ${errorText}`,
            };
        }

        const data: PistonResponse = await response.json();
        const executionTime = performance.now() - startTime;

        // Check for compile errors first
        if (data.compile && data.compile.code !== 0) {
            return {
                success: true,
                stdout: data.compile.stdout || '',
                stderr: data.compile.stderr || data.compile.output || 'Compilation failed',
                exitCode: data.compile.code,
                signal: data.compile.signal,
                executionTime,
            };
        }

        return {
            success: true,
            stdout: data.run.stdout || '',
            stderr: data.run.stderr || '',
            exitCode: data.run.code,
            signal: data.run.signal,
            executionTime,
        };
    } catch (error) {
        clearTimeout(timeoutId);

        if (error instanceof Error) {
            if (error.name === 'AbortError') {
                return {
                    success: false,
                    errorType: 'TIMEOUT',
                    message: `Execution timed out after ${EXECUTION_TIMEOUT / 1000} seconds`,
                };
            }

            return {
                success: false,
                errorType: 'NETWORK_ERROR',
                message: error.message,
            };
        }

        return {
            success: false,
            errorType: 'NETWORK_ERROR',
            message: 'An unknown error occurred',
        };
    }
}
