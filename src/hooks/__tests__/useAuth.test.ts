import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useAuth } from '../useAuth';
import { createMockSupabaseClient } from '@/test/mocks/supabase';
import { mockToast } from '@/test/mocks/contexts';
import type { User, Session } from '@supabase/supabase-js';

// Mock supabase client
const mockSupabase = createMockSupabaseClient();
vi.mock('@/integrations/supabase/client', () => ({
  supabase: mockSupabase,
}));

// Mock device tracking
vi.mock('@/hooks/useDeviceTracking', () => ({
  trackDeviceLogin: vi.fn(),
}));

const mockUser: User = {
  id: 'test-user-id',
  email: 'test@example.com',
  app_metadata: {},
  user_metadata: {},
  aud: 'authenticated',
  created_at: new Date().toISOString(),
};

const mockSession: Session = {
  access_token: 'test-access-token',
  refresh_token: 'test-refresh-token',
  expires_in: 3600,
  expires_at: Date.now() / 1000 + 3600,
  token_type: 'bearer',
  user: mockUser,
};

const waitFor = async (callback: () => void, timeout = 1000) => {
  const startTime = Date.now();
  while (Date.now() - startTime < timeout) {
    try {
      callback();
      return;
    } catch (error) {
      await new Promise(resolve => setTimeout(resolve, 50));
    }
  }
  callback(); // Final attempt
};

describe('useAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe('checkAccess', () => {
    it('should set hasAccess to true when user has active access grant', async () => {
      mockSupabase._mocks.maybeSingle.mockResolvedValueOnce({
        data: { is_active: true, expires_at: null },
        error: null,
      });

      const { result } = renderHook(() => useAuth(mockUser, mockSession));

      await waitFor(() => {
        expect(result.current.hasAccess).toBe(true);
      });
    });

    it('should set hasAccess to false when access grant is inactive', async () => {
      mockSupabase._mocks.maybeSingle.mockResolvedValueOnce({
        data: { is_active: false, expires_at: null },
        error: null,
      });

      const { result } = renderHook(() => useAuth(mockUser, mockSession));

      await waitFor(() => {
        expect(result.current.hasAccess).toBe(false);
      });
    });

    it('should set hasAccess to false when access grant is expired', async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);

      mockSupabase._mocks.maybeSingle.mockResolvedValueOnce({
        data: { is_active: true, expires_at: pastDate.toISOString() },
        error: null,
      });

      const { result } = renderHook(() => useAuth(mockUser, mockSession));

      await waitFor(() => {
        expect(result.current.hasAccess).toBe(false);
      });
    });

    it('should set hasAccess to false when no access grant exists', async () => {
      mockSupabase._mocks.maybeSingle.mockResolvedValueOnce({
        data: null,
        error: null,
      });

      const { result } = renderHook(() => useAuth(mockUser, mockSession));

      await waitFor(() => {
        expect(result.current.hasAccess).toBe(false);
      });
    });

    it('should handle database errors gracefully', async () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      mockSupabase._mocks.maybeSingle.mockResolvedValueOnce({
        data: null,
        error: { message: 'Database error' },
      });

      const { result } = renderHook(() => useAuth(mockUser, mockSession));

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalled();
        expect(result.current.hasAccess).toBe(false);
      });

      consoleError.mockRestore();
    });
  });

  describe('checkAdminRole', () => {
    it('should set isAdmin to true when user role is admin', async () => {
      mockSupabase._mocks.maybeSingle
        .mockResolvedValueOnce({ data: null, error: null }) // access_grants
        .mockResolvedValueOnce({ data: { role: 'admin' }, error: null }); // user_roles

      const { result } = renderHook(() => useAuth(mockUser, mockSession));

      await waitFor(() => {
        expect(result.current.isAdmin).toBe(true);
      });
    });

    it('should set isAdmin to false when user role is not admin', async () => {
      mockSupabase._mocks.maybeSingle
        .mockResolvedValueOnce({ data: null, error: null }) // access_grants
        .mockResolvedValueOnce({ data: { role: 'user' }, error: null }); // user_roles

      const { result } = renderHook(() => useAuth(mockUser, mockSession));

      await waitFor(() => {
        expect(result.current.isAdmin).toBe(false);
      });
    });

    it('should set isAdmin to false when no role exists', async () => {
      mockSupabase._mocks.maybeSingle
        .mockResolvedValueOnce({ data: null, error: null }) // access_grants
        .mockResolvedValueOnce({ data: null, error: null }); // user_roles

      const { result } = renderHook(() => useAuth(mockUser, mockSession));

      await waitFor(() => {
        expect(result.current.isAdmin).toBe(false);
      });
    });
  });

  describe('loadUserProfile', () => {
    it('should load and set user profile correctly', async () => {
      const mockProfile = {
        user_id: 'test-user-id',
        contact_person: 'John Doe',
        company_name: 'Test Corp',
        business_type: 'Technology',
        business_context: 'Software development',
        avatar_url: 'https://example.com/avatar.jpg',
      };

      mockSupabase._mocks.maybeSingle
        .mockResolvedValueOnce({ data: null, error: null }) // access_grants
        .mockResolvedValueOnce({ data: null, error: null }) // user_roles
        .mockResolvedValueOnce({ data: mockProfile, error: null }); // profiles

      const { result } = renderHook(() => useAuth(mockUser, mockSession));

      await waitFor(() => {
        expect(result.current.userProfile).toEqual(mockProfile);
      });
    });

    it('should handle missing profile gracefully', async () => {
      mockSupabase._mocks.maybeSingle
        .mockResolvedValueOnce({ data: null, error: null }) // access_grants
        .mockResolvedValueOnce({ data: null, error: null }) // user_roles
        .mockResolvedValueOnce({ data: null, error: null }); // profiles

      const { result } = renderHook(() => useAuth(mockUser, mockSession));

      await waitFor(() => {
        expect(result.current.userProfile).toBeNull();
      });
    });
  });

  describe('acceptTerms', () => {
    it('should set localStorage and update state when terms accepted', async () => {
      mockSupabase._mocks.maybeSingle
        .mockResolvedValueOnce({ data: null, error: null })
        .mockResolvedValueOnce({ data: null, error: null })
        .mockResolvedValueOnce({ data: null, error: null });

      const { result } = renderHook(() => useAuth(mockUser, mockSession));

      await waitFor(() => {
        expect(result.current.hasAcceptedTerms).toBe(false);
      });

      result.current.acceptTerms();

      expect(localStorage.setItem).toHaveBeenCalledWith(
        `ayn_terms_accepted_${mockUser.id}`,
        'true'
      );
      expect(mockToast).toHaveBeenCalled();
      expect(result.current.hasAcceptedTerms).toBe(true);
    });

    it('should check localStorage on mount for existing acceptance', async () => {
      (localStorage.getItem as any).mockReturnValueOnce('true');

      mockSupabase._mocks.maybeSingle
        .mockResolvedValueOnce({ data: null, error: null })
        .mockResolvedValueOnce({ data: null, error: null })
        .mockResolvedValueOnce({ data: null, error: null });

      const { result } = renderHook(() => useAuth(mockUser, mockSession));

      await waitFor(() => {
        expect(result.current.hasAcceptedTerms).toBe(true);
      });
    });
  });
});
