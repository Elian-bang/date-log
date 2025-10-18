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

/**
 * Create custom marker HTML (unused - kept for reference)
 */
export const createMarkerHTML = (
  category: CategoryType,
  visited: boolean
): string => {
  const color = getMarkerColor(category);
  const opacity = getMarkerOpacity(visited);

  return `
    <div style="
      position: relative;
      cursor: pointer;
      transform: translate(-15px, -40px);
    ">
      <svg width="30" height="40" viewBox="0 0 30 40" style="filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));">
        <path
          d="M15 0C6.716 0 0 6.716 0 15c0 8.284 15 25 15 25s15-16.716 15-25C30 6.716 23.284 0 15 0z"
          fill="${color}"
          opacity="${opacity}"
        />
        <circle cx="15" cy="15" r="6" fill="white" opacity="${opacity}" />
      </svg>
      ${
        !visited
          ? `<div style="
          position: absolute;
          top: 8px;
          left: 50%;
          transform: translateX(-50%);
          width: 12px;
          height: 12px;
          border: 2px solid white;
          border-radius: 50%;
          background: transparent;
        "></div>`
          : ''
      }
    </div>
  `;
};

/**
 * Determine category from place type
 */
export const determineCategoryType = (place: any): CategoryType => {
  // Check if place is a Restaurant (has type property)
  if ('type' in place && place.type) {
    return 'restaurant';
  }
  // Try to infer from other properties if needed
  // For now, default to 'cafe' if no type (could be improved)
  return 'cafe';
};
