/**
 * Jest Configuration
 * Optimized for React + TypeScript testing with jsdom
 */

export default {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',

  // Test file locations
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts', '**/__tests__/**/*.test.tsx'],

  // Setup files
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/utils/setup.ts'],

  // Module resolution
  moduleNameMapper: {
    // CSS modules
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    // Path aliases
    '^@/(.*)$': '<rootDir>/src/$1',
  },

  // TypeScript configuration
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: {
        jsx: 'react-jsx',
        esModuleInterop: true,
      },
    }],
  },

  // Coverage configuration
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/main.tsx',
    '!src/vite-env.d.ts',
    '!src/__tests__/**',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],

  // Performance
  maxWorkers: '50%',
  testTimeout: 10000,

  // Clear mocks between tests
  clearMocks: true,
  restoreMocks: true,
  resetMocks: true,
};
