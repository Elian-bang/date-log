# 🏗️ my-date-log 특정일 상세 페이지 개선 설계 문서

## 📋 개요

**목표**: 분석 보고서에서 식별된 에러 원인들을 해결하는 안정적이고 확장 가능한 아키텍처 설계

**설계 원칙**:
- ✅ **관심사 분리 (Separation of Concerns)**: Layer별 책임 명확화
- ✅ **방어적 프로그래밍 (Defensive Programming)**: 에러 상황 대비
- ✅ **점진적 향상 (Progressive Enhancement)**: 기능 실패 시 Fallback UI
- ✅ **호환성 우선 (Backward Compatibility)**: 기존 코드 동작 보장
- ✅ **성능 최적화 (Performance)**: 불필요한 리렌더링 방지

---

## 🏛️ 아키텍처 개요

### 4-Layer Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                  Layer 4: Global State                      │
│  ┌──────────────────────┐  ┌───────────────────────────┐   │
│  │ KakaoMapsContext     │  │ DataSourceContext         │   │
│  │  - SDK 로딩 상태      │  │  - API/LocalStorage 관리  │   │
│  └──────────────────────┘  └───────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                  Layer 3: UI Components                     │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ DateDetailView (Container)                             │ │
│  │  ├─ LoadingState (idle/loading/revalidating)          │ │
│  │  ├─ ErrorState (retryable errors)                     │ │
│  │  ├─ EmptyState (no data)                              │ │
│  │  └─ Content (data display)                            │ │
│  │      ├─ MapView (with SDK fallback)                   │ │
│  │      └─ RegionList                                    │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                  Layer 2: Hooks (State Logic)               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ useDateLogAPI                                          │ │
│  │  ├─ State: { status, data, error, isEmpty }           │ │
│  │  ├─ RetryStrategy (재시도 로직)                         │ │
│  │  └─ ErrorClassifier (에러 분류)                        │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                  Layer 1: API Client                        │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ ApiClient (HTTP 통신)                                   │ │
│  │  ├─ Retry Logic (3회 재시도)                           │ │
│  │  ├─ Timeout (15초)                                     │ │
│  │  └─ Error Classification                              │ │
│  └────────────────────────────────────────────────────────┘ │
│                              ↓                              │
│                    Backend REST API                         │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔧 Layer 1: API Client Layer

### 설계 목표
- 안정적인 네트워크 통신
- 지능적인 재시도 전략
- 명확한 에러 분류

### 핵심 컴포넌트

#### 1. ErrorClassifier (에러 분류기)

**파일**: `src/services/api/errors/ErrorClassifier.ts`

```typescript
export interface ErrorMetadata {
  code: string;                // 'TIMEOUT', 'NETWORK_ERROR', etc.
  message: string;              // 원본 에러 메시지
  userMessage: string;          // 사용자용 한국어 메시지
  retryable: boolean;           // 재시도 가능 여부
  severity: 'info' | 'warning' | 'error' | 'critical';
}

export class ErrorClassifier {
  classify(error: unknown): ErrorMetadata {
    if (error instanceof ApiClientError) {
      return this.classifyApiError(error);
    }
    return this.classifyUnknownError(error);
  }

  private classifyApiError(error: ApiClientError): ErrorMetadata {
    // 에러 코드별 분류 로직
    switch (error.code) {
      case 'TIMEOUT':
        return {
          code: 'TIMEOUT',
          message: error.message,
          userMessage: '⏱️ 서버 응답 시간이 초과되었습니다 (15초)\n잠시 후 다시 시도해주세요.',
          retryable: true,
          severity: 'warning'
        };

      case 'NETWORK_ERROR':
        return {
          code: 'NETWORK_ERROR',
          message: error.message,
          userMessage: '📡 인터넷 연결을 확인해주세요\n네트워크 상태를 확인하고 다시 시도해주세요.',
          retryable: true,
          severity: 'error'
        };

      case 'HTTP_404':
        return {
          code: 'NOT_FOUND',
          message: error.message,
          userMessage: '🔍 해당 날짜의 데이터를 찾을 수 없습니다',
          retryable: false,
          severity: 'info'
        };

      case 'HTTP_500':
      case 'HTTP_502':
      case 'HTTP_503':
        return {
          code: 'SERVER_ERROR',
          message: error.message,
          userMessage: '🚨 서버에 일시적인 문제가 발생했습니다\n잠시 후 다시 시도해주세요.',
          retryable: true,
          severity: 'error'
        };

      default:
        return this.classifyUnknownError(error);
    }
  }
}
```

**장점**:
- ✅ 에러 타입별 명확한 사용자 메시지
- ✅ 재시도 가능 여부 자동 판단
- ✅ 심각도(severity) 기반 UI 차별화 가능

#### 2. RetryStrategy (재시도 전략)

**파일**: `src/services/api/retry/RetryStrategy.ts`

```typescript
export interface RetryConfig {
  maxAttempts: number;          // 최대 재시도 횟수
  baseDelay: number;            // 기본 딜레이 (ms)
  maxDelay?: number;            // 최대 딜레이 (ms)
  shouldRetry?: (error: unknown) => boolean;
}

export class RetryStrategy {
  async execute<T>(
    fn: () => Promise<T>,
    config: RetryConfig
  ): Promise<T> {
    const { maxAttempts, baseDelay, maxDelay = 10000, shouldRetry } = config;

    let lastError: unknown;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;

        // 마지막 시도면 바로 throw
        if (attempt === maxAttempts) {
          throw error;
        }

        // 재시도 불가능한 에러면 바로 throw
        if (shouldRetry && !shouldRetry(error)) {
          throw error;
        }

        // 지수 백오프 계산: 1초, 2초, 4초
        const delay = Math.min(
          baseDelay * Math.pow(2, attempt - 1),
          maxDelay
        );

        logger.warn(`Retry attempt ${attempt}/${maxAttempts} after ${delay}ms`, { error });

        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError;
  }
}

// 헬퍼 함수
export function isRetryableError(error: unknown): boolean {
  if (error instanceof ApiClientError) {
    const retryableCodes = [
      'TIMEOUT',
      'NETWORK_ERROR',
      'HTTP_500',
      'HTTP_502',
      'HTTP_503'
    ];
    return retryableCodes.includes(error.code);
  }
  return false;
}
```

**재시도 시나리오**:
```
Attempt 1: 즉시 시도 → 실패
  ↓ 1초 대기
Attempt 2: 재시도 → 실패
  ↓ 2초 대기
Attempt 3: 재시도 → 실패
  ↓ throw error
```

---

## 🎣 Layer 2: Hook Layer

### 설계 목표
- 명확한 상태 모델
- 데이터 없음 vs 에러 구분
- 로딩 상태 세분화

### 상태 모델 설계

**파일**: `src/types/state.ts` (신규)

```typescript
export type LoadingStatus =
  | 'idle'          // 초기 상태 (데이터 로드 전)
  | 'loading'       // 첫 로딩 중
  | 'revalidating'  // 재검증 중 (기존 데이터 유지)
  | 'success'       // 성공
  | 'error';        // 에러

export interface DateLogState {
  status: LoadingStatus;
  data: DateLogData;
  error: ErrorMetadata | null;
  isEmpty: boolean;              // 데이터는 있지만 비어있음
  lastFetched: number | null;    // 마지막 페치 시각 (캐싱용)
}

export interface DateLogActions {
  revalidate: (dateId: string) => Promise<void>;
  refresh: () => Promise<void>;
  clearError: () => void;
  reset: () => void;
}
```

### useDateLogAPI 개선

**파일**: `src/hooks/useDateLogAPI.ts` (대폭 수정)

```typescript
export const useDateLogAPI = (): UseDateLogAPIReturn => {
  const [state, setState] = useState<DateLogState>({
    status: 'idle',    // ✅ 초기값 idle로 변경 (기존: loading=true)
    data: {},
    error: null,
    isEmpty: false,
    lastFetched: null
  });

  const retryStrategy = useMemo(() => new RetryStrategy(), []);
  const errorClassifier = useMemo(() => new ErrorClassifier(), []);

  // ✅ 재검증 로직 개선 (재시도 통합)
  const revalidate = useCallback(async (dateId: string) => {
    // 기존 데이터가 있으면 revalidating, 없으면 loading
    setState(prev => ({
      ...prev,
      status: prev.data[dateId] ? 'revalidating' : 'loading',
      error: null
    }));

    try {
      const entries = await retryStrategy.execute(
        () => apiClient.getDateEntries({
          startDate: dateId,
          endDate: dateId
        }),
        {
          maxAttempts: 3,
          baseDelay: 1000,
          shouldRetry: isRetryableError
        }
      );

      const frontendData = DateLogAdapter.toFrontendModel(entries);
      const isEmpty = Object.keys(frontendData).length === 0;

      setState(prev => ({
        status: 'success',
        data: { ...prev.data, ...frontendData },
        error: null,
        isEmpty,
        lastFetched: Date.now()
      }));

    } catch (err) {
      const errorMeta = errorClassifier.classify(err);

      setState(prev => ({
        ...prev,
        status: 'error',
        error: errorMeta
      }));

      throw err;
    }
  }, [retryStrategy, errorClassifier]);

  // ✅ Backward Compatibility
  const loading = state.status === 'loading' || state.status === 'revalidating';
  const error = state.error?.userMessage || null;

  return {
    state,
    actions: { revalidate, refresh, clearError, reset },
    // 기존 인터페이스
    loading,
    error,
    data: state.data,
  };
};
```

---

## 🎨 Layer 3: UI Component Layer

### 컴포넌트 구조

```
DateDetailView (Container)
├── DateDetailLoadingState
├── DateDetailErrorState
├── DateDetailEmptyState
└── DateDetailContent
    ├── MapSection
    │   └── MapView
    └── RegionList
```

### DateDetailView 리팩토링

**파일**: `src/components/detail/DateDetailView.tsx`

```typescript
export const DateDetailView = ({ onBackToCalendar }) => {
  const { dateId } = useParams();
  const { state, actions } = useDateLogAPI();

  useEffect(() => {
    if (dateId && state.status === 'idle') {
      actions.revalidate(dateId);
    }
  }, [dateId, state.status, actions]);

  // 상태별 렌더링
  if (state.status === 'loading') {
    return <DateDetailLoadingState variant="initial" />;
  }

  if (state.status === 'error' && state.error) {
    return (
      <DateDetailErrorState
        error={state.error}
        onRetry={() => dateId && actions.revalidate(dateId)}
        onBack={onBackToCalendar}
      />
    );
  }

  if (state.isEmpty) {
    return (
      <DateDetailEmptyState
        dateId={dateId}
        onAddRegion={() => setIsAddRegionOpen(true)}
        onBack={onBackToCalendar}
      />
    );
  }

  return (
    <div className="bg-gray-50">
      {state.status === 'revalidating' && <DateDetailLoadingState variant="revalidating" />}
      <DateDetailContent dateLog={state.data[dateId]} />
    </div>
  );
};
```

---

## 🌐 Layer 4: Global State

### KakaoMapsContext

**파일**: `src/contexts/KakaoMapsContext.tsx`

```typescript
interface KakaoMapsContextValue {
  loaded: boolean;
  loading: boolean;
  error: Error | null;
  reload: () => Promise<void>;
}

export const KakaoMapsProvider: React.FC<{ children }> = ({ children }) => {
  const [state, setState] = useState({
    loaded: false,
    loading: true,
    error: null
  });

  useEffect(() => {
    const loadSDK = async () => {
      try {
        // SDK 로딩 로직
        setState({ loaded: true, loading: false, error: null });
      } catch (err) {
        setState({ loaded: false, loading: false, error: err });
      }
    };
    loadSDK();
  }, []);

  return (
    <KakaoMapsContext.Provider value={state}>
      {children}
    </KakaoMapsContext.Provider>
  );
};
```

---

## 📁 파일 구조

```
src/
├── services/api/
│   ├── errors/
│   │   ├── ErrorClassifier.ts       ✅ 신규
│   │   └── ErrorMetadata.ts         ✅ 신규
│   ├── retry/
│   │   └── RetryStrategy.ts         ✅ 신규
│   └── client.ts                    🔧 수정
│
├── contexts/
│   ├── KakaoMapsContext.tsx        ✅ 신규
│   └── DataSourceContext.tsx       ✅ 신규
│
├── hooks/
│   └── useDateLogAPI.ts            🔧 대폭 수정
│
├── components/detail/
│   ├── states/
│   │   ├── DateDetailLoadingState.tsx    ✅ 신규
│   │   ├── DateDetailErrorState.tsx      ✅ 신규
│   │   └── DateDetailEmptyState.tsx      ✅ 신규
│   ├── DateDetailView.tsx          🔧 대폭 수정
│   └── DateDetailContent.tsx       ✅ 신규
│
├── components/map/
│   ├── MapView.tsx                 🔧 수정
│   └── PlaceListView.tsx           ✅ 신규
│
└── types/
    └── state.ts                    ✅ 신규
```

---

## 🚀 구현 로드맵

### Phase 1: API Layer (1-2시간)
1. ErrorClassifier 생성
2. RetryStrategy 생성
3. ApiClient 타임아웃 15초로 조정
4. 단위 테스트

### Phase 2: Hook Layer (2-3시간)
1. DateLogState 타입 정의
2. useDateLogAPI 상태 모델 변경
3. isEmpty 플래그 추가
4. Backward compatibility 유지

### Phase 3: Global State (1-2시간)
1. KakaoMapsContext 생성
2. DataSourceContext 생성
3. App.tsx Provider 추가

### Phase 4: UI Components (3-4시간)
1. 상태별 컴포넌트 생성
2. MapView 개선
3. DateDetailView 리팩토링

### Phase 5: 통합 테스트 (1-2시간)
1. 정상 플로우 테스트
2. 에러 플로우 테스트
3. E2E 테스트

---

## ⚡ 성능 최적화

### React.memo 적용
```typescript
export const DateDetailErrorState = React.memo(
  ({ error, onRetry, onBack }) => { /* ... */ },
  (prev, next) => prev.error.code === next.error.code
);
```

### useCallback 최적화
```typescript
const handleRetry = useCallback(() => {
  actions.clearError();
  actions.revalidate(dateId);
}, [actions, dateId]);
```

---

## 📊 마이그레이션 전략

### Backward Compatibility
- 기존 `loading`, `error`, `data` 인터페이스 유지
- 새로운 `state`, `actions` 인터페이스 추가
- 점진적 마이그레이션 가능

### 롤백 계획
각 Phase는 독립적이므로 개별 롤백 가능

---

## ✅ 체크리스트

### Phase 1: API Layer
- [ ] ErrorClassifier 생성
- [ ] RetryStrategy 생성
- [ ] ApiClient 수정
- [ ] Unit Test

### Phase 2: Hook Layer
- [ ] DateLogState 정의
- [ ] useDateLogAPI 수정
- [ ] isEmpty 플래그 추가

### Phase 3: Global State
- [ ] KakaoMapsContext 생성
- [ ] DataSourceContext 생성
- [ ] App.tsx 수정

### Phase 4: UI Components
- [ ] 상태별 컴포넌트 생성
- [ ] DateDetailView 리팩토링

### Phase 5: 테스트
- [ ] Unit Tests
- [ ] Integration Tests
- [ ] E2E Tests

---

## 📈 예상 효과

### 단기 (1주일)
- 개발 환경 에러율: 100% → 0%
- 프로덕션 에러율: 90% 감소
- 재시도 성공률: 30% → 80%
- Maps 크래시 완전 제거

### 장기 (1개월)
- 오프라인 지원 완성
- 자동 폴백 시스템
- 전체 에러율 95% 감소
- 사용자 만족도 향상
