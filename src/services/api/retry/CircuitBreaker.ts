import { logger } from '@/utils/logger';

/**
 * Circuit Breaker States
 */
export enum CircuitState {
  CLOSED = 'CLOSED',       // Normal operation
  OPEN = 'OPEN',           // Circuit tripped, rejecting requests
  HALF_OPEN = 'HALF_OPEN', // Testing if service recovered
}

/**
 * Circuit Breaker Configuration
 */
export interface CircuitBreakerConfig {
  failureThreshold: number;    // Consecutive failures to open circuit (default: 5)
  successThreshold: number;    // Consecutive successes to close circuit (default: 2)
  timeout: number;             // Milliseconds before attempting half-open (default: 30000)
  monitoringWindow: number;    // Time window for failure tracking (default: 60000)
}

/**
 * Default circuit breaker configuration
 */
const DEFAULT_CIRCUIT_CONFIG: CircuitBreakerConfig = {
  failureThreshold: 5,
  successThreshold: 2,
  timeout: 30000,
  monitoringWindow: 60000,
};

/**
 * Circuit Breaker Pattern Implementation
 * Prevents cascading failures by stopping requests to failing services
 */
export class CircuitBreaker {
  private config: CircuitBreakerConfig;
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount: number = 0;
  private successCount: number = 0;
  private nextAttemptTime: number = 0;
  private lastFailureTime: number = 0;

  constructor(config?: Partial<CircuitBreakerConfig>) {
    this.config = { ...DEFAULT_CIRCUIT_CONFIG, ...config };
  }

  /**
   * Execute function with circuit breaker protection
   */
  async execute<T>(
    fn: () => Promise<T>,
    context?: string
  ): Promise<T> {
    // Check if circuit is open
    if (this.state === CircuitState.OPEN) {
      // Check if timeout has elapsed to attempt half-open
      if (Date.now() < this.nextAttemptTime) {
        const error = new Error('Circuit breaker is OPEN - service unavailable');
        logger.error('Circuit breaker rejected request', {
          context,
          state: this.state,
          nextAttempt: new Date(this.nextAttemptTime).toISOString(),
        });
        throw error;
      }

      // Transition to half-open state
      this.transitionToHalfOpen(context);
    }

    try {
      // Execute the function
      const result = await fn();

      // Record success
      this.onSuccess(context);

      return result;
    } catch (error) {
      // Record failure
      this.onFailure(error, context);

      throw error;
    }
  }

  /**
   * Handle successful execution
   */
  private onSuccess(context?: string): void {
    this.failureCount = 0;

    if (this.state === CircuitState.HALF_OPEN) {
      this.successCount++;

      logger.log('Circuit breaker health check success', {
        context,
        successCount: this.successCount,
        threshold: this.config.successThreshold,
      });

      // Close circuit if success threshold reached
      if (this.successCount >= this.config.successThreshold) {
        this.transitionToClosed(context);
      }
    }
  }

  /**
   * Handle failed execution
   */
  private onFailure(error: unknown, context?: string): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    // Reset success count on any failure
    this.successCount = 0;

    // Check if failures are within monitoring window
    const timeSinceLastFailure = Date.now() - this.lastFailureTime;
    if (timeSinceLastFailure > this.config.monitoringWindow) {
      // Reset failure count if outside monitoring window
      this.failureCount = 1;
    }

    logger.error('Circuit breaker recorded failure', {
      context,
      failureCount: this.failureCount,
      threshold: this.config.failureThreshold,
      state: this.state,
      error,
    });

    // Open circuit if failure threshold reached
    if (this.state === CircuitState.HALF_OPEN) {
      // Immediately open on any failure in half-open state
      this.transitionToOpen(context);
    } else if (this.failureCount >= this.config.failureThreshold) {
      this.transitionToOpen(context);
    }
  }

  /**
   * Transition to CLOSED state
   */
  private transitionToClosed(context?: string): void {
    this.state = CircuitState.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;

    logger.log('Circuit breaker CLOSED - service recovered', {
      context,
      state: this.state,
    });
  }

  /**
   * Transition to OPEN state
   */
  private transitionToOpen(context?: string): void {
    this.state = CircuitState.OPEN;
    this.nextAttemptTime = Date.now() + this.config.timeout;

    logger.error('Circuit breaker OPEN - service unavailable', {
      context,
      state: this.state,
      failureCount: this.failureCount,
      nextAttempt: new Date(this.nextAttemptTime).toISOString(),
      timeoutMs: this.config.timeout,
    });
  }

  /**
   * Transition to HALF_OPEN state
   */
  private transitionToHalfOpen(context?: string): void {
    this.state = CircuitState.HALF_OPEN;
    this.successCount = 0;

    logger.log('Circuit breaker HALF_OPEN - testing service', {
      context,
      state: this.state,
    });
  }

  /**
   * Get current circuit breaker state
   */
  getState(): CircuitState {
    return this.state;
  }

  /**
   * Get circuit breaker statistics
   */
  getStats() {
    return {
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      nextAttemptTime: this.nextAttemptTime > 0
        ? new Date(this.nextAttemptTime).toISOString()
        : null,
    };
  }

  /**
   * Manually reset circuit breaker
   */
  reset(): void {
    this.state = CircuitState.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
    this.nextAttemptTime = 0;
    this.lastFailureTime = 0;

    logger.log('Circuit breaker manually reset', {
      state: this.state,
    });
  }

  /**
   * Update circuit breaker configuration
   */
  updateConfig(config: Partial<CircuitBreakerConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get circuit breaker configuration
   */
  getConfig(): CircuitBreakerConfig {
    return { ...this.config };
  }
}

/**
 * Create circuit breaker with custom config
 */
export function createCircuitBreaker(config?: Partial<CircuitBreakerConfig>): CircuitBreaker {
  return new CircuitBreaker(config);
}

/**
 * Default circuit breaker instance
 */
export const defaultCircuitBreaker = new CircuitBreaker();
