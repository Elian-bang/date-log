/**
 * API-Integrated DateLog Hook
 * Manages date log data with backend REST API integration
 * Features: API calls, optimistic updates, error handling, loading states
 */

import { useState, useEffect, useCallback } from 'react';
import { DateLogData, DateLog, CategoryType, Place, Restaurant } from '@/types';
import { apiClient, DateLogAdapter, ApiClientError } from '@/services/api';
import { getApiConfig } from '@/services/config/api.config';
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
  refreshData: () => Promise<void>;
  clearError: () => void;
}

export const useDateLogAPI = (): UseDateLogAPIReturn => {
  const [data, setData] = useState<DateLogData>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

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

  // Load all data from API
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const entries = await apiClient.getDateEntries();
      const frontendData = DateLogAdapter.toFrontendModel(entries);

      setData(frontendData);
      logger.info('Data loaded successfully', { entryCount: entries.length });
    } catch (err) {
      handleError(err, 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  // Initialize data on mount
  useEffect(() => {
    loadData();
  }, [loadData]);

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

      logger.info('Date added successfully', { date, regionName });
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

      logger.info('Date deleted successfully', { date });
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

    try {
      setError(null);

      // Optimistic update
      const tempId = `temp-${Date.now()}`;
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

      logger.info('Region added successfully', { date, regionName });
    } catch (err) {
      // Rollback optimistic update
      setData((prev) => ({
        ...prev,
        [date]: {
          ...prev[date],
          regions: prev[date].regions.filter(r => r.id !== `temp-${Date.now()}`),
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

      logger.info('Region name updated successfully', { date, regionId, newName });
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

      logger.info('Region deleted successfully', { date, regionId });
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

    try {
      setError(null);

      // Optimistic update
      const tempId = `temp-${Date.now()}`;
      const tempPlace = { ...place, id: tempId } as Place | Restaurant;

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

      // API call
      let newPlace;
      const placeData = category === 'restaurant'
        ? DateLogAdapter.toBackendRestaurant(place as Restaurant)
        : category === 'cafe'
        ? DateLogAdapter.toBackendCafe(place as Place)
        : DateLogAdapter.toBackendSpot(place as Place);

      if (category === 'cafe') {
        newPlace = await apiClient.createCafe(regionId, placeData);
      } else if (category === 'restaurant') {
        newPlace = await apiClient.createRestaurant(regionId, placeData);
      } else {
        newPlace = await apiClient.createSpot(regionId, placeData);
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
                      p.id === tempId
                        ? (category === 'cafe' ? DateLogAdapter['toCafe'](newPlace as any) :
                           category === 'restaurant' ? DateLogAdapter['toRestaurant'](newPlace as any) :
                           DateLogAdapter['toSpot'](newPlace as any))
                        : p
                    ),
                  },
                }
              : region
          ),
        },
      }));

      logger.info('Place added successfully', { date, regionId, category });
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
                    [category]: region.categories[category].filter(p => !p.id.startsWith('temp-')),
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

      logger.info('Place updated successfully', { date, regionId, category, placeId });
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

      logger.info('Place deleted successfully', { date, regionId, category, placeId });
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

      logger.info('Visited status toggled successfully', { date, regionId, category, placeId });
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
  const refreshData = useCallback(async () => {
    await loadData();
  }, [loadData]);

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
    clearError,
  };
};
