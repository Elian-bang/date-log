/**
 * Mock 전략 및 팩토리 함수
 * - API Mock 생성
 * - LocalStorage Mock 생성
 * - Kakao Maps Mock 생성
 */

import type {
  DateLog,
  Region,
  Cafe,
  Restaurant,
  Spot,
  DateEntryResponse,
  CreateDateEntryRequest,
} from '@/types';

// ============================================
// 1. 테스트 데이터 팩토리 함수
// ============================================

export const createMockCafe = (overrides?: Partial<Cafe>): Cafe => ({
  id: `cafe-${Date.now()}`,
  name: '테스트 카페',
  description: '테스트 카페 설명',
  latitude: 37.123456,
  longitude: 127.123456,
  visitDate: '2025-10-18',
  ...overrides,
});

export const createMockRestaurant = (overrides?: Partial<Restaurant>): Restaurant => ({
  id: `restaurant-${Date.now()}`,
  name: '테스트 식당',
  type: '한식',
  description: '테스트 식당 설명',
  latitude: 37.123456,
  longitude: 127.123456,
  visitDate: '2025-10-18',
  ...overrides,
});

export const createMockSpot = (overrides?: Partial<Spot>): Spot => ({
  id: `spot-${Date.now()}`,
  name: '테스트 장소',
  description: '테스트 장소 설명',
  latitude: 37.123456,
  longitude: 127.123456,
  visitDate: '2025-10-18',
  ...overrides,
});

export const createMockRegion = (overrides?: Partial<Region>): Region => ({
  id: `region-${Date.now()}`,
  name: '테스트 지역',
  categories: {
    cafe: [],
    restaurant: [],
    spot: [],
  },
  ...overrides,
});

export const createMockDateLog = (overrides?: Partial<DateLog>): DateLog => ({
  date: '2025-10-18',
  regions: [createMockRegion({ name: '삼송' })],
  ...overrides,
});

export const createMockDateEntryResponse = (
  overrides?: Partial<DateEntryResponse>
): DateEntryResponse => ({
  id: `entry-${Date.now()}`,
  date: '2025-10-18',
  region: '삼송',
  cafes: [],
  restaurants: [],
  spots: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

export const createMockCreateRequest = (
  overrides?: Partial<CreateDateEntryRequest>
): CreateDateEntryRequest => ({
  date: '2025-10-18',
  region: '삼송',
  cafes: [],
  restaurants: [],
  spots: [],
  ...overrides,
});

// ============================================
// 2. API Mock 전략
// ============================================

export type MockApiResponse<T> = {
  data?: T;
  error?: string;
  status?: number;
};

export const createMockApiClient = () => {
  const mockResponses: Map<string, MockApiResponse<any>> = new Map();

  return {
    // Mock response 설정
    setResponse: <T>(endpoint: string, response: MockApiResponse<T>) => {
      mockResponses.set(endpoint, response);
    },

    // GET Mock
    get: jest.fn(async <T>(endpoint: string): Promise<T> => {
      const response = mockResponses.get(endpoint);
      if (response?.error) {
        throw new Error(response.error);
      }
      return response?.data as T;
    }),

    // POST Mock
    post: jest.fn(async <T>(endpoint: string, data?: any): Promise<T> => {
      const response = mockResponses.get(endpoint);
      if (response?.error) {
        throw new Error(response.error);
      }
      return (response?.data || data) as T;
    }),

    // PUT Mock
    put: jest.fn(async <T>(endpoint: string, data?: any): Promise<T> => {
      const response = mockResponses.get(endpoint);
      if (response?.error) {
        throw new Error(response.error);
      }
      return (response?.data || data) as T;
    }),

    // DELETE Mock
    delete: jest.fn(async <T>(endpoint: string): Promise<T> => {
      const response = mockResponses.get(endpoint);
      if (response?.error) {
        throw new Error(response.error);
      }
      return response?.data as T;
    }),

    // 모든 mock 초기화
    reset: () => {
      mockResponses.clear();
      jest.clearAllMocks();
    },
  };
};

// ============================================
// 3. LocalStorage Mock 전략
// ============================================

export const createMockLocalStorage = () => {
  const storage: Map<string, string> = new Map();

  return {
    getItem: jest.fn((key: string) => storage.get(key) || null),
    setItem: jest.fn((key: string, value: string) => {
      storage.set(key, value);
    }),
    removeItem: jest.fn((key: string) => {
      storage.delete(key);
    }),
    clear: jest.fn(() => {
      storage.clear();
    }),
    key: jest.fn((index: number) => {
      const keys = Array.from(storage.keys());
      return keys[index] || null;
    }),
    get length() {
      return storage.size;
    },
    // 테스트 헬퍼
    setMockData: (key: string, data: any) => {
      storage.set(key, JSON.stringify(data));
    },
    getMockData: (key: string) => {
      const value = storage.get(key);
      return value ? JSON.parse(value) : null;
    },
  };
};

// ============================================
// 4. Kakao Maps Mock 전략
// ============================================

export const createMockKakaoMaps = () => {
  const mockLatLng = jest.fn((lat: number, lng: number) => ({ lat, lng }));
  const mockMap = jest.fn();
  const mockMarker = jest.fn();
  const mockGeocoder = jest.fn(() => ({
    addressSearch: jest.fn((address, callback) => {
      callback([{ x: '127.123456', y: '37.123456' }], 'OK');
    }),
    coord2Address: jest.fn((lng, lat, callback) => {
      callback([{ address: { address_name: '테스트 주소' } }], 'OK');
    }),
  }));

  return {
    maps: {
      load: jest.fn((callback: () => void) => {
        callback();
      }),
      LatLng: mockLatLng,
      Map: mockMap,
      Marker: mockMarker,
      services: {
        Geocoder: mockGeocoder,
        Places: jest.fn(),
      },
      event: {
        addListener: jest.fn(),
        removeListener: jest.fn(),
      },
      MarkerImage: jest.fn(),
      Size: jest.fn(),
      Point: jest.fn(),
    },
    reset: () => {
      mockLatLng.mockClear();
      mockMap.mockClear();
      mockMarker.mockClear();
      mockGeocoder.mockClear();
    },
  };
};

// ============================================
// 5. React Router Mock
// ============================================

export const createMockRouter = () => {
  const navigate = jest.fn();
  const location = {
    pathname: '/',
    search: '',
    hash: '',
    state: null,
  };

  return {
    navigate,
    location,
    useNavigate: () => navigate,
    useLocation: () => location,
    useParams: () => ({}),
  };
};

// ============================================
// 6. Fetch API Mock
// ============================================

export const createMockFetch = () => {
  const mockFetch = jest.fn();

  const setMockResponse = (data: any, status = 200) => {
    mockFetch.mockResolvedValueOnce({
      ok: status >= 200 && status < 300,
      status,
      json: async () => data,
      text: async () => JSON.stringify(data),
    });
  };

  const setMockError = (error: string, status = 500) => {
    mockFetch.mockRejectedValueOnce(new Error(error));
  };

  return {
    mockFetch,
    setMockResponse,
    setMockError,
    install: () => {
      global.fetch = mockFetch as any;
    },
    uninstall: () => {
      delete (global as any).fetch;
    },
  };
};

// ============================================
// 7. 복합 시나리오 Mock 생성
// ============================================

export const createFullMockEnvironment = () => {
  const apiClient = createMockApiClient();
  const localStorage = createMockLocalStorage();
  const kakaoMaps = createMockKakaoMaps();
  const router = createMockRouter();
  const fetch = createMockFetch();

  return {
    apiClient,
    localStorage,
    kakaoMaps,
    router,
    fetch,
    reset: () => {
      apiClient.reset();
      localStorage.clear();
      kakaoMaps.reset();
      router.navigate.mockClear();
    },
  };
};
