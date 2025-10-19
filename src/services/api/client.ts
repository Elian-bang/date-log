/**
 * API Client
 * HTTP client for backend API communication
 */

import { getApiConfig, ErrorMessages } from '../config/api.config';
import type {
  ApiResponse,
  ApiError,
  DateEntryResponse,
  CreateDateEntryRequest,
  UpdateDateEntryRequest,
  DateEntryFilters,
  CafeResponse,
  CreateCafeRequest,
  UpdateCafeRequest,
  RestaurantResponse,
  CreateRestaurantRequest,
  UpdateRestaurantRequest,
  SpotResponse,
  CreateSpotRequest,
  UpdateSpotRequest,
} from './types';

/**
 * Custom API Error class
 */
export class ApiClientError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: string | Record<string, unknown>,
    public timestamp?: string
  ) {
    super(message);
    this.name = 'ApiClientError';
  }
}

/**
 * API Client class for backend communication
 */
export class ApiClient {
  private baseURL: string;
  private timeout: number;
  private retryAttempts: number;
  private retryDelay: number;

  constructor() {
    const config = getApiConfig();
    this.baseURL = config.baseURL;
    this.timeout = config.timeout;
    this.retryAttempts = config.retryAttempts;
    this.retryDelay = config.retryDelay;
  }

  // ===== Private Helper Methods =====

  /**
   * Build full URL with query parameters
   */
  private buildURL(endpoint: string, params?: Record<string, string | number | boolean | undefined>): string {
    const url = new URL(`${this.baseURL}${endpoint}`);

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    return url.toString();
  }

  /**
   * Create AbortController for timeout
   */
  private createAbortController(): AbortController {
    const controller = new AbortController();
    setTimeout(() => controller.abort(), this.timeout);
    return controller;
  }

  /**
   * Map HTTP status code to Korean error message
   */
  private getErrorMessage(status: number): string {
    switch (status) {
      case 400:
        return ErrorMessages.BAD_REQUEST;
      case 401:
        return ErrorMessages.UNAUTHORIZED;
      case 403:
        return ErrorMessages.FORBIDDEN;
      case 404:
        return ErrorMessages.NOT_FOUND;
      case 500:
      case 502:
      case 503:
        return ErrorMessages.SERVER_ERROR;
      default:
        return ErrorMessages.UNKNOWN;
    }
  }

  /**
   * Handle API errors
   */
  private handleError(error: unknown): never {
    // Network error or timeout
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new ApiClientError(ErrorMessages.TIMEOUT, 'TIMEOUT');
      }
      throw new ApiClientError(ErrorMessages.NETWORK_ERROR, 'NETWORK_ERROR', error.message);
    }

    // Unknown error
    throw new ApiClientError(ErrorMessages.UNKNOWN, 'UNKNOWN');
  }

  /**
   * Parse and validate API response
   */
  private async parseResponse<T>(response: Response): Promise<T> {
    // Handle non-OK responses
    if (!response.ok) {
      let errorData: ApiError | undefined;

      try {
        errorData = await response.json();
      } catch {
        // If JSON parsing fails, use default error message
      }

      throw new ApiClientError(
        errorData?.message || this.getErrorMessage(response.status),
        errorData?.code || `HTTP_${response.status}`,
        errorData?.details,
        errorData?.timestamp
      );
    }

    // Parse successful response
    try {
      const data: ApiResponse<T> = await response.json();
      return data.data;
    } catch (error) {
      throw new ApiClientError(
        ErrorMessages.UNKNOWN,
        'PARSE_ERROR',
        error instanceof Error ? error.message : undefined
      );
    }
  }

  /**
   * Retry logic with exponential backoff
   */
  private async withRetry<T>(
    operation: () => Promise<T>,
    attempt: number = 0
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      // Don't retry on client errors (400-499)
      if (error instanceof ApiClientError && error.code.startsWith('HTTP_4')) {
        throw error;
      }

      // Retry on network errors and server errors
      if (attempt < this.retryAttempts) {
        const delay = this.retryDelay * Math.pow(2, attempt); // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.withRetry(operation, attempt + 1);
      }

      throw error;
    }
  }

  // ===== Generic HTTP Methods =====

  /**
   * HTTP GET request
   */
  async get<T>(endpoint: string, params?: Record<string, string | number | boolean | undefined>): Promise<T> {
    return this.withRetry(async () => {
      const controller = this.createAbortController();
      const url = this.buildURL(endpoint, params);

      try {
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          signal: controller.signal,
        });

        return await this.parseResponse<T>(response);
      } catch (error) {
        return this.handleError(error);
      }
    });
  }

  /**
   * HTTP POST request
   */
  async post<T>(endpoint: string, body: unknown): Promise<T> {
    return this.withRetry(async () => {
      const controller = this.createAbortController();
      const url = this.buildURL(endpoint);

      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
          signal: controller.signal,
        });

        return await this.parseResponse<T>(response);
      } catch (error) {
        return this.handleError(error);
      }
    });
  }

  /**
   * HTTP PUT request
   */
  async put<T>(endpoint: string, body: unknown): Promise<T> {
    return this.withRetry(async () => {
      const controller = this.createAbortController();
      const url = this.buildURL(endpoint);

      try {
        const response = await fetch(url, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
          signal: controller.signal,
        });

        return await this.parseResponse<T>(response);
      } catch (error) {
        return this.handleError(error);
      }
    });
  }

  /**
   * HTTP DELETE request
   */
  async delete(endpoint: string): Promise<void> {
    return this.withRetry(async () => {
      const controller = this.createAbortController();
      const url = this.buildURL(endpoint);

      try {
        const response = await fetch(url, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          signal: controller.signal,
        });

        if (!response.ok) {
          await this.parseResponse<void>(response);
        }
      } catch (error) {
        return this.handleError(error);
      }
    });
  }

  // ===== Date Entry Operations =====

  /**
   * Get all date entries with optional filters
   */
  async getDateEntries(filters?: DateEntryFilters): Promise<DateEntryResponse[]> {
    return this.get<DateEntryResponse[]>('/dates', filters);
  }

  /**
   * Get a single date entry by date
   */
  async getDateByDate(date: string): Promise<DateEntryResponse> {
    return this.get<DateEntryResponse>(`/dates/by-date/${date}`);
  }

  /**
   * Get a single date entry by ID
   */
  async getDateById(id: string): Promise<DateEntryResponse> {
    return this.get<DateEntryResponse>(`/dates/${id}`);
  }

  /**
   * Create a new date entry
   */
  async createDateEntry(data: CreateDateEntryRequest): Promise<DateEntryResponse> {
    return this.post<DateEntryResponse>('/dates', data);
  }

  /**
   * Update a date entry
   */
  async updateDateEntry(id: string, data: UpdateDateEntryRequest): Promise<DateEntryResponse> {
    return this.put<DateEntryResponse>(`/dates/${id}`, data);
  }

  /**
   * Delete a date entry
   */
  async deleteDateEntry(id: string): Promise<void> {
    return this.delete(`/dates/${id}`);
  }

  // ===== Cafe Operations =====

  /**
   * Create a new cafe
   */
  async createCafe(dateEntryId: string, data: CreateCafeRequest): Promise<CafeResponse> {
    return this.post<CafeResponse>(`/dates/${dateEntryId}/cafes`, data);
  }

  /**
   * Update a cafe
   */
  async updateCafe(id: string, data: UpdateCafeRequest): Promise<CafeResponse> {
    return this.put<CafeResponse>(`/cafes/${id}`, data);
  }

  /**
   * Delete a cafe
   */
  async deleteCafe(id: string): Promise<void> {
    return this.delete(`/cafes/${id}`);
  }

  // ===== Restaurant Operations =====

  /**
   * Create a new restaurant
   */
  async createRestaurant(dateEntryId: string, data: CreateRestaurantRequest): Promise<RestaurantResponse> {
    return this.post<RestaurantResponse>(`/dates/${dateEntryId}/restaurants`, data);
  }

  /**
   * Update a restaurant
   */
  async updateRestaurant(id: string, data: UpdateRestaurantRequest): Promise<RestaurantResponse> {
    return this.put<RestaurantResponse>(`/restaurants/${id}`, data);
  }

  /**
   * Delete a restaurant
   */
  async deleteRestaurant(id: string): Promise<void> {
    return this.delete(`/restaurants/${id}`);
  }

  // ===== Spot Operations =====

  /**
   * Create a new spot
   */
  async createSpot(dateEntryId: string, data: CreateSpotRequest): Promise<SpotResponse> {
    return this.post<SpotResponse>(`/dates/${dateEntryId}/spots`, data);
  }

  /**
   * Update a spot
   */
  async updateSpot(id: string, data: UpdateSpotRequest): Promise<SpotResponse> {
    return this.put<SpotResponse>(`/spots/${id}`, data);
  }

  /**
   * Delete a spot
   */
  async deleteSpot(id: string): Promise<void> {
    return this.delete(`/spots/${id}`);
  }
}

// Export singleton instance
export const apiClient = new ApiClient();
