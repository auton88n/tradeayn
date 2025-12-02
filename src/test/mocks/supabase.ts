import { vi } from 'vitest';

export const createMockSupabaseClient = () => {
  const mockSelect = vi.fn().mockReturnThis();
  const mockInsert = vi.fn().mockReturnThis();
  const mockUpdate = vi.fn().mockReturnThis();
  const mockDelete = vi.fn().mockReturnThis();
  const mockEq = vi.fn().mockReturnThis();
  const mockOrder = vi.fn().mockReturnThis();
  const mockLimit = vi.fn().mockReturnThis();
  const mockSingle = vi.fn();
  const mockMaybeSingle = vi.fn();

  const mockFrom = vi.fn(() => ({
    select: mockSelect,
    insert: mockInsert,
    update: mockUpdate,
    delete: mockDelete,
    eq: mockEq,
    order: mockOrder,
    limit: mockLimit,
    single: mockSingle,
    maybeSingle: mockMaybeSingle,
  }));

  const mockInvoke = vi.fn();
  const mockRpc = vi.fn();

  const mockAuth = {
    getSession: vi.fn(),
    refreshSession: vi.fn(),
  };

  return {
    from: mockFrom,
    functions: {
      invoke: mockInvoke,
    },
    rpc: mockRpc,
    auth: mockAuth,
    // Return individual mocks for assertion
    _mocks: {
      from: mockFrom,
      select: mockSelect,
      insert: mockInsert,
      update: mockUpdate,
      delete: mockDelete,
      eq: mockEq,
      order: mockOrder,
      limit: mockLimit,
      single: mockSingle,
      maybeSingle: mockMaybeSingle,
      invoke: mockInvoke,
      rpc: mockRpc,
      auth: mockAuth,
    },
  };
};

export type MockSupabaseClient = ReturnType<typeof createMockSupabaseClient>;
