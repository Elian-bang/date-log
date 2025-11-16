#!/usr/bin/env node

/**
 * Environment Variable Diagnostic Script
 * Checks if Vite can access VITE_KAKAO_MAP_API_KEY
 */

import { loadEnv } from 'vite';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('=== Environment Variable Diagnostic ===\n');

// Check different modes
const modes = ['development', 'production', 'staging'];

for (const mode of modes) {
  console.log(`\n🔍 Mode: ${mode}`);
  const env = loadEnv(mode, process.cwd(), '');

  if (env.VITE_KAKAO_MAP_API_KEY) {
    console.log(`  ✓ VITE_KAKAO_MAP_API_KEY: ${env.VITE_KAKAO_MAP_API_KEY.substring(0, 10)}...`);
  } else {
    console.log(`  ✗ VITE_KAKAO_MAP_API_KEY: NOT FOUND`);
  }
}

console.log('\n=== File System Check ===');
console.log(`Working Directory: ${process.cwd()}`);

import fs from 'fs';
const envFiles = ['.env', '.env.local', '.env.development', '.env.production'];

for (const file of envFiles) {
  const filePath = resolve(process.cwd(), file);
  if (fs.existsSync(filePath)) {
    console.log(`  ✓ ${file} exists`);
    const content = fs.readFileSync(filePath, 'utf-8');
    if (content.includes('VITE_KAKAO_MAP_API_KEY')) {
      console.log(`    → Contains VITE_KAKAO_MAP_API_KEY`);
    }
  } else {
    console.log(`  ✗ ${file} not found`);
  }
}

console.log('\n=== Recommendations ===');
console.log('1. Ensure .env file is in project root');
console.log('2. Restart Vite dev server after .env changes');
console.log('3. Check for typos in variable name');
console.log('4. Verify no spaces around = in .env file\n');
