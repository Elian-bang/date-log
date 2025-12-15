/**
 * DateLogAdapter Unit Tests
 */

import { DateLogAdapter } from '../adapter';
import { RestaurantType } from '../types';
import type { DateEntryResponse } from '../types';
import type { DateLogData } from '../../../types';

describe('DateLogAdapter', () => {
  // ===== Test Data =====

  const mockBackendEntries: DateEntryResponse[] = [
    {
      id: 'entry-1',
      date: '2025-10-18',
      region: '삼송',
      cafes: [
        {
          id: 'cafe-1',
          name: '카페 테스트',
          memo: '분위기 좋음',
          image: undefined,
          link: 'https://map.kakao.com',
          visited: true,
          latitude: 37.6790,
          longitude: 126.9125,
          dateEntryId: 'entry-1',
          createdAt: '2025-10-18T10:00:00Z',
          updatedAt: '2025-10-18T10:00:00Z',
        },
      ],
      restaurants: [
        {
          id: 'restaurant-1',
          name: '이이요',
          type: RestaurantType.KOREAN,
          memo: '고등어정식',
          image: undefined,
          link: 'https://map.kakao.com',
          visited: true,
          latitude: 37.6790,
          longitude: 126.9125,
          dateEntryId: 'entry-1',
          createdAt: '2025-10-18T10:00:00Z',
          updatedAt: '2025-10-18T10:00:00Z',
        },
      ],
      spots: [],
      createdAt: '2025-10-18T10:00:00Z',
      updatedAt: '2025-10-18T10:00:00Z',
    },
    {
      id: 'entry-2',
      date: '2025-10-18',
      region: '은평',
      cafes: [],
      restaurants: [],
      spots: [
        {
          id: 'spot-1',
          name: '북한산',
          memo: undefined,
          image: undefined,
          link: 'https://map.kakao.com',
          visited: false,
          latitude: undefined,
          longitude: undefined,
          dateEntryId: 'entry-2',
          createdAt: '2025-10-18T10:00:00Z',
          updatedAt: '2025-10-18T10:00:00Z',
        },
      ],
      createdAt: '2025-10-18T10:00:00Z',
      updatedAt: '2025-10-18T10:00:00Z',
    },
  ];

  // ===== Backend → Frontend Tests =====

  describe('toFrontendModel', () => {
    it('should transform backend entries to frontend DateLogData', () => {
      const result = DateLogAdapter.toFrontendModel(mockBackendEntries);

      expect(result['2025-10-18']).toBeDefined();
      expect(result['2025-10-18'].regions).toHaveLength(2);
      expect(result['2025-10-18'].regions[0].name).toBe('삼송');
      expect(result['2025-10-18'].regions[1].name).toBe('은평');
    });

    it('should transform coordinates from latitude/longitude to lat/lng', () => {
      const result = DateLogAdapter.toFrontendModel(mockBackendEntries);
      const cafe = result['2025-10-18'].regions[0].categories.cafe[0];

      expect(cafe.coordinates).toEqual({ lat: 37.6790, lng: 126.9125 });
    });

    it('should handle missing coordinates (undefined)', () => {
      const result = DateLogAdapter.toFrontendModel(mockBackendEntries);
      const spot = result['2025-10-18'].regions[1].categories.spot[0];

      expect(spot.coordinates).toBeUndefined();
    });

    it('should transform restaurant types correctly', () => {
      const result = DateLogAdapter.toFrontendModel(mockBackendEntries);
      const restaurant = result['2025-10-18'].regions[0].categories.restaurant[0];

      expect(restaurant.type).toBe('한식');
    });

    it('should use backend ID as region ID', () => {
      const result = DateLogAdapter.toFrontendModel(mockBackendEntries);

      expect(result['2025-10-18'].regions[0].id).toBe('entry-1');
      expect(result['2025-10-18'].regions[1].id).toBe('entry-2');
    });

    it('should handle empty arrays', () => {
      const emptyEntries: DateEntryResponse[] = [];
      const result = DateLogAdapter.toFrontendModel(emptyEntries);

      expect(result).toEqual({});
    });
  });

  describe('toFrontendDateLog', () => {
    it('should transform single DateEntry to DateLog', () => {
      const result = DateLogAdapter.toFrontendDateLog(mockBackendEntries[0]);

      expect(result.date).toBe('2025-10-18');
      expect(result.regions).toHaveLength(1);
      expect(result.regions[0].name).toBe('삼송');
      expect(result.regions[0].categories.cafe).toHaveLength(1);
    });
  });

  // ===== Frontend → Backend Tests =====

  describe('toBackendCreateRequests', () => {
    it('should split multi-region DateLog into individual requests', () => {
      const frontendDateLog = {
        date: '2025-10-18',
        regions: [
          { id: 'temp-1', name: '삼송', categories: { cafe: [], restaurant: [], spot: [] } },
          { id: 'temp-2', name: '은평', categories: { cafe: [], restaurant: [], spot: [] } },
        ],
      };

      const result = DateLogAdapter.toBackendCreateRequests(frontendDateLog);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        date: '2025-10-18',
        region: '삼송',
        cafes: [],
        restaurants: [],
        spots: []
      });
      expect(result[1]).toEqual({
        date: '2025-10-18',
        region: '은평',
        cafes: [],
        restaurants: [],
        spots: []
      });
    });
  });

  describe('toBackendCafe', () => {
    it('should transform frontend Cafe to backend format', () => {
      const frontendCafe = {
        id: 'cafe-1',
        name: '카페 테스트',
        memo: '분위기 좋음',
        image: undefined,
        link: 'https://map.kakao.com',
        visited: true,
        coordinates: { lat: 37.6790, lng: 126.9125 },
      };

      const result = DateLogAdapter.toBackendCafe(frontendCafe);

      expect(result).toEqual({
        name: '카페 테스트',
        memo: '분위기 좋음',
        image: undefined,
        link: 'https://map.kakao.com',
        visited: true,
        latitude: 37.6790,
        longitude: 126.9125,
      });
    });

    it('should handle missing coordinates', () => {
      const frontendCafe = {
        id: 'cafe-1',
        name: '카페',
        link: 'https://map.kakao.com',
        visited: false,
      };

      const result = DateLogAdapter.toBackendCafe(frontendCafe);

      expect(result.latitude).toBeUndefined();
      expect(result.longitude).toBeUndefined();
    });
  });

  describe('toBackendRestaurant', () => {
    it('should transform restaurant type correctly', () => {
      const frontendRestaurant = {
        id: 'restaurant-1',
        name: '이이요',
        type: '한식' as const,
        link: 'https://map.kakao.com',
        visited: true,
      };

      const result = DateLogAdapter.toBackendRestaurant(frontendRestaurant);

      expect(result.type).toBe(RestaurantType.KOREAN);
    });

    it('should map 양식 to ALL (backend does not have 양식)', () => {
      const frontendRestaurant = {
        id: 'restaurant-1',
        name: '레스토랑',
        type: '양식' as const,
        link: 'https://map.kakao.com',
        visited: false,
      };

      const result = DateLogAdapter.toBackendRestaurant(frontendRestaurant);

      expect(result.type).toBe(RestaurantType.ALL);
    });
  });

  // ===== Utility Methods Tests =====

  describe('getUniqueRegions', () => {
    it('should extract unique region names', () => {
      const data: DateLogData = {
        '2025-10-18': {
          date: '2025-10-18',
          regions: [
            { id: '1', name: '삼송', categories: { cafe: [], restaurant: [], spot: [] } },
            { id: '2', name: '은평', categories: { cafe: [], restaurant: [], spot: [] } },
          ],
        },
        '2025-10-19': {
          date: '2025-10-19',
          regions: [
            { id: '3', name: '삼송', categories: { cafe: [], restaurant: [], spot: [] } },
          ],
        },
      };

      const result = DateLogAdapter.getUniqueRegions(data);

      expect(result).toEqual(['삼송', '은평']);
    });
  });

  describe('findDateEntryId', () => {
    it('should find DateEntry ID by date and region name', () => {
      const data: DateLogData = {
        '2025-10-18': {
          date: '2025-10-18',
          regions: [
            { id: 'entry-1', name: '삼송', categories: { cafe: [], restaurant: [], spot: [] } },
            { id: 'entry-2', name: '은평', categories: { cafe: [], restaurant: [], spot: [] } },
          ],
        },
      };

      const result = DateLogAdapter.findDateEntryId(data, '2025-10-18', '은평');

      expect(result).toBe('entry-2');
    });

    it('should return undefined if date not found', () => {
      const data: DateLogData = {};
      const result = DateLogAdapter.findDateEntryId(data, '2025-10-18', '삼송');

      expect(result).toBeUndefined();
    });

    it('should return undefined if region not found', () => {
      const data: DateLogData = {
        '2025-10-18': {
          date: '2025-10-18',
          regions: [
            { id: 'entry-1', name: '삼송', categories: { cafe: [], restaurant: [], spot: [] } },
          ],
        },
      };

      const result = DateLogAdapter.findDateEntryId(data, '2025-10-18', '은평');

      expect(result).toBeUndefined();
    });
  });

  describe('mergeDateLogData', () => {
    it('should merge existing data with new entries', () => {
      const existing: DateLogData = {
        '2025-10-17': {
          date: '2025-10-17',
          regions: [
            { id: 'old-1', name: '강남', categories: { cafe: [], restaurant: [], spot: [] } },
          ],
        },
      };

      const newEntries = [mockBackendEntries[0]];
      const result = DateLogAdapter.mergeDateLogData(existing, newEntries);

      expect(result['2025-10-17']).toBeDefined();
      expect(result['2025-10-18']).toBeDefined();
      expect(result['2025-10-18'].regions[0].name).toBe('삼송');
    });
  });
});
