import { ApiClientError } from '../client';

/**
 * Error Metadata
 * Structured error information for user-friendly error handling
 */
export interface ErrorMetadata {
  code: string;                // Error code: 'TIMEOUT', 'NETWORK_ERROR', etc.
  message: string;              // Original error message
  userMessage: string;          // User-friendly Korean message
  retryable: boolean;           // Whether retry is possible
  severity: 'info' | 'warning' | 'error' | 'critical';
}

/**
 * Error Classifier
 * Classifies API errors and provides user-friendly messages
 */
export class ErrorClassifier {
  /**
   * Classify error and return structured metadata
   */
  classify(error: unknown): ErrorMetadata {
    if (error instanceof ApiClientError) {
      return this.classifyApiError(error);
    }
    return this.classifyUnknownError(error);
  }

  /**
   * Classify ApiClientError
   */
  private classifyApiError(error: ApiClientError): ErrorMetadata {
    switch (error.code) {
      case 'TIMEOUT':
        return {
          code: 'TIMEOUT',
          message: error.message,
          userMessage: '⏱️ 서버 응답 시간이 초과되었습니다 (15초)\n잠시 후 다시 시도해주세요.',
          retryable: true,
          severity: 'warning'
        };

      case 'NETWORK_ERROR':
        return {
          code: 'NETWORK_ERROR',
          message: error.message,
          userMessage: '📡 인터넷 연결을 확인해주세요\n네트워크 상태를 확인하고 다시 시도해주세요.',
          retryable: true,
          severity: 'error'
        };

      case 'HTTP_404':
        return {
          code: 'NOT_FOUND',
          message: error.message,
          userMessage: '🔍 해당 날짜의 데이터를 찾을 수 없습니다',
          retryable: false,
          severity: 'info'
        };

      case 'HTTP_500':
      case 'HTTP_502':
      case 'HTTP_503':
        return {
          code: 'SERVER_ERROR',
          message: error.message,
          userMessage: '🚨 서버에 일시적인 문제가 발생했습니다\n잠시 후 다시 시도해주세요.',
          retryable: true,
          severity: 'error'
        };

      case 'HTTP_400':
        return {
          code: 'BAD_REQUEST',
          message: error.message,
          userMessage: '⚠️ 잘못된 요청입니다\n입력 내용을 확인해주세요.',
          retryable: false,
          severity: 'warning'
        };

      case 'HTTP_401':
      case 'HTTP_403':
        return {
          code: 'UNAUTHORIZED',
          message: error.message,
          userMessage: '🔒 권한이 없습니다\n다시 로그인해주세요.',
          retryable: false,
          severity: 'error'
        };

      default:
        return this.classifyUnknownError(error);
    }
  }

  /**
   * Classify unknown errors
   */
  private classifyUnknownError(error: unknown): ErrorMetadata {
    const message = error instanceof Error ? error.message : String(error);

    return {
      code: 'UNKNOWN_ERROR',
      message,
      userMessage: '❌ 알 수 없는 오류가 발생했습니다\n문제가 지속되면 관리자에게 문의해주세요.',
      retryable: false,
      severity: 'critical'
    };
  }

  /**
   * Check if error is retryable
   */
  isRetryable(error: unknown): boolean {
    const metadata = this.classify(error);
    return metadata.retryable;
  }

  /**
   * Get user-friendly message
   */
  getUserMessage(error: unknown): string {
    const metadata = this.classify(error);
    return metadata.userMessage;
  }

  /**
   * Get error severity
   */
  getSeverity(error: unknown): ErrorMetadata['severity'] {
    const metadata = this.classify(error);
    return metadata.severity;
  }
}

/**
 * Singleton instance
 */
export const errorClassifier = new ErrorClassifier();
