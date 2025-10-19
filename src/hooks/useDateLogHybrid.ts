/**
 * Hybrid DateLog Hook
 * Automatically switches between localStorage and API based on configuration
 * Provides seamless transition between Phase 1 (localStorage) and Phase 2 (API)
 */

import { useDateLog } from './useDateLog';
import { useDateLogAPI } from './useDateLogAPI';
import { getApiConfig } from '@/services/config/api.config';

/**
 * Hybrid hook that switches between localStorage and API implementations
 * based on VITE_ENABLE_API environment variable
 *
 * @returns useDateLog (localStorage) or useDateLogAPI (backend) implementation
 *
 * Usage:
 * ```typescript
 * const { data, loading, error, addDate, ... } = useDateLogHybrid();
 * ```
 *
 * Configuration:
 * - VITE_ENABLE_API=false → Uses localStorage (Phase 1)
 * - VITE_ENABLE_API=true → Uses backend API (Phase 2)
 */
export const useDateLogHybrid = () => {
  const config = getApiConfig();

  // Switch based on configuration
  if (config.enableAPI) {
    return useDateLogAPI();
  } else {
    return useDateLog();
  }
};

// Re-export for convenience
export default useDateLogHybrid;
