/**
 * API Configuration
 * Centralized configuration for API client
 */

export interface ApiConfig {
  baseURL: string;
  timeout: number;
  enableAPI: boolean;
  retryAttempts: number;
  retryDelay: number;
}

/**
 * Get environment variable value
 * Supports both browser (import.meta.env) and Node.js (process.env)
 */
const getEnv = (key: string, defaultValue: string = ''): string => {
  // Browser environment (Vite)
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    return import.meta.env[key] || defaultValue;
  }
  // Node.js environment
  if (typeof process !== 'undefined' && process.env) {
    return process.env[key] || defaultValue;
  }
  return defaultValue;
};

/**
 * Get API configuration from environment variables
 * Works in both browser and Node.js environments
 */
export const getApiConfig = (): ApiConfig => {
  const baseURL = getEnv('VITE_API_BASE_URL', 'http://localhost:3001/v1');
  const timeout = parseInt(getEnv('VITE_API_TIMEOUT', '10000'), 10);
  const enableAPI = getEnv('VITE_ENABLE_API', 'false') === 'true';

  return {
    baseURL,
    timeout,
    enableAPI,
    retryAttempts: 3,
    retryDelay: 1000, // 1 second initial delay (exponential backoff)
  };
};

/**
 * Error messages in Korean
 */
export const ErrorMessages = {
  NETWORK_ERROR: '서버에 연결할 수 없습니다',
  NOT_FOUND: '데이터를 찾을 수 없습니다',
  BAD_REQUEST: '입력값이 올바르지 않습니다',
  SERVER_ERROR: '서버 오류가 발생했습니다',
  TIMEOUT: '요청 시간이 초과되었습니다',
  UNAUTHORIZED: '인증이 필요합니다',
  FORBIDDEN: '접근 권한이 없습니다',
  UNKNOWN: '알 수 없는 오류가 발생했습니다',
} as const;
