/**
 * Logging Utility
 * Environment-aware logging that only outputs in development mode
 */

// Vite-specific environment check
const isDevelopment = import.meta.env.MODE === 'development';

export const logger = {
  /**
   * Log informational messages (only in development)
   */
  log: (...args: unknown[]): void => {
    if (isDevelopment) {
      console.log(...args);
    }
  },

  /**
   * Log error messages (always logged)
   */
  error: (...args: unknown[]): void => {
    console.error(...args);
  },

  /**
   * Log warning messages (only in development)
   */
  warn: (...args: unknown[]): void => {
    if (isDevelopment) {
      console.warn(...args);
    }
  },

  /**
   * Log debug messages (only in development)
   */
  debug: (...args: unknown[]): void => {
    if (isDevelopment) {
      console.debug(...args);
    }
  },
};
