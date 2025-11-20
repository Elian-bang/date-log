import { useState, useEffect } from 'react';
import { DateLogData, DateLog, CategoryType, Place, Restaurant } from '@/types';
import { loadInitialData, saveData, resetData } from '@/utils/dataSync';
import { logger } from '@/utils/logger';

/**
 * Custom hook for managing date log data with multi-region support
 * Provides CRUD operations for dates, regions, and places
 */

interface UseDateLogReturn {
  data: DateLogData;
  loading: boolean;
  error: string | null;

  // Date operations
  addDate: (date: string, regionName: string) => void;
  deleteDate: (date: string) => void;
  getDateLog: (date: string) => DateLog | undefined;

  // Region operations
  addRegion: (date: string, regionName: string) => void;
  updateRegionName: (date: string, regionId: string, newName: string) => void;
  deleteRegion: (date: string, regionId: string) => void;

  // Place operations
  addPlace: (date: string, regionId: string, category: CategoryType, place: Omit<Place, 'id'>) => void;
  updatePlace: (date: string, regionId: string, category: CategoryType, placeId: string, updates: Partial<Place>) => void;
  deletePlace: (date: string, regionId: string, category: CategoryType, placeId: string) => void;
  toggleVisited: (date: string, regionId: string, category: CategoryType, placeId: string) => void;

  // Utility operations
  resetToDefault: () => Promise<void>;
  refreshData: () => Promise<void>;
  loadMonthData?: (year: number, month: number) => Promise<void>;
  revalidateDate?: (date: string) => Promise<void>;
  clearError: () => void;
}

export const useDateLog = (): UseDateLogReturn => {
  const [data, setData] = useState<DateLogData>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Load initial data on mount
  useEffect(() => {
    const initializeData = async () => {
      try {
        setLoading(true);
        const initialData = await loadInitialData();
        setData(initialData);
        setError(null);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        setError(errorMessage);
        logger.error('Failed to load initial data:', err);
      } finally {
        setLoading(false);
      }
    };

    initializeData();
  }, []);

  // Sync to localStorage whenever data changes
  useEffect(() => {
    if (!loading && Object.keys(data).length > 0) {
      saveData(data);
    }
  }, [data, loading]);

  // Generate unique ID
  const generateId = (): string => {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  };

  // Date operations
  const addDate = (date: string, regionName: string) => {
    setData((prev) => ({
      ...prev,
      [date]: {
        date,
        regions: [
          {
            id: generateId(),
            name: regionName,
            categories: {
              cafe: [],
              restaurant: [],
              spot: [],
            },
          },
        ],
      },
    }));
  };

  const deleteDate = (date: string) => {
    setData((prev) => {
      const newData = { ...prev };
      delete newData[date];
      return newData;
    });
  };

  const getDateLog = (date: string): DateLog | undefined => {
    return data[date];
  };

  // Region operations
  const addRegion = (date: string, regionName: string) => {
    setData((prev) => {
      if (!prev[date]) return prev;

      return {
        ...prev,
        [date]: {
          ...prev[date],
          regions: [
            ...prev[date].regions,
            {
              id: generateId(),
              name: regionName,
              categories: {
                cafe: [],
                restaurant: [],
                spot: [],
              },
            },
          ],
        },
      };
    });
  };

  const updateRegionName = (date: string, regionId: string, newName: string) => {
    setData((prev) => {
      if (!prev[date]) return prev;

      return {
        ...prev,
        [date]: {
          ...prev[date],
          regions: prev[date].regions.map((region) =>
            region.id === regionId ? { ...region, name: newName } : region
          ),
        },
      };
    });
  };

  const deleteRegion = (date: string, regionId: string) => {
    setData((prev) => {
      if (!prev[date]) return prev;

      return {
        ...prev,
        [date]: {
          ...prev[date],
          regions: prev[date].regions.filter((region) => region.id !== regionId),
        },
      };
    });
  };

  // Place operations
  const addPlace = (
    date: string,
    regionId: string,
    category: CategoryType,
    place: Omit<Place, 'id'>
  ) => {
    setData((prev) => {
      if (!prev[date]) return prev;

      const newPlace = {
        ...place,
        id: generateId(),
      } as Place | Restaurant;

      return {
        ...prev,
        [date]: {
          ...prev[date],
          regions: prev[date].regions.map((region) =>
            region.id === regionId
              ? {
                  ...region,
                  categories: {
                    ...region.categories,
                    [category]: [...region.categories[category], newPlace],
                  },
                }
              : region
          ),
        },
      };
    });
  };

  const updatePlace = (
    date: string,
    regionId: string,
    category: CategoryType,
    placeId: string,
    updates: Partial<Place>
  ) => {
    setData((prev) => {
      if (!prev[date]) return prev;

      return {
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
      };
    });
  };

  const deletePlace = (date: string, regionId: string, category: CategoryType, placeId: string) => {
    setData((prev) => {
      if (!prev[date]) return prev;

      return {
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
      };
    });
  };

  const toggleVisited = (
    date: string,
    regionId: string,
    category: CategoryType,
    placeId: string
  ) => {
    setData((prev) => {
      if (!prev[date]) return prev;

      return {
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
      };
    });
  };

  // Utility operations
  const resetToDefault = async () => {
    try {
      setLoading(true);
      const freshData = await resetData();
      setData(freshData);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);
      console.error('Failed to reset data:', err);
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    try {
      setLoading(true);
      const refreshedData = await loadInitialData();
      setData(refreshedData);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);
      console.error('Failed to refresh data:', err);
    } finally {
      setLoading(false);
    }
  };

  const clearError = () => {
    setError(null);
  };

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
    resetToDefault,
    refreshData,
    clearError,
  };
};
