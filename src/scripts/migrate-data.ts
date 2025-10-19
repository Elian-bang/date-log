#!/usr/bin/env tsx
/**
 * Data Migration Script
 *
 * Migrates localStorage data from local-storage.json to the backend API
 *
 * Usage:
 *   npm run migrate           # Dry run - shows what would be migrated
 *   npm run migrate --execute # Actually perform the migration
 *   npm run migrate --help    # Show help
 */

import fs from 'fs';
import path from 'path';
import { apiClient } from '../services/api/client';
import { DateLogAdapter } from '../services/api/adapter';
import type { DateLogData, DateLog } from '../types';

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

interface MigrationStats {
  totalDates: number;
  totalRegions: number;
  totalCafes: number;
  totalRestaurants: number;
  totalSpots: number;
  successfulDates: number;
  failedDates: number;
  errors: Array<{ date: string; error: string }>;
}

class DataMigrator {
  private stats: MigrationStats = {
    totalDates: 0,
    totalRegions: 0,
    totalCafes: 0,
    totalRestaurants: 0,
    totalSpots: 0,
    successfulDates: 0,
    failedDates: 0,
    errors: [],
  };

  private dryRun: boolean;

  constructor(dryRun: boolean = true) {
    this.dryRun = dryRun;
  }

  /**
   * Load localStorage data from JSON file
   */
  private loadLocalStorageData(): DateLogData {
    const filePath = path.join(process.cwd(), 'local-storage.json');

    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(fileContent) as DateLogData;

    return data;
  }

  /**
   * Analyze data and collect statistics
   */
  private analyzeData(data: DateLogData): void {
    this.stats.totalDates = Object.keys(data).length;

    Object.values(data).forEach((dateLog) => {
      this.stats.totalRegions += dateLog.regions.length;

      dateLog.regions.forEach((region) => {
        this.stats.totalCafes += region.categories.cafe.length;
        this.stats.totalRestaurants += region.categories.restaurant.length;
        this.stats.totalSpots += region.categories.spot.length;
      });
    });
  }

  /**
   * Print migration summary
   */
  private printSummary(): void {
    console.log(`\n${colors.bright}${colors.cyan}=== Migration Summary ===${colors.reset}`);
    console.log(`${colors.blue}Mode:${colors.reset} ${this.dryRun ? '🔍 DRY RUN' : '✅ EXECUTE'}`);
    console.log(`\n${colors.bright}Data Overview:${colors.reset}`);
    console.log(`  📅 Total Dates: ${colors.yellow}${this.stats.totalDates}${colors.reset}`);
    console.log(`  📍 Total Regions: ${colors.yellow}${this.stats.totalRegions}${colors.reset}`);
    console.log(`  ☕ Total Cafes: ${colors.yellow}${this.stats.totalCafes}${colors.reset}`);
    console.log(`  🍽️  Total Restaurants: ${colors.yellow}${this.stats.totalRestaurants}${colors.reset}`);
    console.log(`  🎯 Total Spots: ${colors.yellow}${this.stats.totalSpots}${colors.reset}`);
    console.log(`  📊 Total Places: ${colors.yellow}${this.stats.totalCafes + this.stats.totalRestaurants + this.stats.totalSpots}${colors.reset}\n`);
  }

  /**
   * Print final results
   */
  private printResults(): void {
    console.log(`\n${colors.bright}${colors.cyan}=== Migration Results ===${colors.reset}`);
    console.log(`${colors.green}✅ Successful: ${this.stats.successfulDates} dates${colors.reset}`);

    if (this.stats.failedDates > 0) {
      console.log(`${colors.red}❌ Failed: ${this.stats.failedDates} dates${colors.reset}`);
      console.log(`\n${colors.bright}Errors:${colors.reset}`);
      this.stats.errors.forEach(({ date, error }) => {
        console.log(`  ${colors.red}• ${date}:${colors.reset} ${error}`);
      });
    }

    console.log(`\n${colors.bright}Final Statistics:${colors.reset}`);
    console.log(`  Success Rate: ${colors.green}${((this.stats.successfulDates / this.stats.totalDates) * 100).toFixed(1)}%${colors.reset}`);
    console.log();
  }

  /**
   * Migrate a single date entry
   */
  private async migrateDateEntry(date: string, dateLog: DateLog): Promise<void> {
    const regionCount = dateLog.regions.length;
    const placeCount = dateLog.regions.reduce(
      (sum, region) =>
        sum +
        region.categories.cafe.length +
        region.categories.restaurant.length +
        region.categories.spot.length,
      0
    );

    console.log(`\n${colors.bright}📅 ${date}${colors.reset} (${regionCount} regions, ${placeCount} places)`);

    // Convert frontend DateLog to backend CreateDateEntryRequest[]
    const createRequests = DateLogAdapter.toBackendCreateRequests(dateLog);

    console.log(`  ${colors.cyan}→ Creating ${createRequests.length} date entries...${colors.reset}`);

    if (this.dryRun) {
      // Dry run - just show what would be created
      createRequests.forEach((req, index) => {
        const cafes = req.cafes?.length || 0;
        const restaurants = req.restaurants?.length || 0;
        const spots = req.spots?.length || 0;
        console.log(`    ${index + 1}. Region: ${colors.yellow}${req.region}${colors.reset} (☕${cafes} 🍽️${restaurants} 🎯${spots})`);
      });
      console.log(`  ${colors.green}✓ Would create these entries${colors.reset}`);
      this.stats.successfulDates++;
    } else {
      // Execute - actually create the entries
      try {
        const createdEntries = [];
        for (const request of createRequests) {
          const cafes = request.cafes?.length || 0;
          const restaurants = request.restaurants?.length || 0;
          const spots = request.spots?.length || 0;

          console.log(`    Creating region: ${colors.yellow}${request.region}${colors.reset} (☕${cafes} 🍽️${restaurants} 🎯${spots})...`);

          const entry = await apiClient.createDateEntry(request);
          createdEntries.push(entry);

          console.log(`      ${colors.green}✓ Created (ID: ${entry.id})${colors.reset}`);
        }

        console.log(`  ${colors.green}✅ Successfully created ${createdEntries.length} entries${colors.reset}`);
        this.stats.successfulDates++;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.log(`  ${colors.red}❌ Failed: ${errorMessage}${colors.reset}`);
        this.stats.failedDates++;
        this.stats.errors.push({ date, error: errorMessage });
      }
    }
  }

  /**
   * Run the migration
   */
  async migrate(): Promise<void> {
    try {
      console.log(`${colors.bright}${colors.cyan}=== DateLog Data Migration Tool ===${colors.reset}\n`);

      // Load data
      console.log(`${colors.blue}📂 Loading local-storage.json...${colors.reset}`);
      const data = this.loadLocalStorageData();
      console.log(`${colors.green}✓ Loaded data successfully${colors.reset}`);

      // Analyze data
      this.analyzeData(data);
      this.printSummary();

      if (this.dryRun) {
        console.log(`${colors.yellow}⚠️  DRY RUN MODE - No data will be actually migrated${colors.reset}`);
        console.log(`${colors.yellow}   Use --execute flag to perform actual migration${colors.reset}\n`);
      } else {
        console.log(`${colors.red}⚠️  EXECUTE MODE - Data will be migrated to backend${colors.reset}`);
        console.log(`${colors.red}   Press Ctrl+C to cancel${colors.reset}\n`);

        // Wait 3 seconds before starting
        await new Promise((resolve) => setTimeout(resolve, 3000));
      }

      // Migrate each date entry
      console.log(`${colors.bright}Starting migration...${colors.reset}`);

      const dates = Object.keys(data).sort(); // Sort by date
      for (const date of dates) {
        await this.migrateDateEntry(date, data[date]);
      }

      // Print results
      this.printResults();

      if (this.dryRun) {
        console.log(`${colors.yellow}💡 To actually migrate the data, run: npm run migrate --execute${colors.reset}\n`);
      } else {
        console.log(`${colors.green}🎉 Migration completed!${colors.reset}\n`);
      }
    } catch (error) {
      console.error(`\n${colors.red}${colors.bright}Fatal Error:${colors.reset} ${error instanceof Error ? error.message : String(error)}`);
      process.exit(1);
    }
  }
}

// CLI entry point
const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  console.log(`
${colors.bright}${colors.cyan}DateLog Data Migration Tool${colors.reset}

${colors.bright}Usage:${colors.reset}
  npm run migrate              ${colors.cyan}# Dry run - preview what will be migrated${colors.reset}
  npm run migrate --execute    ${colors.cyan}# Execute - actually migrate the data${colors.reset}
  npm run migrate --help       ${colors.cyan}# Show this help message${colors.reset}

${colors.bright}Description:${colors.reset}
  Migrates localStorage data from local-storage.json to the backend API.

  The tool will:
  1. Load data from local-storage.json
  2. Analyze and show statistics
  3. Convert frontend DateLog format to backend DateEntry format
  4. Create entries in the backend database via API

${colors.bright}Modes:${colors.reset}
  ${colors.yellow}Dry Run${colors.reset}  - Shows what would be migrated without making changes
  ${colors.green}Execute${colors.reset}  - Actually performs the migration

${colors.bright}Requirements:${colors.reset}
  • Backend server must be running (default: http://localhost:3001)
  • local-storage.json file must exist in project root
  • VITE_API_BASE_URL environment variable set correctly
`);
  process.exit(0);
}

const dryRun = !args.includes('--execute');
const migrator = new DataMigrator(dryRun);

// Run migration
migrator.migrate().catch((error) => {
  console.error(`${colors.red}${colors.bright}Unhandled Error:${colors.reset}`, error);
  process.exit(1);
});
