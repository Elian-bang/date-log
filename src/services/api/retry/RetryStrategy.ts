import { errorClassifier } from '../errors/ErrorClassifier';
import { logger } from '@/utils/logger';

/**
 * Retry Strategy Configuration
 */
export interface RetryConfig {
  maxRetries: number;       // Maximum retry attempts (default: 3)
  baseDelay: number;        // Base delay in milliseconds (default: 1000)
  maxDelay: number;         // Maximum delay in milliseconds (default: 10000)
  exponentialBase: number;  // Exponential backoff base (default: 2)
  jitter: boolean;          // Add random jitter (default: true)
}

/**
 * Default retry configuration
 */
const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  exponentialBase: 2,
  jitter: true,
};

/**
 * Retry Strategy
 * Implements exponential backoff with jitter
 */
export class RetryStrategy {
  private config: RetryConfig;

  constructor(config?: Partial<RetryConfig>) {
    this.config = { ...DEFAULT_RETRY_CONFIG, ...config };
  }

  /**
   * Execute function with retry logic
   */
  async execute<T>(
    fn: () => Promise<T>,
    context?: string
  ): Promise<T> {
    let lastError: unknown;

    for (let attempt = 0; attempt <= this.config.maxRetries; attempt++) {
      try {
        // Log retry attempt
        if (attempt > 0) {
          logger.log(`Retry attempt ${attempt}/${this.config.maxRetries}`, {
            context,
            attempt,
          });
        }

        // Execute function
        const result = await fn();

        // Log success
        if (attempt > 0) {
          logger.log(`Retry successful after ${attempt} attempts`, {
            context,
            totalAttempts: attempt + 1,
          });
        }

        return result;
      } catch (error) {
        lastError = error;

        // Check if error is retryable
        const isRetryable = errorClassifier.isRetryable(error);

        // Log error
        logger.error(`Attempt ${attempt + 1} failed`, {
          context,
          attempt: attempt + 1,
          retryable: isRetryable,
          error,
        });

        // If not retryable or max retries reached, throw
        if (!isRetryable || attempt === this.config.maxRetries) {
          logger.error('Max retries reached or non-retryable error', {
            context,
            totalAttempts: attempt + 1,
            error,
          });
          throw error;
        }

        // Calculate delay and wait
        const delay = this.calculateDelay(attempt);
        logger.log(`Waiting ${delay}ms before retry`, {
          context,
          delay,
          nextAttempt: attempt + 2,
        });

        await this.sleep(delay);
      }
    }

    // This should never be reached, but TypeScript needs it
    throw lastError;
  }

  /**
   * Calculate delay with exponential backoff and jitter
   */
  private calculateDelay(attempt: number): number {
    // Exponential backoff: baseDelay * (exponentialBase ^ attempt)
    const exponentialDelay = this.config.baseDelay * Math.pow(this.config.exponentialBase, attempt);

    // Cap at maxDelay
    const cappedDelay = Math.min(exponentialDelay, this.config.maxDelay);

    // Add jitter if enabled
    if (this.config.jitter) {
      // Jitter: random value between 0 and cappedDelay
      return Math.random() * cappedDelay;
    }

    return cappedDelay;
  }

  /**
   * Sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get retry configuration
   */
  getConfig(): RetryConfig {
    return { ...this.config };
  }

  /**
   * Update retry configuration
   */
  updateConfig(config: Partial<RetryConfig>): void {
    this.config = { ...this.config, ...config };
  }
}

/**
 * Create retry strategy with custom config
 */
export function createRetryStrategy(config?: Partial<RetryConfig>): RetryStrategy {
  return new RetryStrategy(config);
}

/**
 * Default retry strategy instance
 */
export const defaultRetryStrategy = new RetryStrategy();
