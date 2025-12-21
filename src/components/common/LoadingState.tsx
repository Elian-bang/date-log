/**
 * Loading State Component
 * Provides three loading variants based on API state:
 * - initial: First-time loading with full spinner
 * - revalidating: Background refresh with subtle indicator
 * - inline: Compact loading for inline operations
 */

import { type ApiState } from '@/hooks/useDateLogAPI';

interface LoadingStateProps {
  variant: 'initial' | 'revalidating' | 'inline';
  message?: string;
}

export const LoadingState = ({ variant, message }: LoadingStateProps) => {
  if (variant === 'initial') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="text-gray-600 text-sm">
          {message || '데이터를 불러오는 중...'}
        </p>
      </div>
    );
  }

  if (variant === 'revalidating') {
    return (
      <div className="fixed top-4 right-4 bg-blue-50 border border-blue-200 rounded-lg px-4 py-2 shadow-sm z-50">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          <span className="text-blue-700 text-xs font-medium">
            {message || '업데이트 중...'}
          </span>
        </div>
      </div>
    );
  }

  // inline variant
  return (
    <div className="flex items-center space-x-2 py-2">
      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
      <span className="text-gray-600 text-sm">
        {message || '처리 중...'}
      </span>
    </div>
  );
};

/**
 * Helper function to determine loading variant from API state
 */
export function getLoadingVariant(state: ApiState): 'initial' | 'revalidating' | null {
  if (state === 'loading') return 'initial';
  if (state === 'revalidating') return 'revalidating';
  return null;
}
