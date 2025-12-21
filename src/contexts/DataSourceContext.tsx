/**
 * Data Source Context
 * Global state management for data source switching
 * - localStorage vs Backend API
 * - Environment-based configuration
 * - Runtime switching capability
 */

import { createContext, useContext, useState, ReactNode, useCallback } from 'react';

export type DataSource = 'localStorage' | 'api';

interface DataSourceContextValue {
  source: DataSource;
  isApiEnabled: boolean;
  switchSource: (newSource: DataSource) => void;
  toggleSource: () => void;
}

const DataSourceContext = createContext<DataSourceContextValue | undefined>(undefined);

interface DataSourceProviderProps {
  children: ReactNode;
  initialSource?: DataSource;
}

export const DataSourceProvider = ({
  children,
  initialSource
}: DataSourceProviderProps) => {
  // Determine initial source from environment variable or prop
  const getInitialSource = (): DataSource => {
    if (initialSource) return initialSource;

    const apiEnabled = import.meta.env.VITE_ENABLE_API === 'true';
    return apiEnabled ? 'api' : 'localStorage';
  };

  const [source, setSource] = useState<DataSource>(getInitialSource());

  const isApiEnabled = source === 'api';

  const switchSource = useCallback((newSource: DataSource) => {
    console.log('[DataSourceContext] Switching source:', source, '→', newSource);
    setSource(newSource);
  }, [source]);

  const toggleSource = useCallback(() => {
    const newSource: DataSource = source === 'localStorage' ? 'api' : 'localStorage';
    switchSource(newSource);
  }, [source, switchSource]);

  // Debug logging
  if (import.meta.env.DEV) {
    console.log('[DataSourceContext] Current source:', source);
    console.log('[DataSourceContext] API enabled:', isApiEnabled);
  }

  return (
    <DataSourceContext.Provider
      value={{
        source,
        isApiEnabled,
        switchSource,
        toggleSource
      }}
    >
      {children}
    </DataSourceContext.Provider>
  );
};

/**
 * Hook to access data source context
 */
export const useDataSource = (): DataSourceContextValue => {
  const context = useContext(DataSourceContext);

  if (context === undefined) {
    throw new Error('useDataSource must be used within DataSourceProvider');
  }

  return context;
};

/**
 * Data Source Switcher Component (for development/testing)
 */
export const DataSourceSwitcher = () => {
  const { source, toggleSource } = useDataSource();

  // Only show in development mode
  if (!import.meta.env.DEV) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 bg-white border border-gray-300 rounded-lg shadow-lg p-3 z-50">
      <div className="text-xs text-gray-600 mb-2 font-semibold">Data Source</div>
      <button
        onClick={toggleSource}
        className={`w-full px-3 py-2 rounded-md text-xs font-medium transition-colors ${
          source === 'localStorage'
            ? 'bg-green-100 text-green-800 border border-green-300'
            : 'bg-blue-100 text-blue-800 border border-blue-300'
        }`}
      >
        {source === 'localStorage' ? '💾 LocalStorage' : '🌐 Backend API'}
      </button>
      <div className="text-xs text-gray-500 mt-2 text-center">
        Click to toggle
      </div>
    </div>
  );
};

/**
 * Helper function to get data source from environment
 */
export function getDataSourceFromEnv(): DataSource {
  const apiEnabled = import.meta.env.VITE_ENABLE_API === 'true';
  return apiEnabled ? 'api' : 'localStorage';
}
