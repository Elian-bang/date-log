/**
 * LocalStorage-Integrated DateLog Hook
 * Manages date log data with localStorage-only implementation
 * Features: 5-state model, Promise wrapping for API compatibility, same interface as useDateLogAPI
 */

import { useState, useCallback, useRef } from 'react';
import { DateLogData, DateLog, CategoryType, Place, Restaurant, RegionSection, Categories } from '@/types';
import { logger } from '@/utils/logger';

/**
 * 5-State Model for LocalStorage Hook (API compatible)
 * - idle: Initial state, no data loaded yet
 * - loading: First-time data loading
 * - revalidating: Background refresh (simulated for localStorage)
 * - success: Data successfully loaded
 * - error: Error occurred
 */
export type ApiState = 'idle' | 'loading' | 'revalidating' | 'success' | 'error';

interface UseDateLogReturn {
  data: DateLogData;
  state: ApiState;
  loading: boolean;
  error: string | null;

  // Date operations
  addDate: (date: string, regionName: string) => Promise<void>;
  deleteDate: (date: string) => Promise<void>;
  getDateLog: (date: string) => DateLog | undefined;

  // Region operations
  addRegion: (date: string, regionName: string) => Promise<void>;
  updateRegionName: (date: string, regionId: string, newName: string) => Promise<void>;
  deleteRegion: (date: string, regionId: string) => Promise<void>;

  // Place operations
  addPlace: (
    date: string,
    regionId: string,
    category: CategoryType,
    place: Omit<Place, 'id'>
  ) => Promise<void>;
  updatePlace: (
    date: string,
    regionId: string,
    category: CategoryType,
    placeId: string,
    updates: Partial<Place>
  ) => Promise<void>;
  deletePlace: (date: string, regionId: string, category: CategoryType, placeId: string) => Promise<void>;
  toggleVisited: (date: string, regionId: string, category: CategoryType, placeId: string) => Promise<void>;

  // Utility operations
  refreshData: () => Promise<void>;
  loadMonthData: (year: number, month: number) => Promise<void>;
  revalidateDate: (date: string) => Promise<void>;
  clearError: () => void;
}

// LocalStorage key
const STORAGE_KEY = 'datelog-data';

export const useDateLog = (): UseDateLogReturn => {
  // 5-State Model
  const [data, setData] = useState<DateLogData>(() => {
    // Initialize from localStorage
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch (err) {
      logger.error('Failed to load from localStorage:', err);
      return {};
    }
  });
  const [state, setState] = useState<ApiState>('idle');
  const [error, setError] = useState<string | null>(null);

  // Previous state snapshot for rollback
  const previousDataRef = useRef<DateLogData>({});

  // Convenience flag for backward compatibility
  const loading = state === 'loading';

  // Helper: Save to localStorage
  const saveToStorage = useCallback((newData: DateLogData) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
      logger.log('Saved to localStorage', { dateCount: Object.keys(newData).length });
    } catch (err) {
      logger.error('Failed to save to localStorage:', err);
      throw new Error('로컬 저장소 저장 실패');
    }
  }, []);

  // Helper: Save current state snapshot for rollback
  const saveSnapshot = useCallback(() => {
    previousDataRef.current = JSON.parse(JSON.stringify(data));
  }, [data]);

  // Helper: Restore from snapshot
  const restoreSnapshot = useCallback(() => {
    setData(previousDataRef.current);
  }, []);

  // Helper: Set error with user-friendly message
  const handleError = useCallback((err: unknown, context: string) => {
    const message = err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다';
    setError(message);
    setState('error');
    logger.error(`${context}:`, err);
  }, []);

  // Helper: Wrap synchronous operations in Promise for API compatibility
  const wrapAsync = <T,>(fn: () => T): Promise<T> => {
    return new Promise((resolve, reject) => {
      try {
        const result = fn();
        resolve(result);
      } catch (err) {
        reject(err);
      }
    });
  };

  // Date operations
  const addDate = useCallback(async (date: string, regionName: string) => {
    saveSnapshot();

    try {
      setError(null);

      await wrapAsync(() => {
        const regionId = crypto.randomUUID();
        const emptyCategories: Categories = {
          cafe: [],
          restaurant: [],
          spot: []
        };

        const newRegion: RegionSection = {
          id: regionId,
          name: regionName,
          categories: emptyCategories
        };

        const newData = {
          ...data,
          [date]: {
            date,
            regions: [newRegion]
          }
        };

        setData(newData);
        saveToStorage(newData);

        logger.log('Date added', { date, regionName, regionId });
      });
    } catch (err) {
      restoreSnapshot();
      handleError(err, 'Failed to add date');
    }
  }, [data, saveSnapshot, restoreSnapshot, handleError, saveToStorage, wrapAsync]);

  const deleteDate = useCallback(async (date: string) => {
    saveSnapshot();

    try {
      setError(null);

      await wrapAsync(() => {
        const newData = { ...data };
        delete newData[date];

        setData(newData);
        saveToStorage(newData);

        logger.log('Date deleted', { date });
      });
    } catch (err) {
      restoreSnapshot();
      handleError(err, 'Failed to delete date');
    }
  }, [data, saveSnapshot, restoreSnapshot, handleError, saveToStorage, wrapAsync]);

  const getDateLog = useCallback((date: string): DateLog | undefined => {
    return data[date];
  }, [data]);

  // Region operations
  const addRegion = useCallback(async (date: string, regionName: string) => {
    saveSnapshot();

    try {
      setError(null);

      await wrapAsync(() => {
        const dateLog = data[date];
        if (!dateLog) {
          throw new Error('날짜를 찾을 수 없습니다');
        }

        const regionId = crypto.randomUUID();
        const emptyCategories: Categories = {
          cafe: [],
          restaurant: [],
          spot: []
        };

        const newRegion: RegionSection = {
          id: regionId,
          name: regionName,
          categories: emptyCategories
        };

        const newData = {
          ...data,
          [date]: {
            ...dateLog,
            regions: [...dateLog.regions, newRegion]
          }
        };

        setData(newData);
        saveToStorage(newData);

        logger.log('Region added', { date, regionName, regionId });
      });
    } catch (err) {
      restoreSnapshot();
      handleError(err, 'Failed to add region');
    }
  }, [data, saveSnapshot, restoreSnapshot, handleError, saveToStorage, wrapAsync]);

  const updateRegionName = useCallback(async (date: string, regionId: string, newName: string) => {
    saveSnapshot();

    try {
      setError(null);

      await wrapAsync(() => {
        const dateLog = data[date];
        if (!dateLog) {
          throw new Error('날짜를 찾을 수 없습니다');
        }

        const newData = {
          ...data,
          [date]: {
            ...dateLog,
            regions: dateLog.regions.map(region =>
              region.id === regionId
                ? { ...region, name: newName }
                : region
            )
          }
        };

        setData(newData);
        saveToStorage(newData);

        logger.log('Region name updated', { date, regionId, newName });
      });
    } catch (err) {
      restoreSnapshot();
      handleError(err, 'Failed to update region name');
    }
  }, [data, saveSnapshot, restoreSnapshot, handleError, saveToStorage, wrapAsync]);

  const deleteRegion = useCallback(async (date: string, regionId: string) => {
    saveSnapshot();

    try {
      setError(null);

      await wrapAsync(() => {
        const dateLog = data[date];
        if (!dateLog) {
          throw new Error('날짜를 찾을 수 없습니다');
        }

        const newData = {
          ...data,
          [date]: {
            ...dateLog,
            regions: dateLog.regions.filter(region => region.id !== regionId)
          }
        };

        setData(newData);
        saveToStorage(newData);

        logger.log('Region deleted', { date, regionId });
      });
    } catch (err) {
      restoreSnapshot();
      handleError(err, 'Failed to delete region');
    }
  }, [data, saveSnapshot, restoreSnapshot, handleError, saveToStorage, wrapAsync]);

  // Place operations
  const addPlace = useCallback(async (
    date: string,
    regionId: string,
    category: CategoryType,
    place: Omit<Place, 'id'>
  ) => {
    saveSnapshot();

    try {
      setError(null);

      await wrapAsync(() => {
        const dateLog = data[date];
        if (!dateLog) {
          throw new Error('날짜를 찾을 수 없습니다');
        }

        const placeId = crypto.randomUUID();
        const newPlace = { ...place, id: placeId } as Place | Restaurant;

        const newData = {
          ...data,
          [date]: {
            ...dateLog,
            regions: dateLog.regions.map(region => {
              if (region.id !== regionId) return region;

              return {
                ...region,
                categories: {
                  ...region.categories,
                  [category]: [...region.categories[category], newPlace]
                }
              };
            })
          }
        };

        setData(newData);
        saveToStorage(newData);

        logger.log('Place added', { date, regionId, category, placeId });
      });
    } catch (err) {
      restoreSnapshot();
      handleError(err, 'Failed to add place');
    }
  }, [data, saveSnapshot, restoreSnapshot, handleError, saveToStorage, wrapAsync]);

  const updatePlace = useCallback(async (
    date: string,
    regionId: string,
    category: CategoryType,
    placeId: string,
    updates: Partial<Place>
  ) => {
    saveSnapshot();

    try {
      setError(null);

      await wrapAsync(() => {
        const dateLog = data[date];
        if (!dateLog) {
          throw new Error('날짜를 찾을 수 없습니다');
        }

        const newData = {
          ...data,
          [date]: {
            ...dateLog,
            regions: dateLog.regions.map(region => {
              if (region.id !== regionId) return region;

              return {
                ...region,
                categories: {
                  ...region.categories,
                  [category]: region.categories[category].map(p =>
                    p.id === placeId ? { ...p, ...updates } : p
                  )
                }
              };
            })
          }
        };

        setData(newData);
        saveToStorage(newData);

        logger.log('Place updated', { date, regionId, category, placeId });
      });
    } catch (err) {
      restoreSnapshot();
      handleError(err, 'Failed to update place');
    }
  }, [data, saveSnapshot, restoreSnapshot, handleError, saveToStorage, wrapAsync]);

  const deletePlace = useCallback(async (
    date: string,
    regionId: string,
    category: CategoryType,
    placeId: string
  ) => {
    saveSnapshot();

    try {
      setError(null);

      await wrapAsync(() => {
        const dateLog = data[date];
        if (!dateLog) {
          throw new Error('날짜를 찾을 수 없습니다');
        }

        const newData = {
          ...data,
          [date]: {
            ...dateLog,
            regions: dateLog.regions.map(region => {
              if (region.id !== regionId) return region;

              return {
                ...region,
                categories: {
                  ...region.categories,
                  [category]: region.categories[category].filter(p => p.id !== placeId)
                }
              };
            })
          }
        };

        setData(newData);
        saveToStorage(newData);

        logger.log('Place deleted', { date, regionId, category, placeId });
      });
    } catch (err) {
      restoreSnapshot();
      handleError(err, 'Failed to delete place');
    }
  }, [data, saveSnapshot, restoreSnapshot, handleError, saveToStorage, wrapAsync]);

  const toggleVisited = useCallback(async (
    date: string,
    regionId: string,
    category: CategoryType,
    placeId: string
  ) => {
    saveSnapshot();

    try {
      setError(null);

      await wrapAsync(() => {
        const dateLog = data[date];
        if (!dateLog) {
          throw new Error('날짜를 찾을 수 없습니다');
        }

        const newData = {
          ...data,
          [date]: {
            ...dateLog,
            regions: dateLog.regions.map(region => {
              if (region.id !== regionId) return region;

              return {
                ...region,
                categories: {
                  ...region.categories,
                  [category]: region.categories[category].map(p =>
                    p.id === placeId ? { ...p, visited: !p.visited } : p
                  )
                }
              };
            })
          }
        };

        setData(newData);
        saveToStorage(newData);

        logger.log('Place visited toggled', { date, regionId, category, placeId });
      });
    } catch (err) {
      restoreSnapshot();
      handleError(err, 'Failed to toggle visited');
    }
  }, [data, saveSnapshot, restoreSnapshot, handleError, saveToStorage, wrapAsync]);

  // Utility operations
  const refreshData = useCallback(async () => {
    try {
      setState('revalidating');
      setError(null);

      await wrapAsync(() => {
        const stored = localStorage.getItem(STORAGE_KEY);
        const loadedData = stored ? JSON.parse(stored) : {};
        setData(loadedData);
        setState('success');

        logger.log('Data refreshed from localStorage', { dateCount: Object.keys(loadedData).length });
      });
    } catch (err) {
      handleError(err, 'Failed to refresh data');
    }
  }, [handleError, wrapAsync]);

  const loadMonthData = useCallback(async (year: number, month: number) => {
    // LocalStorage loads all data at once, so this is essentially a no-op
    // We simulate cache hit for API compatibility
    try {
      setError(null);

      await wrapAsync(() => {
        logger.log('Month data already loaded (localStorage)', { year, month });
      });
    } catch (err) {
      handleError(err, 'Failed to load month data');
    }
  }, [handleError, wrapAsync]);

  const revalidateDate = useCallback(async (date: string) => {
    try {
      // For localStorage, data is already loaded
      // This is essentially a no-op for API compatibility
      const hasExistingData = !!data[date];
      setState(hasExistingData ? 'revalidating' : 'loading');
      setError(null);

      await wrapAsync(() => {
        setState('success');
        logger.log('Date revalidated (localStorage)', { date, hasExistingData });
      });
    } catch (err) {
      handleError(err, 'Failed to revalidate date');
    }
  }, [data, handleError, wrapAsync]);

  const clearError = useCallback(() => {
    setError(null);
    if (state === 'error') {
      setState(Object.keys(data).length > 0 ? 'success' : 'idle');
    }
  }, [state, data]);

  return {
    data,
    state,
    loading,
    error,
    addDate,
    deleteDate,
    getDateLog,
    addRegion,
    updateRegionName,
    deleteRegion,
    addPlace,
    updatePlace,
    deletePlace,
    toggleVisited,
    refreshData,
    loadMonthData,
    revalidateDate,
    clearError
  };
};
