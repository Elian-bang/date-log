/**
 * Jest 테스트 환경 초기 설정
 * - Testing Library 확장
 * - 전역 Mock 설정
 * - 테스트 환경 변수 설정
 */

import '@testing-library/jest-dom';

// 환경 변수 설정
process.env.VITE_API_BASE_URL = 'http://localhost:3001/v1';
process.env.VITE_ENABLE_API = 'true';
process.env.VITE_KAKAO_MAP_API_KEY = 'test-kakao-api-key';

// localStorage mock
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    get length() {
      return Object.keys(store).length;
    },
    key: (index: number) => {
      const keys = Object.keys(store);
      return keys[index] || null;
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

// Kakao Maps SDK Mock (전역 객체)
(global as any).kakao = {
  maps: {
    load: jest.fn((callback: () => void) => {
      callback();
    }),
    LatLng: jest.fn((lat: number, lng: number) => ({ lat, lng })),
    Map: jest.fn(),
    Marker: jest.fn(),
    services: {
      Geocoder: jest.fn(),
      Places: jest.fn(),
    },
  },
};

// window.matchMedia mock (responsive design 테스트용)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// IntersectionObserver mock
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  takeRecords() {
    return [];
  }
  unobserve() {}
} as any;

// ResizeObserver mock
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
} as any;

// 각 테스트 전 localStorage 초기화
beforeEach(() => {
  localStorage.clear();
  jest.clearAllMocks();
});

// 각 테스트 후 타이머 정리
afterEach(() => {
  jest.clearAllTimers();
  jest.useRealTimers();
});

// 전역 에러 핸들러 (unhandled promise rejections 방지)
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection in test:', reason);
});
