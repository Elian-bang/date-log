# 캘린더 API 호출 최적화 설계 문서

**작성일**: 2025-12-15
**작성자**: Claude Code
**문서 버전**: 1.0
**관련 이슈**: 월 변경 시 API 호출 문제, 중복 호출 문제

---

## 📋 목차

1. [문제 정의](#-문제-정의)
2. [설계 목표](#-설계-목표)
3. [아키텍처 개요](#-아키텍처-개요)
4. [Phase 1: Quick Fix](#-phase-1-quick-fix-즉시-적용)
5. [Phase 2: Smart Caching](#-phase-2-smart-caching-선택적-개선)
6. [Phase 3: React Query](#-phase-3-react-query-장기-계획)
7. [마이그레이션 전략](#-마이그레이션-전략)
8. [테스트 계획](#-테스트-계획)
9. [위험 요소 및 완화](#-위험-요소-및-완화)

---

## 🔍 문제 정의

### 발견된 문제

#### 1. 월 변경 시 데이터 손실 (Critical)

**현상**:
```typescript
// src/hooks/useDateLogAPI.ts:81
const loadData = useCallback(async (filters?: DateEntryFilters) => {
  const entries = await apiClient.getDateEntries(filters);
  const frontendData = DateLogAdapter.toFrontendModel(entries);

  setData(frontendData);  // ❌ Replace, not merge
}, [handleError]);
```

**시나리오**:
```
Time 0s:  12월 로딩 → data = { "2025-12-01": {...}, "2025-12-15": {...} }
Time 1s:  1월로 이동 → data = { "2026-01-05": {...} }  (12월 데이터 손실!)
Time 2s:  12월로 복귀 → API 재호출 필요
```

**영향**:
- 사용자 경험 저하 (이전 데이터 즉시 표시 불가)
- 불필요한 네트워크 요청
- 메모리에 있던 데이터 재로딩

---

#### 2. 초기 로딩 중복 API 호출 (High Priority)

**현상**:
```typescript
// useDateLogAPI.ts:91-101
useEffect(() => {
  loadData({ startDate, endDate });  // Call #1
}, [loadData]);

// CalendarView.tsx:22-28
useEffect(() => {
  loadMonthData(year, month);  // Call #2 (same month!)
}, [currentMonth, loadMonthData]);
```

**Timeline**:
```
0ms:   useDateLogAPI mount → GET /dates?startDate=2025-12-01&endDate=2025-12-31
50ms:  CalendarView mount  → GET /dates?startDate=2025-12-01&endDate=2025-12-31 (중복!)
```

**영향**:
- 초기 로딩 시간 증가
- 서버 부하 증가
- 네트워크 비용 낭비

---

#### 3. React Query 미사용 (Medium Priority)

**현상**:
- ❌ 캐싱 메커니즘 없음
- ❌ 중복 요청 방지 없음
- ❌ Background refetch 없음

**영향**:
- 동일 월 재방문 시 매번 API 호출
- 네트워크 효율성 저하
- 사용자 경험 저하

---

## 🎯 설계 목표

### 핵심 목표

1. **데이터 지속성**: 월 변경 시 이전 데이터 유지
2. **API 효율성**: 불필요한 중복 호출 제거
3. **응답 속도**: 캐시 히트 시 즉시 표시 (0ms)
4. **메모리 관리**: 적절한 메모리 사용량 유지
5. **유지보수성**: 코드 간소화 및 표준 패턴 사용

### 비기능 요구사항

- **성능**: 월 변경 시 200ms 이내 응답
- **메모리**: 최대 5개월 데이터 보관 (~250KB)
- **네트워크**: 중복 요청 0건
- **호환성**: 기존 API 인터페이스 유지

---

## 🏗️ 아키텍처 개요

### 현재 아키텍처

```
┌─────────────────────────────────────────────┐
│              CalendarView                    │
│  ┌──────────────────────────────────────┐  │
│  │  useEffect(() => {                   │  │
│  │    loadMonthData(year, month)        │  │
│  │  }, [currentMonth, loadMonthData])   │  │
│  └──────────────────────────────────────┘  │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│            useDateLogAPI                     │
│  ┌──────────────────────────────────────┐  │
│  │  useEffect(() => {                   │  │
│  │    loadData(currentMonth) // 중복!   │  │
│  │  }, [loadData])                      │  │
│  └──────────────────────────────────────┘  │
│  ┌──────────────────────────────────────┐  │
│  │  loadData: setData(frontendData)     │  │
│  │           ↑ Replace, not merge!      │  │
│  └──────────────────────────────────────┘  │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│            API Client                        │
│         GET /dates?filters                   │
└─────────────────────────────────────────────┘
```

### 목표 아키텍처 (Phase별)

```
Phase 1: Quick Fix
─────────────────────────────────────────
CalendarView → useDateLogAPI (초기 로딩 제거)
                    ↓
            loadData (merge 사용)
                    ↓
            DateLogAdapter.mergeDateLogData
                    ↓
            setData(prev => {...prev, ...new})


Phase 2: Smart Caching
─────────────────────────────────────────
CalendarView → loadMonthData (캐시 체크)
                    ↓
            loadedMonthsRef.has(key)?
              ├─ Yes → Early return (0ms)
              └─ No  → loadData → Cache key


Phase 3: React Query
─────────────────────────────────────────
CalendarView → useMonthData(year, month)
                    ↓
            React Query (자동 캐싱)
              ├─ Cache hit → 즉시 반환
              ├─ Stale → Background refetch
              └─ Cache miss → API 호출
```

---

## 🚀 Phase 1: Quick Fix (즉시 적용)

### 개요

**목표**: 최소한의 코드 수정으로 즉시 문제 해결
**소요 시간**: 30분
**위험도**: 낮음

### 설계 사양

#### 수정 1: loadData 함수 - Merge 방식으로 변경

**파일**: `src/hooks/useDateLogAPI.ts`
**위치**: Line 73-88

**Before**:
```typescript
const loadData = useCallback(async (filters?: DateEntryFilters) => {
  try {
    setLoading(true);
    setError(null);

    const entries = await apiClient.getDateEntries(filters);
    const frontendData = DateLogAdapter.toFrontendModel(entries);

    setData(frontendData);  // ❌ Replace
    logger.log('Data loaded successfully', { entryCount: entries.length, filters });
  } catch (err) {
    handleError(err, 'Failed to load data');
  } finally {
    setLoading(false);
  }
}, [handleError]);
```

**After**:
```typescript
const loadData = useCallback(async (filters?: DateEntryFilters) => {
  try {
    setLoading(true);
    setError(null);

    const entries = await apiClient.getDateEntries(filters);

    // ✅ Merge instead of replace
    setData(prev => DateLogAdapter.mergeDateLogData(prev, entries));

    logger.log('Data loaded successfully', {
      entryCount: entries.length,
      filters,
      action: 'merge'
    });
  } catch (err) {
    handleError(err, 'Failed to load data');
  } finally {
    setLoading(false);
  }
}, [handleError]);
```

**변경 이유**:
- `DateLogAdapter.mergeDateLogData`는 이미 구현되어 있고 테스트됨
- `{ ...existing, ...newData }` 패턴으로 안전한 merge
- 기존 날짜 유지, 새 날짜 추가, 중복 날짜 업데이트

**영향 범위**:
- ✅ 월 변경 시 이전 데이터 유지
- ✅ refreshData, revalidateDate 모두 merge 방식으로 동작
- ⚠️ 메모리 사용량 증가 (허용 가능한 수준)

---

#### 수정 2: 초기 useEffect 제거

**파일**: `src/hooks/useDateLogAPI.ts`
**위치**: Line 90-101

**Before**:
```typescript
// Initialize data on mount - load current month only
useEffect(() => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

  loadData({ startDate, endDate });
}, [loadData]);
```

**After**:
```typescript
// ❌ 완전히 제거
// 이유: CalendarView에서 이미 loadMonthData를 호출하므로 중복
```

**제거 근거**:
1. CalendarView가 마운트되면 useEffect 실행
2. currentMonth 초기값은 `new Date()` (현재 월)
3. loadMonthData(현재 연도, 현재 월) 자동 호출
4. 따라서 useDateLogAPI의 초기 로딩은 불필요

**안전성 검증**:
- ✅ CalendarView만 useDateLogAPI 사용 (routes.tsx 확인)
- ✅ MainView도 CalendarView를 포함하므로 문제없음
- ✅ 다른 컴포넌트에서 사용 시 수동 loadData 호출 가능

---

### 예상 효과

#### 성능 개선
- **초기 로딩**: API 호출 2회 → 1회 (50% 감소)
- **월 변경**: 이전 데이터 즉시 표시 (0ms)
- **네트워크**: 불필요한 재로딩 제거

#### 메모리 영향
- **평균 사용자**: 3-5개월 탐색 예상
- **월당 데이터**: ~50KB (20개 PlaceCard * 2.5KB)
- **총 메모리**: ~250KB (5개월 기준) ← **허용 가능**

#### 사용자 경험
- ✅ 월 이동 시 즉각 반응
- ✅ 뒤로 가기 시 즉시 표시
- ✅ 네트워크 의존도 감소

---

### 롤백 전략

**롤백 조건**:
- 메모리 사용량이 1MB 초과
- 데이터 동기화 이슈 발생
- 사용자 피드백 부정적

**롤백 방법**:
```typescript
// Step 1: loadData 원복
setData(frontendData);  // Merge → Replace

// Step 2: 초기 useEffect 재추가
useEffect(() => {
  loadData({ startDate, endDate });
}, [loadData]);
```

**롤백 비용**: 매우 낮음 (2개 파일, 10줄 변경)

---

## 🧠 Phase 2: Smart Caching (선택적 개선)

### 개요

**목표**: 이미 로딩된 월을 추적하여 불필요한 API 호출 방지
**소요 시간**: 1시간
**위험도**: 낮음
**의존성**: Phase 1 완료 후

### 설계 사양

#### 캐싱 전략

**개념**:
- 로딩된 월을 Set으로 추적
- 동일 월 재방문 시 API 호출 skip
- 메모리에 있는 데이터 즉시 사용

**Key 구조**:
```typescript
// Format: "YYYY-MM"
"2025-12"  → 2025년 12월
"2026-01"  → 2026년 1월
```

---

#### 구현 옵션

**Option A: useState (초기 구현)**

```typescript
// src/hooks/useDateLogAPI.ts

const [loadedMonths, setLoadedMonths] = useState(new Set<string>());

const loadMonthData = useCallback(async (year: number, month: number) => {
  const key = `${year}-${String(month).padStart(2, '0')}`;

  // 캐시 히트 체크
  if (loadedMonths.has(key)) {
    logger.log('Month data cache hit', { year, month, key });
    return; // Early return - 0ms 응답
  }

  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

  await loadData({ startDate, endDate });

  // 캐시 업데이트
  setLoadedMonths(prev => new Set([...prev, key]));
  logger.log('Month data cached', { year, month, key });
}, [loadData, loadedMonths]);
```

**장점**:
- 구현 간단
- React DevTools에서 확인 가능

**단점**:
- loadedMonths가 dependency에 있어 useCallback 재생성
- 잠재적 무한 루프 위험

---

**Option B: useRef (권장)**

```typescript
// src/hooks/useDateLogAPI.ts

const loadedMonthsRef = useRef(new Set<string>());

const loadMonthData = useCallback(async (year: number, month: number) => {
  const key = `${year}-${String(month).padStart(2, '0')}`;

  // 캐시 히트 체크
  if (loadedMonthsRef.current.has(key)) {
    logger.log('Month data cache hit', { year, month, key });
    return; // Early return - 0ms 응답
  }

  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

  await loadData({ startDate, endDate });

  // 캐시 업데이트
  loadedMonthsRef.current.add(key);
  logger.log('Month data cached', { year, month, key });
}, [loadData]);
```

**장점**:
- dependency 배열에서 제거 (useCallback 안정적)
- 리렌더링 트리거 없음 (의도된 동작)
- 성능 최적화

**단점**:
- React DevTools에서 직접 확인 불가

---

#### 캐시 무효화 전략

**케이스 1: 데이터 추가 시**
```typescript
const addDate = useCallback(async (date: string, regionName: string) => {
  // ... API 호출

  // 해당 월의 캐시 무효화
  const year = new Date(date).getFullYear();
  const month = new Date(date).getMonth() + 1;
  const key = `${year}-${String(month).padStart(2, '0')}`;

  loadedMonthsRef.current.delete(key);
  logger.log('Cache invalidated', { date, key });
}, [/* ... */]);
```

**케이스 2: refreshData 호출 시**
```typescript
const refreshData = useCallback(async (filters?: DateEntryFilters) => {
  // 전체 캐시 무효화
  loadedMonthsRef.current.clear();
  logger.log('Cache cleared');

  await loadData(filters);
}, [loadData]);
```

**케이스 3: 수동 새로고침 버튼**
```typescript
// CalendarView에 추가
const handleRefreshMonth = () => {
  const key = `${year}-${String(month).padStart(2, '0')}`;
  loadedMonthsRef.current.delete(key);
  loadMonthData(year, month);
};
```

---

### 예상 효과

#### 성능 개선
- **캐시 히트 시**: 0ms 응답 (API 호출 없음)
- **캐시 미스 시**: 기존과 동일 (~200ms)
- **예상 히트율**: 60-70% (사용자 행동 패턴 기반)

#### 네트워크 절감
```
Before Phase 2:
12월 방문 → API 호출
1월 방문 → API 호출
12월 재방문 → API 호출 (3회)

After Phase 2:
12월 방문 → API 호출
1월 방문 → API 호출
12월 재방문 → 캐시 히트 (2회만)
```

**절감률**: 약 33% API 호출 감소

---

### 테스트 시나리오

#### Test 1: 캐시 히트
```
1. 12월 방문 (첫 방문)
   - 예상: API 호출 발생
   - 확인: logger.log('Month data cached', ...)

2. 1월 방문
   - 예상: API 호출 발생
   - 확인: logger.log('Month data cached', ...)

3. 12월 재방문
   - 예상: API 호출 없음 (캐시 히트)
   - 확인: logger.log('Month data cache hit', ...)
   - 확인: 데이터 즉시 표시
```

#### Test 2: 캐시 키 정확성
```
1. 2025년 12월 방문
   - key: "2025-12"

2. 2026년 12월 방문
   - key: "2026-12"

3. 확인: 각각 별도 캐싱
```

#### Test 3: 캐시 무효화
```
1. 12월 방문 → 캐시됨
2. 12월에 새 장소 추가 → addPlace 호출
3. 확인: loadedMonthsRef.current.has("2025-12") === false
4. 12월 재방문 → API 재호출 (최신 데이터)
```

---

## 🎨 Phase 3: React Query (장기 계획)

### 개요

**목표**: 표준 캐싱 라이브러리로 전환, 자동 최적화
**소요 시간**: 4-8시간
**위험도**: 중간
**의존성**: Phase 1, 2 완료 및 검증 후

### 설계 사양

#### 아키텍처 변경

**Before (Custom Hook)**:
```
useDateLogAPI
├── useState (data, loading, error)
├── useEffect (초기 로딩) ← Phase 1에서 제거
├── useCallback (CRUD operations)
├── Manual caching ← Phase 2에서 추가
└── Manual optimistic updates
```

**After (React Query)**:
```
useQuery (월별 데이터)
├── Automatic caching
├── Background refetch
├── Stale-while-revalidate
└── Automatic deduplication

useMutation (CRUD operations)
├── Optimistic updates (simplified)
├── Automatic invalidation
└── Error rollback
```

---

#### Query Key 구조

```typescript
// 월별 조회
['dates', year, month]
// 예: ['dates', 2025, 12] → GET /dates?startDate=2025-12-01&endDate=2025-12-31

// 단일 날짜 조회
['date', dateString]
// 예: ['date', '2025-12-15'] → GET /dates?startDate=2025-12-15&endDate=2025-12-15

// 전체 조회 (필요시)
['dates', 'all']
// 예: ['dates', 'all'] → GET /dates
```

**장점**:
- 명확한 캐시 구조
- 자동 무효화 가능
- DevTools 지원

---

#### Hook 구조

**1. useMonthData (조회)**

```typescript
// src/hooks/useMonthData.ts

import { useQuery } from '@tanstack/react-query';
import { apiClient, DateLogAdapter } from '@/services/api';

export const useMonthData = (year: number, month: number) => {
  return useQuery({
    queryKey: ['dates', year, month],
    queryFn: async () => {
      const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
      const lastDay = new Date(year, month, 0).getDate();
      const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

      const entries = await apiClient.getDateEntries({ startDate, endDate });
      return DateLogAdapter.toFrontendModel(entries);
    },
    staleTime: 5 * 60 * 1000, // 5분간 fresh
    cacheTime: 30 * 60 * 1000, // 30분간 캐시 유지
    refetchOnWindowFocus: false, // 포커스 시 자동 refetch 비활성화
  });
};
```

---

**2. useAddDate (생성 Mutation)**

```typescript
// src/hooks/useAddDate.ts

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/services/api';

export const useAddDate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { date: string; regionName: string }) => {
      return apiClient.createDateEntry(params);
    },

    // Optimistic update
    onMutate: async (params) => {
      const date = new Date(params.date);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const queryKey = ['dates', year, month];

      // Cancel ongoing queries
      await queryClient.cancelQueries({ queryKey });

      // Snapshot current data
      const previousData = queryClient.getQueryData(queryKey);

      // Optimistic update
      queryClient.setQueryData(queryKey, (old: any) => ({
        ...old,
        [params.date]: {
          date: params.date,
          regions: [{
            id: `temp-${Date.now()}`,
            name: params.regionName,
            categories: { cafe: [], restaurant: [], spot: [] },
          }],
        },
      }));

      return { previousData, queryKey };
    },

    // Rollback on error
    onError: (err, variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(context.queryKey, context.previousData);
      }
    },

    // Refetch on success or error
    onSettled: (data, error, variables, context) => {
      if (context?.queryKey) {
        queryClient.invalidateQueries({ queryKey: context.queryKey });
      }
    },
  });
};
```

---

**3. CalendarView 사용 예시**

```typescript
// src/components/calendar/CalendarView.tsx

import { useMonthData } from '@/hooks/useMonthData';
import { useAddDate } from '@/hooks/useAddDate';

export const CalendarView = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth() + 1;

  // ✅ 자동 캐싱, 중복 제거, background refetch
  const { data, isLoading, error } = useMonthData(year, month);

  // ✅ Optimistic updates, automatic invalidation
  const addDateMutation = useAddDate();

  const handleAddDate = async (date: string, region: string) => {
    try {
      await addDateMutation.mutateAsync({ date, regionName: region });
      navigate(`/date/${date}`);
    } catch (err) {
      console.error('Failed to add date:', err);
    }
  };

  // ...
};
```

---

#### QueryClient 설정

```typescript
// src/App.tsx

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5분
      cacheTime: 30 * 60 * 1000, // 30분
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      retry: 1,
    },
    mutations: {
      retry: 1,
    },
  },
});

export const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      {/* ... */}
      {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  );
};
```

---

### 마이그레이션 단계

#### Step 1: React Query 설치 및 설정

```bash
# 의존성 설치
npm install @tanstack/react-query
npm install --save-dev @tanstack/react-query-devtools
```

```typescript
// src/App.tsx 수정
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// QueryClient 생성 및 Provider 설정
```

---

#### Step 2: useMonthData 마이그레이션

```typescript
// 1. 새 파일 생성: src/hooks/useMonthData.ts
// 2. CalendarView에서 useMonthData 사용
// 3. 기존 useDateLogAPI 대신 useMonthData 사용
// 4. 테스트: 월 변경 시 자동 캐싱 확인
```

---

#### Step 3: Mutation Hooks 마이그레이션

```typescript
// 순서대로 마이그레이션:
// 1. useAddDate
// 2. useDeleteDate
// 3. useAddRegion, useUpdateRegion, useDeleteRegion
// 4. useAddPlace, useUpdatePlace, useDeletePlace, useToggleVisited
```

---

#### Step 4: 기존 Hook 제거

```typescript
// useDateLogAPI.ts 제거
// 모든 컴포넌트가 새 hooks 사용 확인 후
```

---

### 예상 효과

#### 개발 생산성
- ✅ 수동 상태 관리 제거 (~200줄 코드 감소)
- ✅ 표준 패턴 사용 (학습 자료 풍부)
- ✅ DevTools로 디버깅 간소화

#### 성능 개선
- ✅ 자동 캐싱 및 무효화
- ✅ 중복 요청 자동 제거
- ✅ Background refetch (UX 향상)
- ✅ Stale-while-revalidate

#### 코드 품질
- ✅ 선언적 API (명확한 의도)
- ✅ 에러 처리 표준화
- ✅ 테스트 용이성 증가

---

### 트레이드오프

#### 장점
- 자동화된 최적화
- 표준 패턴 (커뮤니티 지원)
- DevTools 제공
- 코드 간소화

#### 단점
- 의존성 추가 (~40KB)
- 학습 곡선 (팀원 교육 필요)
- 리팩토링 비용 (4-8시간)
- 기존 코드와의 일시적 불일치

---

## 🗺️ 마이그레이션 전략

### Phase 1 → Phase 2

**조건**:
- Phase 1 완료 및 검증
- 메모리 사용량 모니터링 완료
- 사용자 피드백 긍정적

**절차**:
1. Phase 1 프로덕션 배포
2. 1주일 모니터링
3. loadMonthData에 캐싱 로직 추가
4. 캐시 히트율 측정
5. 문제 없으면 Phase 2 완료

**롤백 시나리오**:
- 캐싱 로직 제거
- Phase 1 상태로 복귀
- 비용: 낮음

---

### Phase 2 → Phase 3

**조건**:
- Phase 2 완료 및 검증
- 팀원 React Query 학습 완료
- 리팩토링 시간 확보 (4-8시간)

**절차**:
1. React Query 설치 및 설정
2. 단계별 마이그레이션:
   - Step 1: useMonthData (조회만)
   - Step 2: useAddDate, useDeleteDate
   - Step 3: 나머지 mutation hooks
3. 각 단계마다 철저한 테스트
4. 기존 useDateLogAPI 제거

**롤백 시나리오**:
- React Query 제거
- 기존 useDateLogAPI 복구
- 비용: 높음 (큰 리팩토링)

---

## 🧪 테스트 계획

### Phase 1 테스트

#### Test 1: 월 변경 시 데이터 유지
```typescript
describe('Phase 1: Data Persistence', () => {
  it('should persist data when changing months', async () => {
    // 1. 12월 방문
    const { result } = renderHook(() => useDateLogAPI());
    await waitFor(() => {
      expect(result.current.data['2025-12-01']).toBeDefined();
    });

    // 2. 1월로 이동
    act(() => {
      result.current.loadMonthData(2026, 1);
    });
    await waitFor(() => {
      expect(result.current.data['2026-01-01']).toBeDefined();
    });

    // 3. 12월 데이터 여전히 존재
    expect(result.current.data['2025-12-01']).toBeDefined();
    expect(result.current.data['2026-01-01']).toBeDefined();
  });
});
```

#### Test 2: 중복 호출 제거
```typescript
describe('Phase 1: Duplicate Call Prevention', () => {
  it('should call API only once on mount', async () => {
    const spy = jest.spyOn(apiClient, 'getDateEntries');

    render(<CalendarView />);

    await waitFor(() => {
      expect(spy).toHaveBeenCalledTimes(1); // Only once!
    });
  });
});
```

---

### Phase 2 테스트

#### Test 1: 캐시 히트
```typescript
describe('Phase 2: Smart Caching', () => {
  it('should not call API on cache hit', async () => {
    const spy = jest.spyOn(apiClient, 'getDateEntries');
    const { result } = renderHook(() => useDateLogAPI());

    // 첫 방문 (API 호출)
    await act(async () => {
      await result.current.loadMonthData(2025, 12);
    });
    expect(spy).toHaveBeenCalledTimes(1);

    // 재방문 (캐시 히트, API 호출 없음)
    await act(async () => {
      await result.current.loadMonthData(2025, 12);
    });
    expect(spy).toHaveBeenCalledTimes(1); // Still 1!
  });
});
```

---

### Phase 3 테스트

#### Test 1: React Query 기본 동작
```typescript
describe('Phase 3: React Query', () => {
  it('should use cached data on remount', async () => {
    const { unmount, rerender } = render(<CalendarView />);

    // 첫 렌더링 (API 호출)
    await waitFor(() => {
      expect(screen.getByText(/12월/)).toBeInTheDocument();
    });

    unmount();
    rerender(<CalendarView />);

    // 재렌더링 (캐시 사용, 즉시 표시)
    expect(screen.getByText(/12월/)).toBeInTheDocument();
  });
});
```

---

## ⚠️ 위험 요소 및 완화

### Phase 1 위험 요소

#### Risk 1: 메모리 누수
**증상**: 사용자가 많은 월을 탐색하면 메모리 증가
**영향**: 장시간 사용 시 브라우저 느려짐
**완화**:
- Phase 2에서 LRU 캐시 구현 고려
- Performance API로 메모리 추적
- 메모리 사용량 >1MB 시 경고

**모니터링**:
```typescript
if (performance.memory) {
  const usedMB = performance.memory.usedJSHeapSize / 1024 / 1024;
  if (usedMB > 50) {
    logger.warn('High memory usage detected', { usedMB });
  }
}
```

---

#### Risk 2: Stale Data
**증상**: 서버 데이터 변경 시 클라이언트와 불일치
**영향**: 사용자가 오래된 데이터 확인
**완화**:
- refreshData 함수로 수동 새로고침 제공
- Phase 3에서 자동 revalidation

**UI 개선**:
```typescript
// "새로고침" 버튼 추가
<button onClick={() => refreshData()}>
  🔄 새로고침
</button>
```

---

#### Risk 3: Dependency Array 이슈
**증상**: useCallback dependency 변경 시 무한 루프 가능
**영향**: 앱 중단
**완화**:
- ESLint `exhaustive-deps` 규칙 활성화
- React DevTools Profiler로 렌더링 확인

---

### Phase 2 위험 요소

#### Risk 1: 캐시 무효화 로직 누락
**증상**: 데이터 추가 후에도 캐시가 유효하다고 판단
**영향**: 새로 추가한 데이터가 표시 안 됨
**완화**:
- CRUD 작업 후 해당 월의 캐시 무효화
- 테스트 케이스 추가

```typescript
const addDate = useCallback(async (date: string, regionName: string) => {
  // ... API 호출

  // ✅ 캐시 무효화
  const key = `${year}-${String(month).padStart(2, '0')}`;
  loadedMonthsRef.current.delete(key);
}, []);
```

---

### Phase 3 위험 요소

#### Risk 1: 큰 리팩토링 범위
**증상**: 많은 파일 수정 필요
**영향**: 회귀 버그 가능성
**완화**:
- 단계별 마이그레이션
- 각 단계마다 철저한 테스트
- 코드 리뷰 필수

---

#### Risk 2: QueryClient 설정 오류
**증상**: staleTime, cacheTime 부적절 설정
**영향**: 과도한 API 호출 또는 stale data
**완화**:
- 초기 설정 검증
- 프로덕션 모니터링
- DevTools로 캐시 상태 확인

---

### 롤백 전략 요약

| Phase | 롤백 조건 | 롤백 비용 | 소요 시간 |
|-------|----------|----------|----------|
| Phase 1 | 메모리 >1MB, 데이터 불일치 | 매우 낮음 | 30분 |
| Phase 2 | 캐싱 로직 버그, 성능 저하 | 낮음 | 1시간 |
| Phase 3 | 큰 버그, 성능 회귀 | 높음 | 4시간 |

---

## 📊 성능 지표 및 모니터링

### KPI 정의

#### Phase 1
- **초기 로딩 시간**: <500ms
- **API 호출 횟수**: 초기 1회 (기존 2회)
- **월 변경 응답 시간**: <200ms
- **메모리 사용량**: <500KB (5개월 기준)

#### Phase 2
- **캐시 히트율**: >60%
- **캐시 히트 응답 시간**: <50ms
- **API 호출 감소율**: >30%

#### Phase 3
- **코드 라인 수**: -30% 감소
- **자동 캐싱 효율**: >80%
- **Background refetch 성공률**: >95%

---

### 모니터링 도구

#### Development
```typescript
// React DevTools Profiler
// React Query DevTools
// Browser Performance API
```

#### Production
```typescript
// Custom logger
logger.log('API call', { endpoint, duration, cached: false });
logger.log('Cache hit', { key, duration: 0, cached: true });

// Performance tracking
performance.mark('api-start');
// ... API call
performance.mark('api-end');
performance.measure('api-duration', 'api-start', 'api-end');
```

---

## ✅ 구현 체크리스트

### Phase 1 (즉시)
- [ ] loadData 함수 수정 (merge 사용)
- [ ] 초기 useEffect 제거
- [ ] 테스트: 월 변경 시 데이터 유지
- [ ] 테스트: 초기 로딩 1회만 호출
- [ ] 프로덕션 배포
- [ ] 1주일 모니터링

### Phase 2 (선택)
- [ ] useRef로 loadedMonths 추가
- [ ] loadMonthData에 캐싱 로직 추가
- [ ] CRUD 작업 후 캐시 무효화
- [ ] 테스트: 캐시 히트 확인
- [ ] 캐시 히트율 측정
- [ ] 프로덕션 배포

### Phase 3 (장기)
- [ ] React Query 설치
- [ ] QueryClient 설정
- [ ] useMonthData 구현
- [ ] useAddDate 구현
- [ ] 나머지 mutation hooks 구현
- [ ] 기존 useDateLogAPI 제거
- [ ] 전체 테스트
- [ ] 프로덕션 배포

---

## 📚 참고 자료

### React Query
- [공식 문서](https://tanstack.com/query/latest)
- [Optimistic Updates](https://tanstack.com/query/latest/docs/react/guides/optimistic-updates)
- [Query Keys](https://tanstack.com/query/latest/docs/react/guides/query-keys)

### 성능 최적화
- [React Performance](https://react.dev/learn/render-and-commit)
- [useCallback](https://react.dev/reference/react/useCallback)
- [useMemo](https://react.dev/reference/react/useMemo)

---

**문서 버전**: 1.0
**최종 수정**: 2025-12-15
**작성자**: Claude Code
