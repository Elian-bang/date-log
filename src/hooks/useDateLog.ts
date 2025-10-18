import { useState, useEffect } from 'react';
import { DateLogData, DateLog, CategoryType, Place, Restaurant } from '@/types';
import { loadInitialData, saveData, resetData } from '@/utils/dataSync';

/**
 * Custom hook for managing date log data
 * Provides CRUD operations for dates and places
 */

interface UseDateLogReturn {
  data: DateLogData;
  loading: boolean;
  error: Error | null;

  // Date operations
  addDate: (date: string, region: string) => void;
  updateRegion: (date: string, region: string) => void;
  deleteDate: (date: string) => void;
  getDateLog: (date: string) => DateLog | undefined;

  // Place operations
  addPlace: (date: string, category: CategoryType, place: Omit<Place, 'id'>) => void;
  updatePlace: (date: string, category: CategoryType, placeId: string, updates: Partial<Place>) => void;
  deletePlace: (date: string, category: CategoryType, placeId: string) => void;
  toggleVisited: (date: string, category: CategoryType, placeId: string) => void;

  // Utility operations
  resetToDefault: () => Promise<void>;
  refreshData: () => Promise<void>;
}

export const useDateLog = (): UseDateLogReturn => {
  const [data, setData] = useState<DateLogData>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  // Load initial data on mount
  useEffect(() => {
    const initializeData = async () => {
      try {
        setLoading(true);
        const initialData = await loadInitialData();
        setData(initialData);
        setError(null);
      } catch (err) {
        setError(err as Error);
        console.error('Failed to load initial data:', err);
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

  // Generate unique ID for places
  const generateId = (): string => {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  };

  // Date operations
  const addDate = (date: string, region: string) => {
    setData((prev) => ({
      ...prev,
      [date]: {
        date,
        region,
        categories: {
          cafe: [],
          restaurant: [],
          spot: [],
        },
      },
    }));
  };

  const updateRegion = (date: string, region: string) => {
    setData((prev) => {
      if (!prev[date]) return prev;

      return {
        ...prev,
        [date]: {
          ...prev[date],
          region,
        },
      };
    });
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

  // Place operations
  const addPlace = (date: string, category: CategoryType, place: Omit<Place, 'id'>) => {
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
          categories: {
            ...prev[date].categories,
            [category]: [...prev[date].categories[category], newPlace],
          },
        },
      };
    });
  };

  const updatePlace = (date: string, category: CategoryType, placeId: string, updates: Partial<Place>) => {
    setData((prev) => {
      if (!prev[date]) return prev;

      const updatedPlaces = prev[date].categories[category].map((place) =>
        place.id === placeId ? { ...place, ...updates } : place
      );

      return {
        ...prev,
        [date]: {
          ...prev[date],
          categories: {
            ...prev[date].categories,
            [category]: updatedPlaces,
          },
        },
      };
    });
  };

  const deletePlace = (date: string, category: CategoryType, placeId: string) => {
    setData((prev) => {
      if (!prev[date]) return prev;

      const filteredPlaces = prev[date].categories[category].filter((place) => place.id !== placeId);

      return {
        ...prev,
        [date]: {
          ...prev[date],
          categories: {
            ...prev[date].categories,
            [category]: filteredPlaces,
          },
        },
      };
    });
  };

  const toggleVisited = (date: string, category: CategoryType, placeId: string) => {
    setData((prev) => {
      if (!prev[date]) return prev;

      const updatedPlaces = prev[date].categories[category].map((place) =>
        place.id === placeId ? { ...place, visited: !place.visited } : place
      );

      return {
        ...prev,
        [date]: {
          ...prev[date],
          categories: {
            ...prev[date].categories,
            [category]: updatedPlaces,
          },
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
      setError(err as Error);
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
      setError(err as Error);
      console.error('Failed to refresh data:', err);
    } finally {
      setLoading(false);
    }
  };

  return {
    data,
    loading,
    error,
    addDate,
    updateRegion,
    deleteDate,
    getDateLog,
    addPlace,
    updatePlace,
    deletePlace,
    toggleVisited,
    resetToDefault,
    refreshData,
  };
};
