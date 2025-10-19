/**
 * Error Message Component
 * Displays error messages with retry and dismiss functionality
 */

import { FiAlertCircle, FiX, FiRefreshCw } from 'react-icons/fi';

interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
  onDismiss?: () => void;
  variant?: 'error' | 'warning' | 'info';
  fullScreen?: boolean;
}

export const ErrorMessage = ({
  message,
  onRetry,
  onDismiss,
  variant = 'error',
  fullScreen = false,
}: ErrorMessageProps) => {
  const variantStyles = {
    error: 'bg-red-50 border-red-200 text-red-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800',
  };

  const iconColors = {
    error: 'text-red-500',
    warning: 'text-yellow-500',
    info: 'text-blue-500',
  };

  const errorContent = (
    <div
      className={`rounded-lg border-2 p-4 ${variantStyles[variant]} max-w-md w-full`}
      role="alert"
    >
      <div className="flex items-start gap-3">
        <FiAlertCircle className={`flex-shrink-0 w-6 h-6 ${iconColors[variant]}`} />
        <div className="flex-1">
          <p className="font-medium text-sm">{message}</p>
          {(onRetry || onDismiss) && (
            <div className="flex gap-2 mt-3">
              {onRetry && (
                <button
                  onClick={onRetry}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-md bg-white border border-current hover:bg-gray-50 transition-colors"
                >
                  <FiRefreshCw className="w-4 h-4" />
                  다시 시도
                </button>
              )}
              {onDismiss && (
                <button
                  onClick={onDismiss}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-md hover:bg-white/50 transition-colors"
                >
                  <FiX className="w-4 h-4" />
                  닫기
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        {errorContent}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center p-4">
      {errorContent}
    </div>
  );
};
