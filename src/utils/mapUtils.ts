import { CategoryType } from '@/types';

/**
 * Map Utility Functions
 * Helper functions for map markers and styling
 */

/**
 * Get marker color based on category
 */
export const getMarkerColor = (category: CategoryType): string => {
  switch (category) {
    case 'cafe':
      return '#8B4513'; // Brown for cafes
    case 'restaurant':
      return '#DC2626'; // Red for restaurants
    case 'spot':
      return '#2563EB'; // Blue for tourist spots
    default:
      return '#6B7280'; // Gray fallback
  }
};

/**
 * Get marker opacity based on visited status
 */
export const getMarkerOpacity = (visited: boolean): number => {
  return visited ? 1.0 : 0.5;
};

/**
 * Get category label in Korean
 */
export const getCategoryLabel = (category: CategoryType): string => {
  switch (category) {
    case 'cafe':
      return '카페';
    case 'restaurant':
      return '식당';
    case 'spot':
      return '관광지';
    default:
      return '';
  }
};

