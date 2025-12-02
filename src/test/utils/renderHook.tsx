import { ReactNode } from 'react';
import { renderHook as rtlRenderHook } from '@testing-library/react';

interface WrapperProps {
  children: ReactNode;
}

function Wrapper({ children }: WrapperProps) {
  return <>{children}</>;
}

export function renderHook<TProps, TResult>(
  hook: (props: TProps) => TResult,
  options?: { initialProps?: TProps }
) {
  return rtlRenderHook(hook, {
    wrapper: Wrapper,
    ...options,
  });
}
