import { DateLogData } from '@/types';
import { STORAGE_KEY, DEFAULT_DATA_PATH } from './constants';

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
      console.log(`Migrating old format data for date: ${dateKey}`);
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
    console.log('Data migration completed successfully');
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
      console.log('Loading data from localStorage');
      const data = JSON.parse(stored);
      const migratedData = migrateData(data);

      // Save migrated data back to localStorage
      localStorage.setItem(STORAGE_KEY, JSON.stringify(migratedData));
      return migratedData;
    }

    // If no localStorage data, fetch from JSON file
    console.log('Loading data from JSON file');
    const response = await fetch(DEFAULT_DATA_PATH);

    if (!response.ok) {
      throw new Error(`Failed to fetch data: ${response.statusText}`);
    }

    const data: DateLogData = await response.json();
    const migratedData = migrateData(data);

    // Save to localStorage for future use
    localStorage.setItem(STORAGE_KEY, JSON.stringify(migratedData));

    return migratedData;
  } catch (error) {
    console.error('Error loading initial data:', error);
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
    console.log('Data saved to localStorage');
  } catch (error) {
    console.error('Error saving data to localStorage:', error);

    // Check if quota exceeded
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      console.error('localStorage quota exceeded');
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
    console.log('localStorage cleared');

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
    console.error('Error resetting data:', error);
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
    console.error('Error checking storage quota:', error);
  }

  return {
    used,
    total,
    percentage: (used / total) * 100,
  };
};
