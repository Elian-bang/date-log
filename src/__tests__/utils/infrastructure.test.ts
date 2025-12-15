/**
 * 테스트 인프라 검증 테스트
 * - Jest 설정 확인
 * - Mock 전략 동작 확인
 * - 헬퍼 함수 동작 확인
 */

import {
  createMockCafe,
  createMockRestaurant,
  createMockSpot,
  createMockRegion,
  createMockDateLog,
  createMockApiClient,
  createMockLocalStorage,
  createMockKakaoMaps,
  createFullMockEnvironment,
} from './mocks';

import {
  formatDate,
  getTodayString,
  getRelativeDate,
  waitFor,
  waitForNextTick,
  randomString,
  randomNumber,
  randomCoordinates,
} from './helpers';

describe('테스트 인프라 검증', () => {
  describe('Mock 팩토리 함수', () => {
    it('createMockCafe should create valid cafe object', () => {
      const cafe = createMockCafe({ name: '스타벅스' });

      expect(cafe).toHaveProperty('id');
      expect(cafe).toHaveProperty('name', '스타벅스');
      expect(cafe).toHaveProperty('latitude');
      expect(cafe).toHaveProperty('longitude');
      expect(cafe).toHaveProperty('visitDate');
    });

    it('createMockRestaurant should create valid restaurant object', () => {
      const restaurant = createMockRestaurant({ name: '맛집', type: '한식' });

      expect(restaurant).toHaveProperty('id');
      expect(restaurant).toHaveProperty('name', '맛집');
      expect(restaurant).toHaveProperty('type', '한식');
      expect(restaurant).toHaveProperty('latitude');
      expect(restaurant).toHaveProperty('longitude');
    });

    it('createMockSpot should create valid spot object', () => {
      const spot = createMockSpot({ name: '공원' });

      expect(spot).toHaveProperty('id');
      expect(spot).toHaveProperty('name', '공원');
      expect(spot).toHaveProperty('latitude');
      expect(spot).toHaveProperty('longitude');
    });

    it('createMockRegion should create valid region object', () => {
      const region = createMockRegion({ name: '삼송' });

      expect(region).toHaveProperty('id');
      expect(region).toHaveProperty('name', '삼송');
      expect(region).toHaveProperty('categories');
      expect(region.categories).toHaveProperty('cafe');
      expect(region.categories).toHaveProperty('restaurant');
      expect(region.categories).toHaveProperty('spot');
    });

    it('createMockDateLog should create valid DateLog object', () => {
      const dateLog = createMockDateLog({ date: '2025-10-18' });

      expect(dateLog).toHaveProperty('date', '2025-10-18');
      expect(dateLog).toHaveProperty('regions');
      expect(Array.isArray(dateLog.regions)).toBe(true);
      expect(dateLog.regions.length).toBeGreaterThan(0);
    });
  });

  describe('API Mock 전략', () => {
    it('createMockApiClient should create working API mock', async () => {
      const apiClient = createMockApiClient();

      apiClient.setResponse('/test', { data: { message: 'success' } });

      const result = await apiClient.get('/test');
      expect(result).toEqual({ message: 'success' });
      expect(apiClient.get).toHaveBeenCalledWith('/test');
    });

    it('API mock should handle errors', async () => {
      const apiClient = createMockApiClient();

      apiClient.setResponse('/error', { error: 'API Error' });

      await expect(apiClient.get('/error')).rejects.toThrow('API Error');
    });

    it('API mock reset should clear all mocks', () => {
      const apiClient = createMockApiClient();

      apiClient.get('/test');
      expect(apiClient.get).toHaveBeenCalled();

      apiClient.reset();
      expect(apiClient.get).not.toHaveBeenCalled();
    });
  });

  describe('LocalStorage Mock 전략', () => {
    it('createMockLocalStorage should work like real localStorage', () => {
      const storage = createMockLocalStorage();

      storage.setItem('key', 'value');
      expect(storage.getItem('key')).toBe('value');

      storage.removeItem('key');
      expect(storage.getItem('key')).toBeNull();
    });

    it('localStorage mock should support setMockData helper', () => {
      const storage = createMockLocalStorage();

      storage.setMockData('user', { name: 'test' });
      const data = storage.getMockData('user');

      expect(data).toEqual({ name: 'test' });
    });
  });

  describe('Kakao Maps Mock 전략', () => {
    it('createMockKakaoMaps should create valid Kakao mock', () => {
      const kakao = createMockKakaoMaps();

      expect(kakao.maps.load).toBeDefined();
      expect(kakao.maps.LatLng).toBeDefined();
      expect(kakao.maps.Map).toBeDefined();
      expect(kakao.maps.Marker).toBeDefined();
      expect(kakao.maps.services.Geocoder).toBeDefined();
    });

    it('Kakao Maps load should execute callback', () => {
      const kakao = createMockKakaoMaps();
      const callback = jest.fn();

      kakao.maps.load(callback);

      expect(callback).toHaveBeenCalled();
    });
  });

  describe('Full Mock Environment', () => {
    it('createFullMockEnvironment should create all mocks', () => {
      const env = createFullMockEnvironment();

      expect(env.apiClient).toBeDefined();
      expect(env.localStorage).toBeDefined();
      expect(env.kakaoMaps).toBeDefined();
      expect(env.router).toBeDefined();
      expect(env.fetch).toBeDefined();
    });

    it('Full environment reset should reset all mocks', () => {
      const env = createFullMockEnvironment();

      env.apiClient.get('/test');
      env.localStorage.setItem('key', 'value');
      env.router.navigate('/path');

      expect(env.apiClient.get).toHaveBeenCalled();
      expect(env.localStorage.length).toBe(1);
      expect(env.router.navigate).toHaveBeenCalled();

      env.reset();

      expect(env.apiClient.get).not.toHaveBeenCalled();
      expect(env.localStorage.length).toBe(0);
      expect(env.router.navigate).not.toHaveBeenCalled();
    });
  });

  describe('Date 헬퍼 함수', () => {
    it('formatDate should format date correctly', () => {
      const date = new Date('2025-10-18');
      const formatted = formatDate(date);

      expect(formatted).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(formatted).toBe('2025-10-18');
    });

    it('getTodayString should return today date', () => {
      const today = getTodayString();

      expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('getRelativeDate should calculate relative dates', () => {
      const today = new Date('2025-10-18T00:00:00.000Z');
      const yesterday = new Date('2025-10-17T00:00:00.000Z');
      const tomorrow = new Date('2025-10-19T00:00:00.000Z');

      // Use fake timers to mock current date
      jest.useFakeTimers();
      jest.setSystemTime(today);

      const todayStr = formatDate(today);
      const yesterdayStr = formatDate(yesterday);
      const tomorrowStr = formatDate(tomorrow);

      expect(getRelativeDate(-1)).toBe(yesterdayStr);
      expect(getRelativeDate(0)).toBe(todayStr);
      expect(getRelativeDate(1)).toBe(tomorrowStr);

      jest.useRealTimers();
    });
  });

  describe('Wait 유틸리티', () => {
    it('waitFor should wait specified time', async () => {
      const start = Date.now();
      await waitFor(100);
      const elapsed = Date.now() - start;

      expect(elapsed).toBeGreaterThanOrEqual(90); // Allow 10ms tolerance
    });

    it('waitForNextTick should wait for next tick', async () => {
      let executed = false;

      setTimeout(() => {
        executed = true;
      }, 0);

      expect(executed).toBe(false);
      await waitForNextTick();
      expect(executed).toBe(true);
    });
  });

  describe('Random 헬퍼 함수', () => {
    it('randomString should generate string of specified length', () => {
      const str = randomString(10);

      expect(typeof str).toBe('string');
      expect(str.length).toBeLessThanOrEqual(10);
    });

    it('randomNumber should generate number in range', () => {
      const num = randomNumber(10, 20);

      expect(num).toBeGreaterThanOrEqual(10);
      expect(num).toBeLessThanOrEqual(20);
    });

    it('randomCoordinates should generate valid Korean coordinates', () => {
      const coords = randomCoordinates();

      expect(coords.latitude).toBeGreaterThanOrEqual(33);
      expect(coords.latitude).toBeLessThanOrEqual(39);
      expect(coords.longitude).toBeGreaterThanOrEqual(125);
      expect(coords.longitude).toBeLessThanOrEqual(132);
    });
  });

  describe('전역 Mock 설정', () => {
    it('localStorage should be mocked globally', () => {
      localStorage.setItem('test', 'value');
      expect(localStorage.getItem('test')).toBe('value');

      localStorage.clear();
      expect(localStorage.getItem('test')).toBeNull();
    });

    it('kakao global object should be available', () => {
      expect((global as any).kakao).toBeDefined();
      expect((global as any).kakao.maps).toBeDefined();
      expect((global as any).kakao.maps.load).toBeDefined();
    });

    it('window.matchMedia should be mocked', () => {
      const mediaQuery = window.matchMedia('(min-width: 768px)');

      expect(mediaQuery).toBeDefined();
      expect(mediaQuery.matches).toBe(false);
      expect(typeof mediaQuery.addEventListener).toBe('function');
    });
  });
});
