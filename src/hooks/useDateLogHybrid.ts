/**
 * Hybrid DateLog Hook Router
 * Automatically switches between localStorage and API implementations
 * based on DataSourceContext (VITE_ENABLE_API environment variable)
 */

import { useDataSource } from '@/contexts/DataSourceContext';
import { useDateLog } from './useDateLog';
import { useDateLogAPI } from './useDateLogAPI';

/**
 * Main hook for components to use
 * Routes to appropriate implementation based on data source
 */
export const useDateLogHybrid = () => {
  const { isApiEnabled } = useDataSource();

  // Call both hooks unconditionally (React hooks rules)
  const localStorageHook = useDateLog();
  const apiHook = useDateLogAPI();

  // Return the appropriate hook based on current data source
  return isApiEnabled ? apiHook : localStorageHook;
};
