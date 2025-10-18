/**
 * DateLog Application Type Definitions
 */

// Coordinate interface for map locations
export interface Coordinates {
  lat: number;
  lng: number;
}

// Base place interface
export interface Place {
  id: string;
  name: string;
  memo?: string;
  image?: string;
  link: string;
  visited: boolean;
  coordinates?: Coordinates;
}

// Cafe extends Place (no additional properties)
export interface Cafe extends Place {}

// Restaurant extends Place with type classification
export interface Restaurant extends Place {
  type: '전체' | '한식' | '일식' | '중식' | '고기집' | '양식' | '기타';
}

// Spot (tourist spot) extends Place (no additional properties)
export interface Spot extends Place {}

// Categories container for all place types
export interface Categories {
  cafe: Cafe[];
  restaurant: Restaurant[];
  spot: Spot[];
}

// Single date log entry
export interface DateLog {
  date: string;           // YYYY-MM-DD format
  region: string;         // 동네명
  categories: Categories;
}

// Complete data structure (key: date string)
export interface DateLogData {
  [date: string]: DateLog;
}

// Type unions for easier type checking
export type CategoryType = 'cafe' | 'restaurant' | 'spot';
export type RestaurantType = '전체' | '한식' | '일식' | '중식' | '고기집' | '양식' | '기타';

// Form data types
export interface PlaceFormData {
  name: string;
  memo?: string;
  image?: string;
  link: string;
  type?: RestaurantType; // Only for restaurants
}
