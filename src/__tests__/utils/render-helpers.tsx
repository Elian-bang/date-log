/**
 * React 렌더링 헬퍼 유틸리티
 * - Custom Render 함수
 * - Router Wrapper
 */

import { render, RenderOptions, RenderResult } from '@testing-library/react';
import { ReactElement, ReactNode } from 'react';
import { BrowserRouter } from 'react-router-dom';

// ============================================
// Custom Render 함수
// ============================================

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  initialRoute?: string;
  wrapWithRouter?: boolean;
}

/**
 * React Router와 함께 컴포넌트 렌더링
 */
export const renderWithRouter = (
  ui: ReactElement,
  options?: CustomRenderOptions
): RenderResult => {
  const { initialRoute = '/', wrapWithRouter = true, ...renderOptions } = options || {};

  // URL 설정
  if (initialRoute && initialRoute !== '/') {
    window.history.pushState({}, '', initialRoute);
  }

  const Wrapper = ({ children }: { children: ReactNode }) => {
    if (!wrapWithRouter) {
      return <>{children}</>;
    }
    return <BrowserRouter>{children}</BrowserRouter>;
  };

  return render(ui, { wrapper: Wrapper, ...renderOptions });
};

/**
 * 기본 렌더링 (Router 없이)
 */
export const renderComponent = (ui: ReactElement, options?: RenderOptions): RenderResult => {
  return render(ui, options);
};
