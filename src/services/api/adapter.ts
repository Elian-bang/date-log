/**
 * DateLog Adapter
 * Transforms data between frontend and backend models
 */

import type {
  DateLogData,
  DateLog,
  Cafe,
  Restaurant,
  Spot,
  Coordinates,
} from '../../types';

import type {
  DateEntryResponse,
  CreateDateEntryRequest,
  CafeResponse,
  RestaurantResponse,
  SpotResponse,
} from './types';

import { RestaurantType } from './types';

/**
 * DateLog Adapter for bidirectional data transformation
 */
export class DateLogAdapter {
  // ===== Backend → Frontend Transformations =====

  /**
   * Transform backend date entries to frontend DateLogData
   * Groups multiple DateEntry (single region each) into multi-region structure
   */
  static toFrontendModel(entries: DateEntryResponse[]): DateLogData {
    const grouped: DateLogData = {};

    entries.forEach((entry) => {
      // Initialize date entry if not exists
      if (!grouped[entry.date]) {
        grouped[entry.date] = {
          date: entry.date,
          regions: [],
        };
      }

      // Add region with its places
      grouped[entry.date].regions.push({
        id: entry.id, // Use backend UUID as region ID
        name: entry.region,
        categories: {
          cafe: entry.cafes.map(this.toCafe),
          restaurant: entry.restaurants.map(this.toRestaurant),
          spot: entry.spots.map(this.toSpot),
        },
      });
    });

    return grouped;
  }

  /**
   * Transform single backend DateEntry to frontend DateLog
   */
  static toFrontendDateLog(entry: DateEntryResponse): DateLog {
    return {
      date: entry.date,
      regions: [
        {
          id: entry.id,
          name: entry.region,
          categories: {
            cafe: entry.cafes.map(this.toCafe),
            restaurant: entry.restaurants.map(this.toRestaurant),
            spot: entry.spots.map(this.toSpot),
          },
        },
      ],
    };
  }

  /**
   * Transform backend Cafe to frontend Cafe
   * Public for use in hooks when processing API responses
   */
  public static toCafe(cafe: CafeResponse): Cafe {
    return {
      id: cafe.id,
      name: cafe.name,
      boyfriendMemo: cafe.boyfriendMemo || undefined,
      girlfriendMemo: cafe.girlfriendMemo || undefined,
      image: cafe.image || undefined,
      link: cafe.link || '',
      visited: cafe.visited,
      coordinates: DateLogAdapter.toCoordinates(cafe.latitude, cafe.longitude),
    };
  }

  /**
   * Transform backend Restaurant to frontend Restaurant
   * Public for use in hooks when processing API responses
   */
  public static toRestaurant(restaurant: RestaurantResponse): Restaurant {
    return {
      id: restaurant.id,
      name: restaurant.name,
      type: DateLogAdapter.toFrontendRestaurantType(restaurant.type),
      boyfriendMemo: restaurant.boyfriendMemo || undefined,
      girlfriendMemo: restaurant.girlfriendMemo || undefined,
      image: restaurant.image || undefined,
      link: restaurant.link || '',
      visited: restaurant.visited,
      coordinates: DateLogAdapter.toCoordinates(restaurant.latitude, restaurant.longitude),
    };
  }

  /**
   * Transform backend Spot to frontend Spot
   * Public for use in hooks when processing API responses
   */
  public static toSpot(spot: SpotResponse): Spot {
    return {
      id: spot.id,
      name: spot.name,
      boyfriendMemo: spot.boyfriendMemo || undefined,
      girlfriendMemo: spot.girlfriendMemo || undefined,
      image: spot.image || undefined,
      link: spot.link || '',
      visited: spot.visited,
      coordinates: DateLogAdapter.toCoordinates(spot.latitude, spot.longitude),
    };
  }

  /**
   * Transform backend latitude/longitude to frontend coordinates
   */
  private static toCoordinates(latitude?: number, longitude?: number): Coordinates | undefined {
    if (latitude !== undefined && latitude !== null && longitude !== undefined && longitude !== null) {
      return { lat: latitude, lng: longitude };
    }
    return undefined;
  }

  /**
   * Map backend RestaurantType to frontend type
   */
  private static toFrontendRestaurantType(type: RestaurantType): Restaurant['type'] {
    // Backend enum already uses Korean strings, direct mapping
    const typeMap: Record<string, Restaurant['type']> = {
      '한식': '한식',
      '일식': '일식',
      '중식': '중식',
      '고기집': '고기집',
      '전체': '전체',
    };

    return typeMap[type] || '기타';
  }

  // ===== Frontend → Backend Transformations =====

  /**
   * Transform frontend DateLog to backend CreateDateEntryRequest array
   * Splits multi-region structure into individual DateEntry creation requests
   */
  static toBackendCreateRequests(dateLog: DateLog): CreateDateEntryRequest[] {
    return dateLog.regions.map((region) => ({
      date: dateLog.date,
      region: region.name,
      cafes: region.categories.cafe.map((cafe) => this.toBackendCafe(cafe)),
      restaurants: region.categories.restaurant.map((restaurant) => this.toBackendRestaurant(restaurant)),
      spots: region.categories.spot.map((spot) => this.toBackendSpot(spot)),
    }));
  }

  /**
   * Transform single region to CreateDateEntryRequest
   */
  static toBackendCreateRequest(date: string, regionName: string): CreateDateEntryRequest {
    return {
      date,
      region: regionName,
    };
  }

  /**
   * Transform frontend Cafe to backend CreateCafeRequest
   */
  static toBackendCafe(cafe: Cafe): {
    name: string;
    boyfriendMemo?: string;
    girlfriendMemo?: string;
    image?: string;
    link?: string;
    visited?: boolean;
    latitude?: number;
    longitude?: number;
  } {
    return {
      name: cafe.name,
      boyfriendMemo: cafe.boyfriendMemo,
      girlfriendMemo: cafe.girlfriendMemo,
      image: cafe.image,
      link: cafe.link || undefined,
      visited: cafe.visited,
      latitude: cafe.coordinates?.lat,
      longitude: cafe.coordinates?.lng,
    };
  }

  /**
   * Transform frontend Restaurant to backend CreateRestaurantRequest
   */
  static toBackendRestaurant(restaurant: Restaurant): {
    name: string;
    type: RestaurantType;
    boyfriendMemo?: string;
    girlfriendMemo?: string;
    image?: string;
    link?: string;
    visited?: boolean;
    latitude?: number;
    longitude?: number;
  } {
    return {
      name: restaurant.name,
      type: this.toBackendRestaurantType(restaurant.type),
      boyfriendMemo: restaurant.boyfriendMemo,
      girlfriendMemo: restaurant.girlfriendMemo,
      image: restaurant.image,
      link: restaurant.link || undefined,
      visited: restaurant.visited,
      latitude: restaurant.coordinates?.lat,
      longitude: restaurant.coordinates?.lng,
    };
  }

  /**
   * Transform frontend Spot to backend CreateSpotRequest
   */
  static toBackendSpot(spot: Spot): {
    name: string;
    boyfriendMemo?: string;
    girlfriendMemo?: string;
    image?: string;
    link?: string;
    visited?: boolean;
    latitude?: number;
    longitude?: number;
  } {
    return {
      name: spot.name,
      boyfriendMemo: spot.boyfriendMemo,
      girlfriendMemo: spot.girlfriendMemo,
      image: spot.image,
      link: spot.link || undefined,
      visited: spot.visited,
      latitude: spot.coordinates?.lat,
      longitude: spot.coordinates?.lng,
    };
  }

  /**
   * Map frontend restaurant type to backend RestaurantType
   */
  private static toBackendRestaurantType(type: Restaurant['type']): RestaurantType {
    const typeMap: Record<Restaurant['type'], RestaurantType> = {
      '한식': RestaurantType.KOREAN,
      '일식': RestaurantType.JAPANESE,
      '중식': RestaurantType.CHINESE,
      '고기집': RestaurantType.MEAT,
      '전체': RestaurantType.ALL,
      '양식': RestaurantType.ALL, // Frontend has '양식' but backend doesn't, map to '전체'
      '기타': RestaurantType.ALL,
    };

    return typeMap[type] || RestaurantType.ALL;
  }

  // ===== Utility Methods =====

  /**
   * Merge date log data with proper region deduplication
   *
   * Merges new date entries with existing data while preserving all regions.
   * If a date already exists, new regions are appended to the existing regions array.
   * Duplicate region IDs are automatically filtered out to prevent duplication.
   *
   * @param existing - Current DateLogData state
   * @param newEntries - New date entries from backend API
   * @returns Merged DateLogData with all regions preserved
   *
   * @example
   * ```typescript
   * const existing = {
   *   '2025-01-25': {
   *     date: '2025-01-25',
   *     regions: [{ id: 'uuid1', name: '삼송', categories: {...} }]
   *   }
   * };
   * const newEntries = [
   *   { id: 'uuid2', date: '2025-01-25', region: '연신내', ... }
   * ];
   * const merged = DateLogAdapter.mergeDateLogData(existing, newEntries);
   * // Result:
   * // { '2025-01-25': {
   * //     regions: [
   * //       { id: 'uuid1', name: '삼송', ... },
   * //       { id: 'uuid2', name: '연신내', ... }
   * //     ]
   * //   }
   * // }
   * ```
   */
  static mergeDateLogData(existing: DateLogData, newEntries: DateEntryResponse[]): DateLogData {
    const newData = this.toFrontendModel(newEntries);
    const merged = { ...existing };

    Object.entries(newData).forEach(([date, newDateLog]) => {
      if (merged[date]) {
        // 기존 날짜가 있으면 regions 배열 병합
        const existingRegionIds = new Set(merged[date].regions.map((r) => r.id));
        const newRegions = newDateLog.regions.filter((r) => !existingRegionIds.has(r.id));

        merged[date] = {
          ...merged[date],
          regions: [...merged[date].regions, ...newRegions],
        };
      } else {
        // 새 날짜면 그대로 추가
        merged[date] = newDateLog;
      }
    });

    return merged;
  }

  /**
   * Extract all region names from DateLogData
   */
  static getUniqueRegions(data: DateLogData): string[] {
    const regions = new Set<string>();

    Object.values(data).forEach((dateLog) => {
      dateLog.regions.forEach((region) => {
        regions.add(region.name);
      });
    });

    return Array.from(regions).sort();
  }

  /**
   * Find DateEntry ID by date and region name
   */
  static findDateEntryId(data: DateLogData, date: string, regionName: string): string | undefined {
    const dateLog = data[date];
    if (!dateLog) return undefined;

    const region = dateLog.regions.find((r) => r.name === regionName);
    return region?.id;
  }
}
