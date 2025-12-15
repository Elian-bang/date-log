/**
 * API-Integrated DateLog Hook
 * Manages date log data with backend REST API integration
 * Features: API calls, optimistic updates, error handling, loading states
 */

import { useState, useCallback, useRef } from 'react';
import { DateLogData, DateLog, CategoryType, Place, Restaurant } from '@/types';
import { apiClient, DateLogAdapter, ApiClientError } from '@/services/api';
import { DateEntryFilters } from '@/services/api/types';
import { logger } from '@/utils/logger';

interface UseDateLogAPIReturn {
  data: DateLogData;
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
  refreshData: (filters?: DateEntryFilters) => Promise<void>;
  loadMonthData: (year: number, month: number) => Promise<void>;
  revalidateDate: (date: string) => Promise<void>;
  clearError: () => void;
}

export const useDateLogAPI = (): UseDateLogAPIReturn => {
  const [data, setData] = useState<DateLogData>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Phase 2: Smart Caching - Track loaded months to prevent duplicate API calls
  const loadedMonthsRef = useRef(new Set<string>());

  // Helper: Find region name by ID
  const findRegionNameById = useCallback((date: string, regionId: string): string | undefined => {
    const dateLog = data[date];
    if (!dateLog) return undefined;
    const region = dateLog.regions.find((r) => r.id === regionId);
    return region?.name;
  }, [data]);

  // Helper: Set error with logging
  const handleError = useCallback((err: unknown, context: string) => {
    const errorMessage = err instanceof ApiClientError ? err.message : '알 수 없는 오류가 발생했습니다';
    setError(errorMessage);
    logger.error(`${context}:`, err);
  }, []);

  // Load data from API with optional filters
  const loadData = useCallback(async (filters?: DateEntryFilters) => {
    try {
      setLoading(true);
      setError(null);

      const entries = await apiClient.getDateEntries(filters);

      // Merge new data with existing data instead of replacing
      setData(prev => DateLogAdapter.mergeDateLogData(prev, entries));

      logger.log('Data loaded successfully', {
        entryCount: entries.length,
        filters,
        action: 'merge'
      });
    } catch (err) {
      handleError(err, 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  // Date operations
  const addDate = useCallback(async (date: string, regionName: string) => {
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

      // API call
      const newEntry = await apiClient.createDateEntry({ date, region: regionName });

      // Update with real data
      setData((prev) => {
        const updated = DateLogAdapter.mergeDateLogData(prev, [newEntry]);
        // Remove temp entry if it exists
        if (updated[date]) {
          updated[date].regions = updated[date].regions.filter(r => r.id !== tempId);
        }
        return updated;
      });

      // Phase 2: Invalidate cache for this month
      const dateObj = new Date(date);
      const key = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`;
      loadedMonthsRef.current.delete(key);

      logger.log('Date added successfully', { date, regionName, cacheInvalidated: key });
    } catch (err) {
      // Rollback optimistic update
      setData((prev) => {
        const newData = { ...prev };
        delete newData[date];
        return newData;
      });
      handleError(err, 'Failed to add date');
      throw err;
    }
  }, [handleError]);

  const deleteDate = useCallback(async (date: string) => {
    const dateLog = data[date];
    if (!dateLog) return;

    try {
      setError(null);

      // Optimistic update
      setData((prev) => {
        const newData = { ...prev };
        delete newData[date];
        return newData;
      });

      // Delete all regions for this date
      const deletePromises = dateLog.regions.map(region =>
        apiClient.deleteDateEntry(region.id)
      );
      await Promise.all(deletePromises);

      // Phase 2: Invalidate cache for this month
      const dateObj = new Date(date);
      const key = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`;
      loadedMonthsRef.current.delete(key);

      logger.log('Date deleted successfully', { date, cacheInvalidated: key });
    } catch (err) {
      // Rollback on error
      setData((prev) => ({
        ...prev,
        [date]: dateLog,
      }));
      handleError(err, 'Failed to delete date');
      throw err;
    }
  }, [data, handleError]);

  const getDateLog = useCallback((date: string): DateLog | undefined => {
    return data[date];
  }, [data]);

  // Region operations
  const addRegion = useCallback(async (date: string, regionName: string) => {
    if (!data[date]) return;

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

      // API call
      const newEntry = await apiClient.createDateEntry({ date, region: regionName });

      // Update with real data
      setData((prev) => {
        const updated = DateLogAdapter.mergeDateLogData(prev, [newEntry]);
        // Remove temp region if it exists
        if (updated[date]) {
          updated[date].regions = updated[date].regions.filter(r => r.id !== tempId);
        }
        return updated;
      });

      // Phase 2: Invalidate cache for this month
      const dateObj = new Date(date);
      const key = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`;
      loadedMonthsRef.current.delete(key);

      logger.log('Region added successfully', { date, regionName, cacheInvalidated: key });
    } catch (err) {
      // Rollback optimistic update
      setData((prev) => ({
        ...prev,
        [date]: {
          ...prev[date],
          regions: prev[date].regions.filter(r => r.id !== tempId),
        },
      }));
      handleError(err, 'Failed to add region');
      throw err;
    }
  }, [data, handleError]);

  const updateRegionName = useCallback(async (date: string, regionId: string, newName: string) => {
    if (!data[date]) return;

    const oldName = findRegionNameById(date, regionId);
    if (!oldName) return;

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

      // API call
      await apiClient.updateDateEntry(regionId, { region: newName });

      logger.log('Region name updated successfully', { date, regionId, newName });
    } catch (err) {
      // Rollback on error
      setData((prev) => ({
        ...prev,
        [date]: {
          ...prev[date],
          regions: prev[date].regions.map((region) =>
            region.id === regionId ? { ...region, name: oldName } : region
          ),
        },
      }));
      handleError(err, 'Failed to update region name');
      throw err;
    }
  }, [data, findRegionNameById, handleError]);

  const deleteRegion = useCallback(async (date: string, regionId: string) => {
    if (!data[date]) return;

    const regionToDelete = data[date].regions.find(r => r.id === regionId);
    if (!regionToDelete) return;

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

      // API call
      await apiClient.deleteDateEntry(regionId);

      // Phase 2: Invalidate cache for this month
      const dateObj = new Date(date);
      const key = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`;
      loadedMonthsRef.current.delete(key);

      logger.log('Region deleted successfully', { date, regionId, cacheInvalidated: key });
    } catch (err) {
      // Rollback on error
      setData((prev) => ({
        ...prev,
        [date]: {
          ...prev[date],
          regions: [...prev[date].regions, regionToDelete],
        },
      }));
      handleError(err, 'Failed to delete region');
      throw err;
    }
  }, [data, handleError]);

  // Place operations
  const addPlace = useCallback(async (
    date: string,
    regionId: string,
    category: CategoryType,
    place: Omit<Place, 'id'>
  ) => {
    if (!data[date]) return;

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

      // API call - properly typed for each category
      let frontendPlace;
      if (category === 'cafe') {
        const placeData = DateLogAdapter.toBackendCafe(place as Place);
        const newPlace = await apiClient.createCafe(regionId, placeData);
        frontendPlace = DateLogAdapter.toCafe(newPlace);
      } else if (category === 'restaurant') {
        const placeData = DateLogAdapter.toBackendRestaurant(place as Restaurant);
        const newPlace = await apiClient.createRestaurant(regionId, placeData);
        frontendPlace = DateLogAdapter.toRestaurant(newPlace);
      } else {
        const placeData = DateLogAdapter.toBackendSpot(place as Place);
        const newPlace = await apiClient.createSpot(regionId, placeData);
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
      // Rollback optimistic update
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
                    [category]: region.categories[category].filter(p => p.id !== tempId),
                  },
                }
              : region
          ),
        },
      }));
      handleError(err, 'Failed to add place');
      throw err;
    }
  }, [data, handleError]);

  const updatePlace = useCallback(async (
    date: string,
    regionId: string,
    category: CategoryType,
    placeId: string,
    updates: Partial<Place>
  ) => {
    if (!data[date]) return;

    // Get current place data for rollback
    let oldPlace: Place | undefined;
    const region = data[date].regions.find(r => r.id === regionId);
    if (region) {
      oldPlace = region.categories[category].find(p => p.id === placeId);
    }
    if (!oldPlace) return;

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

      // API call
      if (category === 'cafe') {
        await apiClient.updateCafe(placeId, updates as any);
      } else if (category === 'restaurant') {
        await apiClient.updateRestaurant(placeId, updates as any);
      } else {
        await apiClient.updateSpot(placeId, updates as any);
      }

      logger.log('Place updated successfully', { date, regionId, category, placeId });
    } catch (err) {
      // Rollback on error
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
                      place.id === placeId ? oldPlace! : place
                    ),
                  },
                }
              : region
          ),
        },
      }));
      handleError(err, 'Failed to update place');
      throw err;
    }
  }, [data, handleError]);

  const deletePlace = useCallback(async (
    date: string,
    regionId: string,
    category: CategoryType,
    placeId: string
  ) => {
    if (!data[date]) return;

    // Get current place data for rollback
    let deletedPlace: Place | undefined;
    const region = data[date].regions.find(r => r.id === regionId);
    if (region) {
      deletedPlace = region.categories[category].find(p => p.id === placeId);
    }
    if (!deletedPlace) return;

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

      // API call
      if (category === 'cafe') {
        await apiClient.deleteCafe(placeId);
      } else if (category === 'restaurant') {
        await apiClient.deleteRestaurant(placeId);
      } else {
        await apiClient.deleteSpot(placeId);
      }

      logger.log('Place deleted successfully', { date, regionId, category, placeId });
    } catch (err) {
      // Rollback on error
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
                    [category]: [...region.categories[category], deletedPlace!],
                  },
                }
              : region
          ),
        },
      }));
      handleError(err, 'Failed to delete place');
      throw err;
    }
  }, [data, handleError]);

  const toggleVisited = useCallback(async (
    date: string,
    regionId: string,
    category: CategoryType,
    placeId: string
  ) => {
    if (!data[date]) return;

    // Get current visited status for rollback
    let oldVisited = false;
    const region = data[date].regions.find(r => r.id === regionId);
    if (region) {
      const place = region.categories[category].find(p => p.id === placeId);
      if (place) {
        oldVisited = place.visited;
      } else {
        return;
      }
    } else {
      return;
    }

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

      // API call
      if (category === 'cafe') {
        await apiClient.updateCafe(placeId, { visited: !oldVisited });
      } else if (category === 'restaurant') {
        await apiClient.updateRestaurant(placeId, { visited: !oldVisited });
      } else {
        await apiClient.updateSpot(placeId, { visited: !oldVisited });
      }

      logger.log('Visited status toggled successfully', { date, regionId, category, placeId });
    } catch (err) {
      // Rollback on error
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
                      place.id === placeId ? { ...place, visited: oldVisited } : place
                    ),
                  },
                }
              : region
          ),
        },
      }));
      handleError(err, 'Failed to toggle visited status');
      throw err;
    }
  }, [data, handleError]);

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
      setLoading(true);
      setError(null);

      // Use dedicated single-date API instead of date range filter
      const entries = await apiClient.getDateEntries({
        startDate: date,
        endDate: date
      });

      // Update only this specific date in state
      const frontendData = DateLogAdapter.toFrontendModel(entries);

      setData((prev) => ({
        ...prev,
        ...frontendData,
      }));

      logger.log('Date revalidated successfully', { date });
    } catch (err) {
      handleError(err, 'Failed to revalidate date');
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    data,
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
