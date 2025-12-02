import { vi } from 'vitest';

export const mockToast = vi.fn();
export const mockUseToast = () => ({
  toast: mockToast,
  dismiss: vi.fn(),
  toasts: [],
});

export const mockT = vi.fn((key: string) => key);
export const mockUseLanguage = () => ({
  language: 'en' as const,
  setLanguage: vi.fn(),
  t: mockT,
});

// Mock the hooks
vi.mock('@/hooks/use-toast', () => ({
  useToast: mockUseToast,
}));

vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: mockUseLanguage,
}));
