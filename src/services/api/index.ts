/**
 * API Service Module
 * Exports all API-related functionality
 */

export { ApiClient, apiClient, ApiClientError } from './client';
export { DateLogAdapter } from './adapter';
export type {
  ApiResponse,
  ApiError,
  PaginationMeta,
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
  RestaurantType,
} from './types';
export { RestaurantType as RestaurantTypeEnum } from './types';
