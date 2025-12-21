/**
 * Error State Component
 * Displays user-friendly error messages with action buttons
 * Features: Retry operation, rollback to previous state, dismiss error
 */

import { type ErrorMetadata } from '@/services/api/errors/ErrorClassifier';

interface ErrorStateProps {
  error: string | ErrorMetadata;
  onRetry?: () => void;
  onDismiss?: () => void;
  variant?: 'inline' | 'banner' | 'modal';
}

export const ErrorState = ({
  error,
  onRetry,
  onDismiss,
  variant = 'banner'
}: ErrorStateProps) => {
  // Extract error message
  const errorMessage = typeof error === 'string' ? error : error.userMessage;
  const errorSeverity = typeof error === 'string' ? 'error' : error.severity;
  const isRetryable = typeof error === 'string' ? true : error.retryable;

  // Severity colors
  const severityStyles = {
    info: 'bg-blue-50 border-blue-200 text-blue-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    critical: 'bg-red-100 border-red-300 text-red-900'
  };

  const iconStyles = {
    info: '💡',
    warning: '⚠️',
    error: '❌',
    critical: '🚨'
  };

  if (variant === 'inline') {
    return (
      <div className={`flex items-start space-x-2 p-3 rounded-lg border ${severityStyles[errorSeverity]}`}>
        <span className="text-lg">{iconStyles[errorSeverity]}</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm whitespace-pre-line">{errorMessage}</p>
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close"
          >
            ✕
          </button>
        )}
      </div>
    );
  }

  if (variant === 'modal') {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 space-y-4">
          <div className="flex items-center space-x-3">
            <span className="text-3xl">{iconStyles[errorSeverity]}</span>
            <h3 className="text-lg font-semibold text-gray-900">오류 발생</h3>
          </div>

          <p className="text-gray-700 whitespace-pre-line">{errorMessage}</p>

          <div className="flex gap-3 pt-2">
            {isRetryable && onRetry && (
              <button
                onClick={onRetry}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                다시 시도
              </button>
            )}
            {onDismiss && (
              <button
                onClick={onDismiss}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded-lg transition-colors"
              >
                닫기
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // banner variant (default)
  return (
    <div className={`flex items-start space-x-3 p-4 rounded-lg border shadow-sm ${severityStyles[errorSeverity]}`}>
      <span className="text-2xl flex-shrink-0">{iconStyles[errorSeverity]}</span>

      <div className="flex-1 min-w-0 space-y-3">
        <p className="text-sm font-medium whitespace-pre-line">{errorMessage}</p>

        <div className="flex gap-2">
          {isRetryable && onRetry && (
            <button
              onClick={onRetry}
              className="bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 font-medium text-xs py-2 px-4 rounded-md transition-colors"
            >
              🔄 다시 시도
            </button>
          )}
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 font-medium text-xs py-2 px-4 rounded-md transition-colors"
            >
              확인
            </button>
          )}
        </div>
      </div>

      {onDismiss && (
        <button
          onClick={onDismiss}
          className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
          aria-label="Close"
        >
          ✕
        </button>
      )}
    </div>
  );
};

/**
 * Helper component for network-related errors with detailed actions
 */
export const NetworkErrorState = ({
  error,
  onRetry,
  onDismiss
}: ErrorStateProps) => {
  return (
    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 space-y-3">
      <div className="flex items-start space-x-3">
        <span className="text-2xl">📡</span>
        <div className="flex-1">
          <h4 className="font-semibold text-orange-900 text-sm mb-1">네트워크 오류</h4>
          <p className="text-orange-800 text-xs whitespace-pre-line">
            {typeof error === 'string' ? error : error.userMessage}
          </p>
        </div>
      </div>

      <div className="flex gap-2 pl-11">
        {onRetry && (
          <button
            onClick={onRetry}
            className="bg-orange-600 hover:bg-orange-700 text-white font-medium text-xs py-2 px-4 rounded-md transition-colors"
          >
            🔄 재시도
          </button>
        )}
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="bg-white hover:bg-gray-50 border border-orange-300 text-orange-700 font-medium text-xs py-2 px-4 rounded-md transition-colors"
          >
            확인
          </button>
        )}
      </div>
    </div>
  );
};
