/**
 * 테스트 헬퍼 유틸리티 함수
 * - Wait 유틸리티
 * - Assertion 헬퍼
 * - Date 유틸리티
 * - Data 생성 헬퍼
 */

// ============================================
// 1. Wait 유틸리티
// ============================================

/**
 * 지정된 시간만큼 대기
 */
export const waitFor = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

/**
 * 다음 틱까지 대기 (Promise microtask)
 */
export const waitForNextTick = (): Promise<void> => {
  return new Promise((resolve) => {
    setTimeout(resolve, 0);
  });
};

/**
 * 조건이 true가 될 때까지 대기 (최대 timeout)
 */
export const waitUntil = async (
  condition: () => boolean,
  options: { timeout?: number; interval?: number } = {}
): Promise<void> => {
  const { timeout = 5000, interval = 50 } = options;
  const startTime = Date.now();

  while (!condition()) {
    if (Date.now() - startTime > timeout) {
      throw new Error(`Timeout: condition not met within ${timeout}ms`);
    }
    await waitFor(interval);
  }
};

// ============================================
// 2. Date 유틸리티
// ============================================

/**
 * YYYY-MM-DD 형식의 날짜 문자열 생성
 */
export const formatDate = (date: Date = new Date()): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * 오늘 날짜 문자열
 */
export const getTodayString = (): string => {
  return formatDate(new Date());
};

/**
 * N일 전/후 날짜 문자열
 */
export const getRelativeDate = (daysOffset: number): string => {
  const date = new Date();
  date.setDate(date.getDate() + daysOffset);
  return formatDate(date);
};

/**
 * 특정 월의 첫째 날
 */
export const getFirstDayOfMonth = (year: number, month: number): string => {
  return `${year}-${String(month).padStart(2, '0')}-01`;
};

/**
 * 특정 월의 마지막 날
 */
export const getLastDayOfMonth = (year: number, month: number): string => {
  const date = new Date(year, month, 0);
  return formatDate(date);
};

// ============================================
// 3. Assertion 헬퍼
// ============================================

/**
 * 배열에 특정 조건을 만족하는 요소가 있는지 확인
 */
export const expectToContain = <T,>(
  array: T[],
  predicate: (item: T) => boolean,
  message?: string
): void => {
  const found = array.some(predicate);
  if (!found) {
    throw new Error(message || 'Expected array to contain matching element');
  }
};

/**
 * 객체가 부분적으로 일치하는지 확인
 */
export const expectToMatchPartial = <T extends Record<string, any>>(
  actual: T,
  expected: Partial<T>,
  message?: string
): void => {
  const keys = Object.keys(expected) as (keyof T)[];
  const mismatches: string[] = [];

  keys.forEach((key) => {
    if (actual[key] !== expected[key]) {
      mismatches.push(`${String(key)}: expected ${expected[key]}, got ${actual[key]}`);
    }
  });

  if (mismatches.length > 0) {
    throw new Error(message || `Partial match failed:\n${mismatches.join('\n')}`);
  }
};

/**
 * 함수가 특정 시간 내에 호출되었는지 확인
 */
export const expectCalledWithin = async (
  mockFn: jest.Mock,
  timeoutMs: number
): Promise<void> => {
  const startTime = Date.now();

  while (Date.now() - startTime < timeoutMs) {
    if (mockFn.mock.calls.length > 0) {
      return;
    }
    await waitFor(10);
  }

  throw new Error(`Mock function was not called within ${timeoutMs}ms`);
};

// ============================================
// 4. LocalStorage 헬퍼
// ============================================

/**
 * LocalStorage에 DateLog 데이터 설정
 */
export const setLocalStorageDateLog = (date: string, data: any): void => {
  const key = `dateLog_${date}`;
  localStorage.setItem(key, JSON.stringify(data));
};

/**
 * LocalStorage에서 DateLog 데이터 가져오기
 */
export const getLocalStorageDateLog = (date: string): any => {
  const key = `dateLog_${date}`;
  const value = localStorage.getItem(key);
  return value ? JSON.parse(value) : null;
};

/**
 * LocalStorage 전체 초기화
 */
export const clearAllLocalStorage = (): void => {
  localStorage.clear();
};

// ============================================
// 5. API Mock 헬퍼
// ============================================

/**
 * Fetch API 성공 응답 Mock
 */
export const mockFetchSuccess = <T,>(data: T, status = 200): void => {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok: true,
      status,
      json: () => Promise.resolve(data),
      text: () => Promise.resolve(JSON.stringify(data)),
    } as Response)
  );
};

/**
 * Fetch API 에러 응답 Mock
 */
export const mockFetchError = (message: string, status = 500): void => {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok: false,
      status,
      statusText: message,
      json: () => Promise.reject(new Error(message)),
      text: () => Promise.reject(new Error(message)),
    } as Response)
  );
};

/**
 * Fetch API 네트워크 에러 Mock
 */
export const mockFetchNetworkError = (): void => {
  global.fetch = jest.fn(() => Promise.reject(new Error('Network error')));
};

// ============================================
// 6. Console Mock 헬퍼
// ============================================

/**
 * console.error를 일시적으로 억제
 */
export const suppressConsoleError = (): (() => void) => {
  const originalError = console.error;
  console.error = jest.fn();

  return () => {
    console.error = originalError;
  };
};

/**
 * console.warn을 일시적으로 억제
 */
export const suppressConsoleWarn = (): (() => void) => {
  const originalWarn = console.warn;
  console.warn = jest.fn();

  return () => {
    console.warn = originalWarn;
  };
};

// ============================================
// 7. 테스트 데이터 생성 헬퍼
// ============================================

/**
 * 랜덤 문자열 생성
 */
export const randomString = (length = 10): string => {
  return Math.random().toString(36).substring(2, length + 2);
};

/**
 * 랜덤 숫자 생성 (범위 지정)
 */
export const randomNumber = (min = 0, max = 100): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

/**
 * 랜덤 좌표 생성 (대한민국 범위)
 */
export const randomCoordinates = (): { latitude: number; longitude: number } => {
  return {
    latitude: randomNumber(3300, 3900) / 100, // 33.00 ~ 39.00
    longitude: randomNumber(12500, 13200) / 100, // 125.00 ~ 132.00
  };
};

// ============================================
// 8. 타이머 헬퍼
// ============================================

/**
 * Jest 타이머 사용 시작
 */
export const useFakeTimers = (): void => {
  jest.useFakeTimers();
};

/**
 * Jest 타이머 종료
 */
export const useRealTimers = (): void => {
  jest.useRealTimers();
};

/**
 * 모든 타이머 실행
 */
export const runAllTimers = (): void => {
  jest.runAllTimers();
};

/**
 * 대기 중인 타이머만 실행
 */
export const runOnlyPendingTimers = (): void => {
  jest.runOnlyPendingTimers();
};

/**
 * 타이머를 지정된 시간만큼 진행
 */
export const advanceTimersByTime = (ms: number): void => {
  jest.advanceTimersByTime(ms);
};
