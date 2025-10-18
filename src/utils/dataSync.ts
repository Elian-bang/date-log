import { DateLogData } from '@/types';
import { STORAGE_KEY, DEFAULT_DATA_PATH } from './constants';
import { logger } from './logger';
import { extractCoordinatesFromUrl } from './coordinateParser';

/**
 * Data Synchronization Utilities
 * Handles loading, saving, and resetting date log data between localStorage and JSON file
 */

/**
 * Generate unique ID for migration
 */
const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Migrate coordinates for places that have links but no coordinates
 */
const migrateCoordinates = (data: DateLogData): DateLogData => {
  const migratedData: DateLogData = {};
  let coordinatesMigrated = 0;

  Object.keys(data).forEach((dateKey) => {
    const dateEntry = data[dateKey];

    migratedData[dateKey] = {
      ...dateEntry,
      regions: dateEntry.regions.map((region) => ({
        ...region,
        categories: {
          cafe: region.categories.cafe.map((place) => {
            if (!place.coordinates && place.link) {
              const coords = extractCoordinatesFromUrl(place.link);
              if (coords) {
                coordinatesMigrated++;
                logger.log(`Extracted coordinates for ${place.name}: ${coords.lat}, ${coords.lng}`);
                return { ...place, coordinates: coords };
              }
            }
            return place;
          }),
          restaurant: region.categories.restaurant.map((place) => {
            if (!place.coordinates && place.link) {
              const coords = extractCoordinatesFromUrl(place.link);
              if (coords) {
                coordinatesMigrated++;
                logger.log(`Extracted coordinates for ${place.name}: ${coords.lat}, ${coords.lng}`);
                return { ...place, coordinates: coords };
              }
            }
            return place;
          }),
          spot: region.categories.spot.map((place) => {
            if (!place.coordinates && place.link) {
              const coords = extractCoordinatesFromUrl(place.link);
              if (coords) {
                coordinatesMigrated++;
                logger.log(`Extracted coordinates for ${place.name}: ${coords.lat}, ${coords.lng}`);
                return { ...place, coordinates: coords };
              }
            }
            return place;
          }),
        },
      })),
    };
  });

  if (coordinatesMigrated > 0) {
    logger.log(`Coordinates migration completed: ${coordinatesMigrated} places updated`);
  }

  return migratedData;
};

/**
 * Migrate old data format (single region) to new format (multiple regions)
 * Old format: { date, region: string, categories }
 * New format: { date, regions: RegionSection[] }
 */
const migrateData = (data: any): DateLogData => {
  const migratedData: DateLogData = {};
  let migrationOccurred = false;

  Object.keys(data).forEach((dateKey) => {
    const dateEntry = data[dateKey];

    // Check if old format (has 'region' string instead of 'regions' array)
    if (dateEntry.region && !dateEntry.regions) {
      migrationOccurred = true;
      logger.log(`Migrating old format data for date: ${dateKey}`);
      migratedData[dateKey] = {
        date: dateEntry.date,
        regions: [
          {
            id: generateId(),
            name: dateEntry.region,
            categories: dateEntry.categories || {
              cafe: [],
              restaurant: [],
              spot: [],
            },
          },
        ],
      };
    } else {
      // Already in new format
      migratedData[dateKey] = dateEntry;
    }
  });

  if (migrationOccurred) {
    logger.log('Data migration completed successfully');
  }

  return migratedData;
};

/**
 * Load initial data from localStorage or JSON file
 * Priority: localStorage > JSON file
 */
export const loadInitialData = async (): Promise<DateLogData> => {
  try {
    // Try to load from localStorage first
    const stored = localStorage.getItem(STORAGE_KEY);

    if (stored) {
      logger.log('Loading data from localStorage');
      const data = JSON.parse(stored);
      let migratedData = migrateData(data);

      // Migrate coordinates from map links
      migratedData = migrateCoordinates(migratedData);

      // Save migrated data back to localStorage
      localStorage.setItem(STORAGE_KEY, JSON.stringify(migratedData));
      return migratedData;
    }

    // If no localStorage data, fetch from JSON file
    logger.log('Loading data from JSON file');
    const response = await fetch(DEFAULT_DATA_PATH);

    if (!response.ok) {
      throw new Error(`Failed to fetch data: ${response.statusText}`);
    }

    const data: DateLogData = await response.json();
    let migratedData = migrateData(data);

    // Migrate coordinates from map links
    migratedData = migrateCoordinates(migratedData);

    // Save to localStorage for future use
    localStorage.setItem(STORAGE_KEY, JSON.stringify(migratedData));

    return migratedData;
  } catch (error) {
    logger.error('Error loading initial data:', error);
    // Return empty data structure on error
    return {};
  }
};

/**
 * Save data to localStorage
 */
export const saveData = (data: DateLogData): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    logger.log('Data saved to localStorage');
  } catch (error) {
    logger.error('Error saving data to localStorage:', error);

    // Check if quota exceeded
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      logger.error('localStorage quota exceeded');
      alert('저장 공간이 부족합니다. 일부 데이터를 삭제해주세요.');
    }
  }
};

/**
 * Reset data to initial JSON file state
 * Clears localStorage and reloads from JSON file
 */
export const resetData = async (): Promise<DateLogData> => {
  try {
    // Clear localStorage
    localStorage.removeItem(STORAGE_KEY);
    logger.log('localStorage cleared');

    // Reload from JSON file
    const response = await fetch(DEFAULT_DATA_PATH);

    if (!response.ok) {
      throw new Error(`Failed to fetch data: ${response.statusText}`);
    }

    const data: DateLogData = await response.json();

    // Save fresh data to localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));

    return data;
  } catch (error) {
    logger.error('Error resetting data:', error);
    // Return empty data structure on error
    return {};
  }
};

/**
 * Check localStorage quota usage (estimate)
 */
export const checkStorageQuota = (): { used: number; total: number; percentage: number } => {
  let used = 0;
  let total = 5 * 1024 * 1024; // Typical 5MB limit

  try {
    // Calculate used space
    for (const key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        used += localStorage[key].length + key.length;
      }
    }
  } catch (error) {
    logger.error('Error checking storage quota:', error);
  }

  return {
    used,
    total,
    percentage: (used / total) * 100,
  };
};
