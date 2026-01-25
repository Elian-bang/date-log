/**
 * API-Integrated DateLog Hook
 * Manages date log data with backend REST API integration
 * Features: 5-state model, retry strategy, optimistic updates with rollback, error classification
 */

import { useState, useCallback, useRef } from 'react';
import { DateLogData, DateLog, CategoryType, Place, Restaurant } from '@/types';
import { apiClient, DateLogAdapter } from '@/services/api';
import { DateEntryFilters } from '@/services/api/types';
import { logger } from '@/utils/logger';
import { defaultRetryStrategy } from '@/services/api/retry/RetryStrategy';
import { errorClassifier } from '@/services/api/errors/ErrorClassifier';

/**
 * 5-State Model for API Hook
 * - idle: Initial state, no data loaded yet
 * - loading: First-time data loading
 * - revalidating: Background refresh while showing stale data
 * - success: Data successfully loaded
 * - error: Error occurred
 */
export type ApiState = 'idle' | 'loading' | 'revalidating' | 'success' | 'error';

interface UseDateLogAPIReturn {
  data: DateLogData;
  state: ApiState;
  loading: boolean; // Convenience flag: state === 'loading'
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
  refreshData: (filters?: DateEntryFilters) => Promise<void>;
  loadMonthData: (year: number, month: number) => Promise<void>;
  revalidateDate: (date: string) => Promise<void>;
  clearError: () => void;
}

export const useDateLogAPI = (): UseDateLogAPIReturn => {
  // 5-State Model
  const [data, setData] = useState<DateLogData>({});
  const [state, setState] = useState<ApiState>('idle');
  const [error, setError] = useState<string | null>(null);

  // Previous state snapshot for rollback
  const previousDataRef = useRef<DateLogData>({});

  // Smart Caching - Track loaded months to prevent duplicate API calls
  const loadedMonthsRef = useRef(new Set<string>());

  // Convenience flag for backward compatibility
  const loading = state === 'loading';

  // Helper: Find region name by ID
  const findRegionNameById = useCallback((date: string, regionId: string): string | undefined => {
    const dateLog = data[date];
    if (!dateLog) return undefined;
    const region = dateLog.regions.find((r) => r.id === regionId);
    return region?.name;
  }, [data]);

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
    const userMessage = errorClassifier.getUserMessage(err);
    setError(userMessage);
    setState('error');
    logger.error(`${context}:`, {
      error: err,
      userMessage,
      severity: errorClassifier.getSeverity(err),
    });
  }, []);

  // Load data from API with optional filters
  const loadData = useCallback(async (filters?: DateEntryFilters) => {
    try {
      // Determine if this is initial load or revalidation
      const isRevalidating = Object.keys(data).length > 0;
      setState(isRevalidating ? 'revalidating' : 'loading');
      setError(null);

      // Execute with retry strategy
      const entries = await defaultRetryStrategy.execute(
        () => apiClient.getDateEntries(filters),
        'loadData'
      );

      // Merge new data with existing data instead of replacing
      setData(prev => DateLogAdapter.mergeDateLogData(prev, entries));
      setState('success');

      logger.log('Data loaded successfully', {
        entryCount: entries.length,
        filters,
        state: isRevalidating ? 'revalidating' : 'loading',
        action: 'merge'
      });
    } catch (err) {
      handleError(err, 'Failed to load data');
    }
  }, [data, handleError]);

  // Date operations
  const addDate = useCallback(async (date: string, regionName: string) => {
    // Save snapshot before optimistic update
    saveSnapshot();

    try {
      setError(null);

      // Optimistic update
      const tempId = `temp-${Date.now()}`;
      setData((prev) => ({
        ...prev,
        [date]: {
          date,
          regions: [
            {
              id: tempId,
              name: regionName,
              categories: { cafe: [], restaurant: [], spot: [] },
            },
          ],
        },
      }));

      // API call with retry strategy
      const newEntry = await defaultRetryStrategy.execute(
        () => apiClient.createDateEntry({ date, region: regionName }),
        'addDate'
      );

      // Update with real data
      setData((prev) => {
        const updated = DateLogAdapter.mergeDateLogData(prev, [newEntry]);
        // Remove temp entry if it exists
        if (updated[date]) {
          updated[date].regions = updated[date].regions.filter(r => r.id !== tempId);
        }
        return updated;
      });

      // Invalidate cache for this month
      const dateObj = new Date(date);
      const key = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`;
      loadedMonthsRef.current.delete(key);

      logger.log('Date added successfully', { date, regionName, cacheInvalidated: key });
    } catch (err) {
      // Rollback to snapshot
      restoreSnapshot();
      handleError(err, 'Failed to add date');
      throw err;
    }
  }, [saveSnapshot, restoreSnapshot, handleError]);

  const deleteDate = useCallback(async (date: string) => {
    const dateLog = data[date];
    if (!dateLog) return;

    // Save snapshot before optimistic update
    saveSnapshot();

    try {
      setError(null);

      // Optimistic update
      setData((prev) => {
        const newData = { ...prev };
        delete newData[date];
        return newData;
      });

      // Delete all regions for this date with retry strategy
      const deletePromises = dateLog.regions.map(region =>
        defaultRetryStrategy.execute(
          () => apiClient.deleteDateEntry(region.id),
          'deleteDate'
        )
      );
      await Promise.all(deletePromises);

      // Invalidate cache for this month
      const dateObj = new Date(date);
      const key = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`;
      loadedMonthsRef.current.delete(key);

      logger.log('Date deleted successfully', { date, cacheInvalidated: key });
    } catch (err) {
      // Rollback to snapshot
      restoreSnapshot();
      handleError(err, 'Failed to delete date');
      throw err;
    }
  }, [data, saveSnapshot, restoreSnapshot, handleError]);

  const getDateLog = useCallback((date: string): DateLog | undefined => {
    return data[date];
  }, [data]);

  // Region operations
  const addRegion = useCallback(async (date: string, regionName: string) => {
    if (!data[date]) return;

    // Save snapshot before optimistic update
    saveSnapshot();

    // Generate tempId outside try block so it's accessible in catch
    const tempId = `temp-${Date.now()}`;

    try {
      setError(null);

      // Optimistic update
      setData((prev) => ({
        ...prev,
        [date]: {
          ...prev[date],
          regions: [
            ...prev[date].regions,
            {
              id: tempId,
              name: regionName,
              categories: { cafe: [], restaurant: [], spot: [] },
            },
          ],
        },
      }));

      // API call with retry strategy
      const newEntry = await defaultRetryStrategy.execute(
        () => apiClient.createDateEntry({ date, region: regionName }),
        'addRegion'
      );

      // Update with real data
      setData((prev) => {
        const updated = DateLogAdapter.mergeDateLogData(prev, [newEntry]);
        // Remove temp region if it exists
        if (updated[date]) {
          updated[date].regions = updated[date].regions.filter(r => r.id !== tempId);
        }
        return updated;
      });

      // Invalidate cache for this month
      const dateObj = new Date(date);
      const key = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`;
      loadedMonthsRef.current.delete(key);

      logger.log('Region added successfully', { date, regionName, cacheInvalidated: key });
    } catch (err) {
      // Rollback to snapshot
      restoreSnapshot();
      handleError(err, 'Failed to add region');
      throw err;
    }
  }, [data, saveSnapshot, restoreSnapshot, handleError]);

  const updateRegionName = useCallback(async (date: string, regionId: string, newName: string) => {
    if (!data[date]) return;

    const oldName = findRegionNameById(date, regionId);
    if (!oldName) return;

    // Save snapshot before optimistic update
    saveSnapshot();

    try {
      setError(null);

      // Optimistic update
      setData((prev) => ({
        ...prev,
        [date]: {
          ...prev[date],
          regions: prev[date].regions.map((region) =>
            region.id === regionId ? { ...region, name: newName } : region
          ),
        },
      }));

      // API call with retry strategy
      await defaultRetryStrategy.execute(
        () => apiClient.updateDateEntry(regionId, { region: newName }),
        'updateRegionName'
      );

      logger.log('Region name updated successfully', { date, regionId, newName });
    } catch (err) {
      // Rollback to snapshot
      restoreSnapshot();
      handleError(err, 'Failed to update region name');
      throw err;
    }
  }, [data, findRegionNameById, saveSnapshot, restoreSnapshot, handleError]);

  const deleteRegion = useCallback(async (date: string, regionId: string) => {
    if (!data[date]) return;

    const regionToDelete = data[date].regions.find(r => r.id === regionId);
    if (!regionToDelete) return;

    // Save snapshot before optimistic update
    saveSnapshot();

    try {
      setError(null);

      // Optimistic update
      setData((prev) => ({
        ...prev,
        [date]: {
          ...prev[date],
          regions: prev[date].regions.filter((region) => region.id !== regionId),
        },
      }));

      // API call with retry strategy
      await defaultRetryStrategy.execute(
        () => apiClient.deleteDateEntry(regionId),
        'deleteRegion'
      );

      // Invalidate cache for this month
      const dateObj = new Date(date);
      const key = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`;
      loadedMonthsRef.current.delete(key);

      logger.log('Region deleted successfully', { date, regionId, cacheInvalidated: key });
    } catch (err) {
      // Rollback to snapshot
      restoreSnapshot();
      handleError(err, 'Failed to delete region');
      throw err;
    }
  }, [data, saveSnapshot, restoreSnapshot, handleError]);

  // Place operations
  const addPlace = useCallback(async (
    date: string,
    regionId: string,
    category: CategoryType,
    place: Omit<Place, 'id'>
  ) => {
    if (!data[date]) return;

    // Save snapshot before optimistic update
    saveSnapshot();

    // Generate tempId outside try block so it's accessible in catch
    const tempId = `temp-${Date.now()}`;
    const tempPlace = { ...place, id: tempId } as Place | Restaurant;

    try {
      setError(null);

      // Optimistic update
      setData((prev) => ({
        ...prev,
        [date]: {
          ...prev[date],
          regions: prev[date].regions.map((region) =>
            region.id === regionId
              ? {
                  ...region,
                  categories: {
                    ...region.categories,
                    [category]: [...region.categories[category], tempPlace],
                  },
                }
              : region
          ),
        },
      }));

      // API call with retry strategy - properly typed for each category
      let frontendPlace;
      if (category === 'cafe') {
        const placeData = DateLogAdapter.toBackendCafe(place as Place);
        const newPlace = await defaultRetryStrategy.execute(
          () => apiClient.createCafe(regionId, placeData),
          'addPlace:cafe'
        );
        frontendPlace = DateLogAdapter.toCafe(newPlace);
      } else if (category === 'restaurant') {
        const placeData = DateLogAdapter.toBackendRestaurant(place as Restaurant);
        const newPlace = await defaultRetryStrategy.execute(
          () => apiClient.createRestaurant(regionId, placeData),
          'addPlace:restaurant'
        );
        frontendPlace = DateLogAdapter.toRestaurant(newPlace);
      } else {
        const placeData = DateLogAdapter.toBackendSpot(place as Place);
        const newPlace = await defaultRetryStrategy.execute(
          () => apiClient.createSpot(regionId, placeData),
          'addPlace:spot'
        );
        frontendPlace = DateLogAdapter.toSpot(newPlace);
      }

      // Update with real data
      setData((prev) => ({
        ...prev,
        [date]: {
          ...prev[date],
          regions: prev[date].regions.map((region) =>
            region.id === regionId
              ? {
                  ...region,
                  categories: {
                    ...region.categories,
                    [category]: region.categories[category].map(p =>
                      p.id === tempId ? frontendPlace : p
                    ),
                  },
                }
              : region
          ),
        },
      }));

      logger.log('Place added successfully', { date, regionId, category });
    } catch (err) {
      // Rollback to snapshot
      restoreSnapshot();
      handleError(err, 'Failed to add place');
      throw err;
    }
  }, [data, saveSnapshot, restoreSnapshot, handleError]);

  const updatePlace = useCallback(async (
    date: string,
    regionId: string,
    category: CategoryType,
    placeId: string,
    updates: Partial<Place>
  ) => {
    if (!data[date]) return;

    // Get current place data for validation
    const region = data[date].regions.find(r => r.id === regionId);
    if (!region) return;
    const oldPlace = region.categories[category].find(p => p.id === placeId);
    if (!oldPlace) return;

    // Save snapshot before optimistic update
    saveSnapshot();

    try {
      setError(null);

      // Optimistic update
      setData((prev) => ({
        ...prev,
        [date]: {
          ...prev[date],
          regions: prev[date].regions.map((region) =>
            region.id === regionId
              ? {
                  ...region,
                  categories: {
                    ...region.categories,
                    [category]: region.categories[category].map((place) =>
                      place.id === placeId ? { ...place, ...updates } : place
                    ),
                  },
                }
              : region
          ),
        },
      }));

      // API call with retry strategy
      if (category === 'cafe') {
        await defaultRetryStrategy.execute(
          () => apiClient.updateCafe(placeId, updates as any),
          'updatePlace:cafe'
        );
      } else if (category === 'restaurant') {
        await defaultRetryStrategy.execute(
          () => apiClient.updateRestaurant(placeId, updates as any),
          'updatePlace:restaurant'
        );
      } else {
        await defaultRetryStrategy.execute(
          () => apiClient.updateSpot(placeId, updates as any),
          'updatePlace:spot'
        );
      }

      logger.log('Place updated successfully', { date, regionId, category, placeId });
    } catch (err) {
      // Rollback to snapshot
      restoreSnapshot();
      handleError(err, 'Failed to update place');
      throw err;
    }
  }, [data, saveSnapshot, restoreSnapshot, handleError]);

  const deletePlace = useCallback(async (
    date: string,
    regionId: string,
    category: CategoryType,
    placeId: string
  ) => {
    if (!data[date]) return;

    // Get current place data for validation
    const region = data[date].regions.find(r => r.id === regionId);
    if (!region) return;
    const deletedPlace = region.categories[category].find(p => p.id === placeId);
    if (!deletedPlace) return;

    // Save snapshot before optimistic update
    saveSnapshot();

    try {
      setError(null);

      // Optimistic update
      setData((prev) => ({
        ...prev,
        [date]: {
          ...prev[date],
          regions: prev[date].regions.map((region) =>
            region.id === regionId
              ? {
                  ...region,
                  categories: {
                    ...region.categories,
                    [category]: region.categories[category].filter((place) => place.id !== placeId),
                  },
                }
              : region
          ),
        },
      }));

      // API call with retry strategy
      if (category === 'cafe') {
        await defaultRetryStrategy.execute(
          () => apiClient.deleteCafe(placeId),
          'deletePlace:cafe'
        );
      } else if (category === 'restaurant') {
        await defaultRetryStrategy.execute(
          () => apiClient.deleteRestaurant(placeId),
          'deletePlace:restaurant'
        );
      } else {
        await defaultRetryStrategy.execute(
          () => apiClient.deleteSpot(placeId),
          'deletePlace:spot'
        );
      }

      logger.log('Place deleted successfully', { date, regionId, category, placeId });
    } catch (err) {
      // Rollback to snapshot
      restoreSnapshot();
      handleError(err, 'Failed to delete place');
      throw err;
    }
  }, [data, saveSnapshot, restoreSnapshot, handleError]);

  const toggleVisited = useCallback(async (
    date: string,
    regionId: string,
    category: CategoryType,
    placeId: string
  ) => {
    if (!data[date]) return;

    // Get current visited status for validation
    const region = data[date].regions.find(r => r.id === regionId);
    if (!region) return;
    const place = region.categories[category].find(p => p.id === placeId);
    if (!place) return;

    const oldVisited = place.visited;

    // Save snapshot before optimistic update
    saveSnapshot();

    try {
      setError(null);

      // Optimistic update
      setData((prev) => ({
        ...prev,
        [date]: {
          ...prev[date],
          regions: prev[date].regions.map((region) =>
            region.id === regionId
              ? {
                  ...region,
                  categories: {
                    ...region.categories,
                    [category]: region.categories[category].map((place) =>
                      place.id === placeId ? { ...place, visited: !place.visited } : place
                    ),
                  },
                }
              : region
          ),
        },
      }));

      // API call with retry strategy
      if (category === 'cafe') {
        await defaultRetryStrategy.execute(
          () => apiClient.updateCafe(placeId, { visited: !oldVisited }),
          'toggleVisited:cafe'
        );
      } else if (category === 'restaurant') {
        await defaultRetryStrategy.execute(
          () => apiClient.updateRestaurant(placeId, { visited: !oldVisited }),
          'toggleVisited:restaurant'
        );
      } else {
        await defaultRetryStrategy.execute(
          () => apiClient.updateSpot(placeId, { visited: !oldVisited }),
          'toggleVisited:spot'
        );
      }

      logger.log('Visited status toggled successfully', { date, regionId, category, placeId });
    } catch (err) {
      // Rollback to snapshot
      restoreSnapshot();
      handleError(err, 'Failed to toggle visited status');
      throw err;
    }
  }, [data, saveSnapshot, restoreSnapshot, handleError]);

  // Utility operations
  const refreshData = useCallback(async (filters?: DateEntryFilters) => {
    // Phase 2: Clear all cache before refreshing data
    loadedMonthsRef.current.clear();
    logger.log('Cache cleared for refresh');

    await loadData(filters);
  }, [loadData]);

  const loadMonthData = useCallback(async (year: number, month: number) => {
    const key = `${year}-${String(month).padStart(2, '0')}`;

    // Phase 2: Cache hit check - skip API call if month already loaded
    if (loadedMonthsRef.current.has(key)) {
      logger.log('Month data cache hit', { year, month, key });
      return; // Early return - 0ms response
    }

    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

    await loadData({ startDate, endDate });

    // Phase 2: Cache the loaded month
    loadedMonthsRef.current.add(key);
    logger.log('Month data cached', { year, month, key });
  }, [loadData]);

  const revalidateDate = useCallback(async (date: string) => {
    try {
      // Bug Fix 1: Use conditional state based on existing data
      // - If no data exists yet: use 'loading' state (shows spinner)
      // - If data already exists: use 'revalidating' state (shows existing data)
      const hasExistingData = !!data[date];
      setState(hasExistingData ? 'revalidating' : 'loading');
      setError(null);

      // Use dedicated single-date API with retry strategy
      const entries = await defaultRetryStrategy.execute(
        () => apiClient.getDateEntries({
          startDate: date,
          endDate: date
        }),
        'revalidateDate'
      );

      // Bug Fix 2: Use mergeDateLogData to preserve existing regions
      // Previously used shallow spread which lost regions from other backend entries
      setData((prev) => DateLogAdapter.mergeDateLogData(prev, entries));

      setState('success');
      logger.log('Date revalidated successfully', { date, hasExistingData });
    } catch (err) {
      handleError(err, 'Failed to revalidate date');
    }
  }, [data, handleError]);

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
    clearError,
  };
};
