/**
 * Memo Fields Migration Utility
 * Converts old memo field to boyfriendMemo for backward compatibility
 */

import type { DateLogData } from '@/types';

const MIGRATION_KEY = 'datelog_memo_migrated';

/**
 * Check if migration has already been run
 */
function isMigrationComplete(): boolean {
  return localStorage.getItem(MIGRATION_KEY) === 'true';
}

/**
 * Mark migration as complete
 */
function markMigrationComplete(): void {
  localStorage.setItem(MIGRATION_KEY, 'true');
}

/**
 * Migrate old memo field to boyfriendMemo field
 * This function runs once on app initialization
 */
export function migrateMemoFields(): void {
  // Skip if already migrated
  if (isMigrationComplete()) {
    console.log('[Migration] Memo fields already migrated');
    return;
  }

  try {
    const data = localStorage.getItem('datelog-data');
    if (!data) {
      console.log('[Migration] No data to migrate');
      markMigrationComplete();
      return;
    }

    const dateLogData: DateLogData = JSON.parse(data);
    let migratedCount = 0;

    // Iterate through all dates
    Object.values(dateLogData).forEach((dateLog) => {
      dateLog.regions.forEach((region) => {
        // Migrate cafes
        region.categories.cafe.forEach((cafe: any) => {
          if (cafe.memo && !cafe.boyfriendMemo) {
            cafe.boyfriendMemo = cafe.memo;
            delete cafe.memo;
            migratedCount++;
          }
        });

        // Migrate restaurants
        region.categories.restaurant.forEach((restaurant: any) => {
          if (restaurant.memo && !restaurant.boyfriendMemo) {
            restaurant.boyfriendMemo = restaurant.memo;
            delete restaurant.memo;
            migratedCount++;
          }
        });

        // Migrate spots
        region.categories.spot.forEach((spot: any) => {
          if (spot.memo && !spot.boyfriendMemo) {
            spot.boyfriendMemo = spot.memo;
            delete spot.memo;
            migratedCount++;
          }
        });
      });
    });

    // Save migrated data
    if (migratedCount > 0) {
      localStorage.setItem('datelog-data', JSON.stringify(dateLogData));
      console.log(`[Migration] Successfully migrated ${migratedCount} memo fields`);
    } else {
      console.log('[Migration] No memo fields to migrate');
    }

    markMigrationComplete();
  } catch (error) {
    console.error('[Migration] Error migrating memo fields:', error);
    // Don't mark as complete if error occurred, will retry next time
  }
}

/**
 * Reset migration flag (for testing purposes)
 */
export function resetMigrationFlag(): void {
  localStorage.removeItem(MIGRATION_KEY);
}
