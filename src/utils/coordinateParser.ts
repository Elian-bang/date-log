import { Coordinates } from '@/types';
import { logger } from './logger';

/**
 * Coordinate Parser Utility
 * Extracts coordinates from Naver Map and Kakao Map URLs
 */

/**
 * Parse Kakao Map URL to extract coordinates
 * Example URLs:
 * - https://map.kakao.com/?q=카페&lng=126.9780&lat=37.5665
 * - https://place.map.kakao.com/12345678?q=카페
 * - https://map.kakao.com/link/map/카페,37.5665,126.9780
 */
const parseKakaoMapUrl = (url: string): Coordinates | null => {
  try {
    // Pattern 1: URL parameters (lng, lat)
    const urlObj = new URL(url);
    const lat = urlObj.searchParams.get('lat');
    const lng = urlObj.searchParams.get('lng');

    if (lat && lng) {
      return {
        lat: parseFloat(lat),
        lng: parseFloat(lng),
      };
    }

    // Pattern 2: /link/map/ format
    const linkMatch = url.match(/\/link\/map\/[^,]+,([0-9.]+),([0-9.]+)/);
    if (linkMatch) {
      return {
        lat: parseFloat(linkMatch[1]),
        lng: parseFloat(linkMatch[2]),
      };
    }

    return null;
  } catch (error) {
    logger.error('Error parsing Kakao Map URL:', error);
    return null;
  }
};

/**
 * Parse Naver Map URL to extract coordinates
 * Example URLs:
 * - https://map.naver.com/v5/?c=126.9780,37.5665,15,0,0,0,dh
 * - https://map.naver.com/v5/entry/place/12345678
 * - https://naver.me/xABcDeFg (shortened URL - cannot extract)
 */
const parseNaverMapUrl = (url: string): Coordinates | null => {
  try {
    // Pattern 1: ?c= parameter format (lng,lat,zoom,...)
    const cParamMatch = url.match(/[?&]c=([0-9.]+),([0-9.]+)/);
    if (cParamMatch) {
      return {
        lng: parseFloat(cParamMatch[1]),
        lat: parseFloat(cParamMatch[2]),
      };
    }

    // Pattern 2: URL hash format #/entry/place/
    // Note: This doesn't contain coordinates, would need API call
    // For now, return null
    return null;
  } catch (error) {
    logger.error('Error parsing Naver Map URL:', error);
    return null;
  }
};

/**
 * Extract coordinates from map URL (Kakao or Naver)
 * Returns null if coordinates cannot be extracted
 */
export const extractCoordinatesFromUrl = (url: string): Coordinates | null => {
  if (!url || !url.trim()) {
    return null;
  }

  const trimmedUrl = url.trim();

  // Check if Kakao Map
  if (trimmedUrl.includes('kakao.com') || trimmedUrl.includes('kakaomap.com')) {
    return parseKakaoMapUrl(trimmedUrl);
  }

  // Check if Naver Map
  if (trimmedUrl.includes('naver.com') || trimmedUrl.includes('naver.me')) {
    return parseNaverMapUrl(trimmedUrl);
  }

  logger.warn('Unknown map URL format:', trimmedUrl);
  return null;
};

/**
 * Validate coordinates are within valid ranges
 * Korea latitude: ~33-43, longitude: ~124-132
 */
export const validateCoordinates = (coordinates: Coordinates | null): boolean => {
  if (!coordinates) {
    return false;
  }

  const { lat, lng } = coordinates;

  // Basic validation: ensure numbers
  if (typeof lat !== 'number' || typeof lng !== 'number') {
    return false;
  }

  // Check if coordinates are finite
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return false;
  }

  // Validate Korea region (rough bounds)
  if (lat < 33 || lat > 43 || lng < 124 || lng > 132) {
    logger.warn('Coordinates outside Korea region:', coordinates);
    // Still return true - might be international location
  }

  return true;
};
