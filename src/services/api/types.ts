/**
 * API Type Definitions
 * Types for backend API communication
 */

// ===== API Response Types =====

/**
 * Standard API success response
 */
export interface ApiResponse<T> {
  data: T;
  meta?: PaginationMeta;
  links?: {
    self?: string;
    next?: string;
    prev?: string;
    first?: string;
    last?: string;
  };
}

/**
 * Standard API error response
 */
export interface ApiError {
  code: string;
  message: string;
  details?: string | Record<string, unknown>;
  timestamp: string;
}

/**
 * Pagination metadata
 */
export interface PaginationMeta {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

// ===== Date Entry Types =====

/**
 * Date Entry response from backend
 */
export interface DateEntryResponse {
  id: string;
  date: string; // YYYY-MM-DD
  region: string;
  cafes: CafeResponse[];
  restaurants: RestaurantResponse[];
  spots: SpotResponse[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Date Entry creation request
 */
export interface CreateDateEntryRequest {
  date: string; // YYYY-MM-DD
  region: string;
  cafes?: CreateCafeRequest[];
  restaurants?: CreateRestaurantRequest[];
  spots?: CreateSpotRequest[];
}

/**
 * Date Entry update request
 */
export interface UpdateDateEntryRequest {
  date?: string;
  region?: string;
}

/**
 * Date Entry query filters
 */
export interface DateEntryFilters {
  startDate?: string;
  endDate?: string;
  region?: string;
  page?: number;
  limit?: number;
}

// ===== Cafe Types =====

/**
 * Cafe response from backend
 */
export interface CafeResponse {
  id: string;
  name: string;
  boyfriendMemo?: string;
  girlfriendMemo?: string;
  image?: string;
  link?: string;
  visited: boolean;
  latitude?: number;
  longitude?: number;
  dateEntryId: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Cafe creation request
 */
export interface CreateCafeRequest {
  name: string;
  boyfriendMemo?: string;
  girlfriendMemo?: string;
  image?: string;
  link?: string;
  visited?: boolean;
  latitude?: number;
  longitude?: number;
}

/**
 * Cafe update request
 */
export interface UpdateCafeRequest {
  name?: string;
  boyfriendMemo?: string;
  girlfriendMemo?: string;
  image?: string;
  link?: string;
  visited?: boolean;
  latitude?: number;
  longitude?: number;
}

// ===== Restaurant Types =====

/**
 * Restaurant type enum (backend format)
 */
export enum RestaurantType {
  KOREAN = '한식',
  JAPANESE = '일식',
  CHINESE = '중식',
  MEAT = '고기집',
  ALL = '전체',
}

/**
 * Restaurant response from backend
 */
export interface RestaurantResponse {
  id: string;
  name: string;
  type: RestaurantType;
  boyfriendMemo?: string;
  girlfriendMemo?: string;
  image?: string;
  link?: string;
  visited: boolean;
  latitude?: number;
  longitude?: number;
  dateEntryId: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Restaurant creation request
 */
export interface CreateRestaurantRequest {
  name: string;
  type: RestaurantType;
  boyfriendMemo?: string;
  girlfriendMemo?: string;
  image?: string;
  link?: string;
  visited?: boolean;
  latitude?: number;
  longitude?: number;
}

/**
 * Restaurant update request
 */
export interface UpdateRestaurantRequest {
  name?: string;
  type?: RestaurantType;
  boyfriendMemo?: string;
  girlfriendMemo?: string;
  image?: string;
  link?: string;
  visited?: boolean;
  latitude?: number;
  longitude?: number;
}

// ===== Spot Types =====

/**
 * Spot response from backend
 */
export interface SpotResponse {
  id: string;
  name: string;
  boyfriendMemo?: string;
  girlfriendMemo?: string;
  image?: string;
  link?: string;
  visited: boolean;
  latitude?: number;
  longitude?: number;
  dateEntryId: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Spot creation request
 */
export interface CreateSpotRequest {
  name: string;
  boyfriendMemo?: string;
  girlfriendMemo?: string;
  image?: string;
  link?: string;
  visited?: boolean;
  latitude?: number;
  longitude?: number;
}

/**
 * Spot update request
 */
export interface UpdateSpotRequest {
  name?: string;
  boyfriendMemo?: string;
  girlfriendMemo?: string;
  image?: string;
  link?: string;
  visited?: boolean;
  latitude?: number;
  longitude?: number;
}
