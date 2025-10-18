import { CategoryType, RestaurantType } from '@/types';

/**
 * Application Constants
 */

// localStorage key for date log data
export const STORAGE_KEY = 'dateLogData';

// Default JSON data file path
export const DEFAULT_DATA_PATH = '/data/courses.json';

// Category configurations
export const CATEGORY_CONFIG: Record<CategoryType, { label: string; icon: string }> = {
  cafe: {
    label: '카페',
    icon: '☕',
  },
  restaurant: {
    label: '음식점',
    icon: '🍽️',
  },
  spot: {
    label: '관광지',
    icon: '🏞️',
  },
};

// Restaurant type options
export const RESTAURANT_TYPES: RestaurantType[] = [
  '전체',
  '한식',
  '일식',
  '중식',
  '고기집',
  '양식',
  '기타',
];

// Color scheme (matching TailwindCSS config)
export const COLORS = {
  primary: '#FF6B9D',
  primaryLight: '#FFB3D1',
  primaryDark: '#CC5580',
  success: '#28A745',
  info: '#17A2B8',
  warning: '#FFC107',
  danger: '#DC3545',
};

// Map default configuration
export const MAP_CONFIG = {
  defaultCenter: {
    lat: 37.5665, // Seoul city center
    lng: 126.9780,
  },
  defaultZoom: 15,
};

// Date format patterns
export const DATE_FORMATS = {
  storage: 'yyyy-MM-dd',      // For localStorage keys and API
  display: 'yyyy.MM.dd',      // For UI display
  monthYear: 'yyyy년 MM월',   // For calendar header
};
