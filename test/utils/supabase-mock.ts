/**
 * Mock Supabase client for testing
 * Simulates the chained query builder pattern
 */

import { vi } from 'vitest';
import type { DatabaseCard } from '@/lib/fsrs';

export interface MockQueryBuilder<T = any> {
  from: (table: string) => MockQueryBuilder<T>;
  select: (columns?: string) => MockQueryBuilder<T>;
  insert: (data: any) => MockQueryBuilder<T>;
  update: (data: any) => MockQueryBuilder<T>;
  delete: () => MockQueryBuilder<T>;
  eq: (column: string, value: any) => MockQueryBuilder<T>;
  neq: (column: string, value: any) => MockQueryBuilder<T>;
  gt: (column: string, value: any) => MockQueryBuilder<T>;
  gte: (column: string, value: any) => MockQueryBuilder<T>;
  lt: (column: string, value: any) => MockQueryBuilder<T>;
  lte: (column: string, value: any) => MockQueryBuilder<T>;
  like: (column: string, pattern: string) => MockQueryBuilder<T>;
  in: (column: string, values: any[]) => MockQueryBuilder<T>;
  is: (column: string, value: any) => MockQueryBuilder<T>;
  order: (column: string, options?: { ascending?: boolean }) => MockQueryBuilder<T>;
  limit: (count: number) => MockQueryBuilder<T>;
  single: () => Promise<{ data: T | null; error: any }>;
  maybeSingle: () => Promise<{ data: T | null; error: any }>;
  then: (resolve: (value: { data: T[] | null; error: any }) => void) => Promise<{ data: T[] | null; error: any }>;
}

export function createMockQueryBuilder<T = any>(
  mockData: T[] | null = null,
  mockError: any = null
): MockQueryBuilder<T> {
  const builder: MockQueryBuilder<T> = {
    from: vi.fn().mockReturnValue(builder),
    select: vi.fn().mockReturnValue(builder),
    insert: vi.fn().mockReturnValue(builder),
    update: vi.fn().mockReturnValue(builder),
    delete: vi.fn().mockReturnValue(builder),
    eq: vi.fn().mockReturnValue(builder),
    neq: vi.fn().mockReturnValue(builder),
    gt: vi.fn().mockReturnValue(builder),
    gte: vi.fn().mockReturnValue(builder),
    lt: vi.fn().mockReturnValue(builder),
    lte: vi.fn().mockReturnValue(builder),
    like: vi.fn().mockReturnValue(builder),
    in: vi.fn().mockReturnValue(builder),
    is: vi.fn().mockReturnValue(builder),
    order: vi.fn().mockReturnValue(builder),
    limit: vi.fn().mockReturnValue(builder),
    single: vi.fn().mockResolvedValue({
      data: mockData?.[0] ?? null,
      error: mockError,
    }),
    maybeSingle: vi.fn().mockResolvedValue({
      data: mockData?.[0] ?? null,
      error: mockError,
    }),
    then: vi.fn().mockImplementation((resolve) => {
      const result = { data: mockData, error: mockError };
      resolve(result);
      return Promise.resolve(result);
    }),
  };

  return builder;
}

export function createMockSupabaseClient(options: {
  mockData?: any[] | null;
  mockError?: any;
  mockUser?: any;
} = {}) {
  const { mockData = null, mockError = null, mockUser = null } = options;

  return {
    from: vi.fn(() => createMockQueryBuilder(mockData, mockError)),
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: mockUser },
        error: mockUser ? null : new Error('Not authenticated'),
      }),
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
    },
  };
}

export const mockAuthenticatedUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  aud: 'authenticated',
  role: 'authenticated',
  created_at: '2024-01-01T00:00:00Z',
};
