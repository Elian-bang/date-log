# 워크플로우: "Back to Calendar" 버그 수정

## 📋 개요

**문제**: 데이터가 없는 날짜를 클릭하여 장소를 입력하면 "Back to Calendar" 메시지가 표시되는 버그

**목표**: 데이터 무결성 보장 및 사용자 경험 개선

**예상 소요 시간**: 9-15시간

**우선순위**: 🔴 Critical

---

## 🎯 전문가 팀 구성

### Phase 1: 데이터 레이어 수정
- **주도**: Backend Architect (데이터 변환 로직, 상태 관리)
- **지원**: Quality Engineer (테스트 주도 개발)
- **검토**: Root Cause Analyst (엣지 케이스 검증)

### Phase 2: 컴포넌트 에러 처리
- **주도**: Frontend Architect (React 생명주기, 에러 바운더리)
- **지원**: Backend Architect (API 에러 분류)
- **검토**: Quality Engineer (사용자 경험 검증)

### Phase 3: Race Condition 방지
- **주도**: Frontend Architect (비동기 상태 관리)
- **지원**: Backend Architect (API 타이밍 보장)
- **검토**: Performance Engineer (타이밍 분석)

### Phase 4: 검증 및 테스팅
- **주도**: Quality Engineer (테스트 전략, 커버리지)
- **지원**: Frontend Architect (통합 테스트)
- **지원**: Performance Engineer (E2E 테스트)
- **검토**: Root Cause Analyst (회귀 방지)

---

## 📊 Phase 1: Critical Data Layer Fix (2-3시간)

### 🎯 목표
`mergeDateLogData` 함수의 얕은 병합으로 인한 데이터 손실 문제 해결

### 📍 대상 파일
- `src/services/api/adapter.ts`

### 📝 작업 항목

#### 1.1. 현재 동작 문서화 및 테스트 작성
```typescript
// src/services/api/__tests__/adapter.test.ts

describe('mergeDateLogData - Bug Documentation', () => {
  test('현재 버그: 동일 날짜의 새 region이 기존 region을 덮어씀', () => {
    const existing: DateLogData = {
      '2025-01-25': {
        date: '2025-01-25',
        regions: [
          { id: 'uuid1', name: '삼송', categories: { cafe: [], restaurant: [], spot: [] } }
        ]
      }
    };

    const newEntries: DateEntryResponse[] = [{
      id: 'uuid2',
      date: '2025-01-25',
      region: '연신내',
      cafes: [],
      restaurants: [],
      spots: []
    }];

    const result = DateLogAdapter.mergeDateLogData(existing, newEntries);

    // 현재 버그: regions 배열이 하나만 남음
    expect(result['2025-01-25'].regions.length).toBe(1); // ❌ 버그 확인
    expect(result['2025-01-25'].regions[0].name).toBe('연신내');
  });
});
```

**담당**: Quality Engineer
**소요 시간**: 30분
**산출물**: 버그 재현 테스트 케이스

---

#### 1.2. `mergeDateLogData` 함수 수정
```typescript
// src/services/api/adapter.ts

/**
 * Merge date log data with proper region deduplication
 * Merges regions instead of replacing entire date entries
 */
static mergeDateLogData(existing: DateLogData, newEntries: DateEntryResponse[]): DateLogData {
  const newData = this.toFrontendModel(newEntries);
  const merged = { ...existing };

  Object.entries(newData).forEach(([date, newDateLog]) => {
    if (merged[date]) {
      // ✅ 기존 날짜가 있으면 regions 배열 병합
      const existingRegionIds = new Set(merged[date].regions.map(r => r.id));
      const newRegions = newDateLog.regions.filter(r => !existingRegionIds.has(r.id));

      merged[date] = {
        ...merged[date],
        regions: [...merged[date].regions, ...newRegions]
      };
    } else {
      // 새 날짜면 그대로 추가
      merged[date] = newDateLog;
    }
  });

  return merged;
}
```

**담당**: Backend Architect
**소요 시간**: 1시간
**산출물**: 수정된 `mergeDateLogData` 함수

---

#### 1.3. 포괄적 테스트 케이스 작성
```typescript
describe('mergeDateLogData - Fixed Behavior', () => {
  test('동일 날짜에 여러 region 병합', () => {
    const existing: DateLogData = {
      '2025-01-25': {
        date: '2025-01-25',
        regions: [
          { id: 'uuid1', name: '삼송', categories: { cafe: [], restaurant: [], spot: [] } }
        ]
      }
    };

    const newEntries: DateEntryResponse[] = [{
      id: 'uuid2',
      date: '2025-01-25',
      region: '연신내',
      cafes: [],
      restaurants: [],
      spots: []
    }];

    const result = DateLogAdapter.mergeDateLogData(existing, newEntries);

    // ✅ 두 region 모두 유지됨
    expect(result['2025-01-25'].regions.length).toBe(2);
    expect(result['2025-01-25'].regions.map(r => r.name)).toEqual(['삼송', '연신내']);
  });

  test('중복 region ID는 추가하지 않음', () => {
    const existing: DateLogData = {
      '2025-01-25': {
        date: '2025-01-25',
        regions: [
          { id: 'uuid1', name: '삼송', categories: { cafe: [], restaurant: [], spot: [] } }
        ]
      }
    };

    const newEntries: DateEntryResponse[] = [{
      id: 'uuid1', // 동일 ID
      date: '2025-01-25',
      region: '삼송',
      cafes: [{ id: 'cafe1', name: '새 카페', ... }],
      restaurants: [],
      spots: []
    }];

    const result = DateLogAdapter.mergeDateLogData(existing, newEntries);

    // ✅ 중복 추가 방지
    expect(result['2025-01-25'].regions.length).toBe(1);
  });

  test('빈 newEntries 배열 처리', () => {
    const existing: DateLogData = {
      '2025-01-25': { date: '2025-01-25', regions: [...] }
    };

    const result = DateLogAdapter.mergeDateLogData(existing, []);

    // ✅ 기존 데이터 유지
    expect(result).toEqual(existing);
  });

  test('여러 날짜 동시 병합', () => {
    const existing: DateLogData = {
      '2025-01-25': { date: '2025-01-25', regions: [{ id: 'uuid1', name: '삼송', ... }] }
    };

    const newEntries: DateEntryResponse[] = [
      { id: 'uuid2', date: '2025-01-25', region: '연신내', ... },
      { id: 'uuid3', date: '2025-01-26', region: '홍대', ... }
    ];

    const result = DateLogAdapter.mergeDateLogData(existing, newEntries);

    // ✅ 모든 날짜 및 region 유지
    expect(Object.keys(result)).toEqual(['2025-01-25', '2025-01-26']);
    expect(result['2025-01-25'].regions.length).toBe(2);
  });
});
```

**담당**: Quality Engineer
**소요 시간**: 1시간
**산출물**: 포괄적 테스트 스위트

---

#### 1.4. 함수 문서화 업데이트
```typescript
/**
 * Merge date log data with proper region deduplication
 *
 * Merges new date entries with existing data while preserving all regions.
 * If a date already exists, new regions are appended to the existing regions array.
 * Duplicate region IDs are automatically filtered out.
 *
 * @param existing - Current DateLogData state
 * @param newEntries - New date entries from backend API
 * @returns Merged DateLogData with all regions preserved
 *
 * @example
 * const existing = { '2025-01-25': { regions: [{ id: 'uuid1', name: '삼송' }] } };
 * const newEntries = [{ id: 'uuid2', date: '2025-01-25', region: '연신내' }];
 * const merged = DateLogAdapter.mergeDateLogData(existing, newEntries);
 * // Result: { '2025-01-25': { regions: [{ id: 'uuid1', name: '삼송' }, { id: 'uuid2', name: '연신내' }] } }
 */
```

**담당**: Backend Architect
**소요 시간**: 30분
**산출물**: JSDoc 주석 업데이트

---

### ✅ Phase 1 Quality Gates

- [ ] 모든 단위 테스트 통과
- [ ] adapter.ts 코드 커버리지 ≥ 80%
- [ ] TypeScript 에러 없음
- [ ] 역호환성 검증 완료
- [ ] 코드 리뷰 완료

### 🔄 Rollback Plan
- 이전 `mergeDateLogData` 구현으로 되돌리기
- 새 단위 테스트 임시 제거
- **위험도**: Low (격리된 함수 변경)

---

## 📊 Phase 2: Component Error Handling (2-4시간)

### 🎯 목표
DateDetailView 컴포넌트의 에러 처리 및 상태 갱신 개선

### 📍 대상 파일
- `src/components/detail/DateDetailView.tsx`
- `src/hooks/useDateLogAPI.ts`

### 📝 작업 항목

#### 2.1. 에러 상태 관리 추가
```typescript
// src/components/detail/DateDetailView.tsx

export const DateDetailView = ({ onBackToCalendar }: DateDetailViewProps) => {
  // ... 기존 코드

  // ✅ 추가: 장소 작업 에러 상태
  const [placeOperationError, setPlaceOperationError] = useState<string | null>(null);
  const [isPlaceOperationLoading, setIsPlaceOperationLoading] = useState(false);

  // ... 기존 코드
};
```

**담당**: Frontend Architect
**소요 시간**: 30분
**산출물**: 에러 상태 변수 추가

---

#### 2.2. `handlePlaceFormSubmit` 개선
```typescript
const handlePlaceFormSubmit = useCallback(async (data: PlaceFormData) => {
  if (!dateId) return;

  // ✅ 로딩 상태 시작
  setIsPlaceOperationLoading(true);
  setPlaceOperationError(null);

  try {
    if (editingPlace) {
      await updatePlace(dateId, currentRegionId, currentCategory, editingPlace.id, {
        name: data.name,
        memo: data.memo,
        image: data.image,
        link: data.link,
        coordinates: data.coordinates,
        ...(currentCategory === 'restaurant' && { type: data.type }),
      });
    } else {
      await addPlace(dateId, currentRegionId, currentCategory, {
        name: data.name,
        memo: data.memo,
        image: data.image,
        link: data.link,
        coordinates: data.coordinates,
        visited: false,
        ...(currentCategory === 'restaurant' && { type: data.type! }),
      });
    }

    // ✅ 성공 후 명시적 재검증
    if (revalidateDate) {
      await revalidateDate(dateId);
    }

    // ✅ 로딩 상태 종료
    setIsPlaceOperationLoading(false);

  } catch (err) {
    console.error('Failed to save place:', err);

    // ✅ 사용자 친화적 에러 메시지
    setPlaceOperationError(
      editingPlace
        ? '장소 수정에 실패했습니다. 다시 시도해주세요.'
        : '장소 추가에 실패했습니다. 다시 시도해주세요.'
    );

    setIsPlaceOperationLoading(false);
  }
}, [dateId, editingPlace, currentRegionId, currentCategory, updatePlace, addPlace, revalidateDate]);
```

**담당**: Frontend Architect
**소요 시간**: 1.5시간
**산출물**: 개선된 에러 처리 로직

---

#### 2.3. 사용자 피드백 UI 추가
```typescript
// DateDetailView 렌더링 부분에 추가

{/* ✅ 장소 작업 에러 메시지 */}
{placeOperationError && (
  <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 max-w-md w-full px-4">
    <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded shadow-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FiAlertCircle className="text-red-500 w-5 h-5 flex-shrink-0" />
          <p className="text-red-700 text-sm">{placeOperationError}</p>
        </div>
        <button
          onClick={() => setPlaceOperationError(null)}
          className="text-red-500 hover:text-red-700"
        >
          <FiX className="w-5 h-5" />
        </button>
      </div>
    </div>
  </div>
)}

{/* ✅ 장소 작업 로딩 오버레이 */}
{isPlaceOperationLoading && (
  <div className="fixed inset-0 z-40 bg-black bg-opacity-30 flex items-center justify-center">
    <div className="bg-white rounded-lg p-6 shadow-xl">
      <LoadingSpinner message={editingPlace ? "장소 수정 중..." : "장소 추가 중..."} />
    </div>
  </div>
)}
```

**담당**: Frontend Architect
**소요 시간**: 1시간
**산출물**: 에러 및 로딩 UI 컴포넌트

---

#### 2.4. 에러 복구 시나리오 테스트
```typescript
// src/components/detail/__tests__/DateDetailView.test.tsx

describe('DateDetailView - Error Handling', () => {
  test('장소 추가 실패 시 에러 메시지 표시', async () => {
    const mockAddPlace = jest.fn().mockRejectedValue(new Error('Network error'));

    render(<DateDetailView />, {
      mockHooks: { addPlace: mockAddPlace }
    });

    // 장소 추가 시도
    const addButton = screen.getByText('카페 추가');
    await userEvent.click(addButton);

    // 폼 작성 및 제출
    await userEvent.type(screen.getByLabelText('상호명'), '테스트 카페');
    await userEvent.type(screen.getByLabelText('지도 링크'), 'https://map.kakao.com/...');
    await userEvent.click(screen.getByText('추가'));

    // 에러 메시지 표시 확인
    expect(await screen.findByText('장소 추가에 실패했습니다. 다시 시도해주세요.')).toBeInTheDocument();
  });

  test('에러 메시지 닫기 버튼 동작', async () => {
    // ... 에러 발생 시나리오

    const closeButton = screen.getByLabelText('Close error');
    await userEvent.click(closeButton);

    expect(screen.queryByText('장소 추가에 실패했습니다.')).not.toBeInTheDocument();
  });

  test('로딩 중 중복 제출 방지', async () => {
    const mockAddPlace = jest.fn().mockImplementation(
      () => new Promise(resolve => setTimeout(resolve, 1000))
    );

    render(<DateDetailView />, {
      mockHooks: { addPlace: mockAddPlace }
    });

    // 첫 번째 제출
    const submitButton = screen.getByText('추가');
    await userEvent.click(submitButton);

    // 로딩 중 버튼 비활성화 확인
    expect(submitButton).toBeDisabled();
  });
});
```

**담당**: Quality Engineer
**소요 시간**: 1시간
**산출물**: 에러 처리 통합 테스트

---

### ✅ Phase 2 Quality Gates

- [ ] 에러 상태가 사용자에게 정확히 표시됨
- [ ] 로딩 상태가 중복 제출 방지
- [ ] 롤백 메커니즘 테스트 완료
- [ ] 에러 메시지가 사용자 친화적 (한국어)
- [ ] 모든 통합 테스트 통과

### 🔄 Rollback Plan
- 에러 처리 추가 부분 제거
- 이전 컴포넌트 동작 유지
- **위험도**: Very Low (추가 변경만 포함)

---

## 📊 Phase 3: Race Condition Prevention (2-3시간)

### 🎯 목표
날짜 생성 후 네비게이션 시 발생하는 race condition 방지

### 📍 대상 파일
- `src/components/calendar/CalendarView.tsx`
- `src/hooks/useDateLogAPI.ts`

### 📝 작업 항목

#### 3.1. `handleAddDate` 개선
```typescript
// src/components/calendar/CalendarView.tsx

const handleAddDate = useCallback(async (date: string, region: string) => {
  try {
    // ✅ 날짜 생성 및 상태 업데이트 대기
    await addDate(date, region);

    // ✅ 상태 동기화 확인: 해당 월 데이터 명시적 로드
    const dateObj = new Date(date);
    const year = dateObj.getFullYear();
    const month = dateObj.getMonth() + 1;

    if (loadMonthData) {
      await loadMonthData(year, month);
    }

    // ✅ 상태 확인 후 네비게이션
    // data[date]가 존재하는지 확인
    const maxRetries = 3;
    let retries = 0;

    while (retries < maxRetries) {
      if (data[date]) {
        // 데이터가 확인되면 네비게이션
        navigate(`/date/${date}`);
        return;
      }

      // 100ms 대기 후 재시도
      await new Promise(resolve => setTimeout(resolve, 100));
      retries++;
    }

    // 최대 재시도 후에도 데이터 없으면 강제 네비게이션
    console.warn('Date data not found in state, navigating anyway');
    navigate(`/date/${date}`);

  } catch (err) {
    console.error('Failed to add date:', err);
    // ✅ 에러 상태 표시 (기존과 동일)
  }
}, [addDate, loadMonthData, data, navigate]);
```

**담당**: Frontend Architect
**소요 시간**: 1.5시간
**산출물**: 상태 동기화 로직 추가

---

#### 3.2. Timeout 보호 추가
```typescript
// src/hooks/useDateLogAPI.ts

const addDate = useCallback(async (date: string, regionName: string) => {
  saveSnapshot();

  try {
    setError(null);

    // ✅ Timeout 보호: 10초 내 완료되지 않으면 에러
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Request timeout')), 10000)
    );

    // Optimistic update
    const tempId = `temp-${Date.now()}`;
    setData((prev) => ({
      ...prev,
      [date]: {
        date,
        regions: [
          {
            id: tempId,
            name: regionName,
            categories: { cafe: [], restaurant: [], spot: [] },
          },
        ],
      },
    }));

    // ✅ API 호출과 timeout 경쟁
    const newEntry = await Promise.race([
      defaultRetryStrategy.execute(
        () => apiClient.createDateEntry({ date, region: regionName }),
        'addDate'
      ),
      timeoutPromise
    ]) as DateEntryResponse;

    // Update with real data
    setData((prev) => {
      const updated = DateLogAdapter.mergeDateLogData(prev, [newEntry]);
      if (updated[date]) {
        updated[date].regions = updated[date].regions.filter(r => r.id !== tempId);
      }
      return updated;
    });

    // Invalidate cache
    const dateObj = new Date(date);
    const key = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`;
    loadedMonthsRef.current.delete(key);

    logger.log('Date added successfully', { date, regionName, cacheInvalidated: key });

  } catch (err) {
    restoreSnapshot();
    handleError(err, 'Failed to add date');
    throw err;
  }
}, [saveSnapshot, restoreSnapshot, handleError]);
```

**담당**: Backend Architect
**소요 시간**: 1시간
**산출물**: Timeout 보호 메커니즘

---

#### 3.3. 빠른 네비게이션 시나리오 테스트
```typescript
// src/components/calendar/__tests__/CalendarView.test.tsx

describe('CalendarView - Navigation Timing', () => {
  test('날짜 생성 후 상태 동기화 확인', async () => {
    const mockAddDate = jest.fn().mockResolvedValue(undefined);
    const mockLoadMonthData = jest.fn().mockResolvedValue(undefined);
    const mockNavigate = jest.fn();

    render(<CalendarView />, {
      mockHooks: {
        addDate: mockAddDate,
        loadMonthData: mockLoadMonthData
      },
      mockNavigate
    });

    // 날짜 추가
    await userEvent.click(screen.getByText('날짜 추가'));
    await userEvent.type(screen.getByLabelText('날짜'), '2025-01-25');
    await userEvent.type(screen.getByLabelText('지역'), '삼송');
    await userEvent.click(screen.getByText('추가'));

    // 순서 확인
    expect(mockAddDate).toHaveBeenCalledWith('2025-01-25', '삼송');
    await waitFor(() => {
      expect(mockLoadMonthData).toHaveBeenCalledWith(2025, 1);
    });
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/date/2025-01-25');
    });
  });

  test('느린 API 응답 시 timeout 처리', async () => {
    const slowAddDate = jest.fn().mockImplementation(
      () => new Promise(resolve => setTimeout(resolve, 15000))
    );

    render(<CalendarView />, {
      mockHooks: { addDate: slowAddDate }
    });

    // 날짜 추가 시도
    await userEvent.click(screen.getByText('날짜 추가'));
    // ... 폼 작성
    await userEvent.click(screen.getByText('추가'));

    // Timeout 에러 확인 (10초)
    await waitFor(() => {
      expect(screen.getByText(/timeout/i)).toBeInTheDocument();
    }, { timeout: 11000 });
  });
});
```

**담당**: Quality Engineer
**소요 시간**: 30분
**산출물**: 타이밍 테스트 케이스

---

### ✅ Phase 3 Quality Gates

- [ ] 빠른 네비게이션 테스트에서 race condition 없음
- [ ] 네비게이션 전 상태 일관성 검증
- [ ] Timeout 처리가 무한 로딩 방지
- [ ] 느린 네트워크 조건에서도 정상 동작
- [ ] 모든 E2E 테스트 통과

### 🔄 Rollback Plan
- 네비게이션 타이밍 변경 되돌리기
- 즉시 네비게이션으로 복원
- **위험도**: Low (단일 컴포넌트에 제한)

---

## 📊 Phase 4: Validation & Testing (3-5시간)

### 🎯 목표
포괄적 테스트 스위트 및 회귀 방지 검증

### 📝 작업 항목

#### 4.1. 통합 테스트 스위트
```typescript
// src/__tests__/integration/date-place-workflow.test.tsx

describe('Complete Date-Place Workflow', () => {
  test('전체 사용자 플로우: 날짜 생성 → 장소 추가 → 데이터 확인', async () => {
    // 1. 초기 상태: 빈 캘린더
    render(<App />);
    expect(screen.getByText('총 0개의 데이트 기록')).toBeInTheDocument();

    // 2. 날짜 추가
    await userEvent.click(screen.getByLabelText('Add new date'));
    await userEvent.type(screen.getByLabelText('날짜'), '2025-01-25');
    await userEvent.type(screen.getByLabelText('지역'), '삼송');
    await userEvent.click(screen.getByText('추가'));

    // 3. 상세 페이지로 네비게이션 확인
    await waitFor(() => {
      expect(screen.getByText('2025년 1월 25일')).toBeInTheDocument();
      expect(screen.getByText('삼송')).toBeInTheDocument();
    });

    // 4. 카페 추가
    await userEvent.click(screen.getByText('카페 추가'));
    await userEvent.type(screen.getByLabelText('상호명'), '스타벅스');
    await userEvent.type(screen.getByLabelText('지도 링크'), 'https://map.kakao.com/...');
    await userEvent.click(screen.getByText('추가'));

    // 5. ✅ 카페가 즉시 표시되는지 확인 (버그 수정 검증)
    await waitFor(() => {
      expect(screen.getByText('스타벅스')).toBeInTheDocument();
    });

    // 6. "Back to Calendar" 메시지가 표시되지 않는지 확인
    expect(screen.queryByText('Back to Calendar')).not.toBeInTheDocument();

    // 7. 데이터 무결성 확인
    const regions = screen.getAllByTestId('region-section');
    expect(regions).toHaveLength(1);

    const cafes = within(regions[0]).getAllByTestId('place-card');
    expect(cafes).toHaveLength(1);
  });

  test('여러 지역 추가 후 각 지역에 장소 추가', async () => {
    render(<App />);

    // 날짜 생성 (삼송)
    await createDate('2025-01-25', '삼송');

    // 두 번째 지역 추가 (연신내)
    await userEvent.click(screen.getByText('지역 추가'));
    await userEvent.type(screen.getByLabelText('지역명'), '연신내');
    await userEvent.click(screen.getByText('추가'));

    // 각 지역에 장소 추가
    await addPlaceToRegion('삼송', 'cafe', '스타벅스');
    await addPlaceToRegion('연신내', 'restaurant', '맥도날드');

    // ✅ 모든 데이터 유지 확인
    expect(screen.getByText('삼송')).toBeInTheDocument();
    expect(screen.getByText('연신내')).toBeInTheDocument();
    expect(screen.getByText('스타벅스')).toBeInTheDocument();
    expect(screen.getByText('맥도날드')).toBeInTheDocument();
  });
});
```

**담당**: Quality Engineer
**소요 시간**: 2시간
**산출물**: 통합 테스트 스위트

---

#### 4.2. E2E 테스트 (Playwright)
```typescript
// e2e/date-place-workflow.spec.ts

import { test, expect } from '@playwright/test';

test.describe('Date-Place Workflow E2E', () => {
  test('사용자가 날짜를 생성하고 장소를 추가할 수 있다', async ({ page }) => {
    await page.goto('http://localhost:5173');

    // 날짜 추가
    await page.click('button[aria-label="Add new date"]');
    await page.fill('input[name="date"]', '2025-01-25');
    await page.fill('input[name="region"]', '삼송');
    await page.click('button:has-text("추가")');

    // 상세 페이지 로딩 대기
    await page.waitForURL('**/date/2025-01-25');
    await expect(page.locator('text=2025년 1월 25일')).toBeVisible();

    // 카페 추가
    await page.click('button:has-text("카페 추가")');
    await page.fill('input[name="name"]', '스타벅스');
    await page.fill('input[name="link"]', 'https://map.kakao.com/link/map/123,456');
    await page.click('button:has-text("추가")');

    // ✅ "Back to Calendar" 메시지가 나타나지 않는지 확인
    await expect(page.locator('text=Back to Calendar')).not.toBeVisible();

    // ✅ 카페가 정상적으로 표시되는지 확인
    await expect(page.locator('text=스타벅스')).toBeVisible({ timeout: 3000 });
  });

  test('빠른 연속 작업 시 데이터 손실이 없다', async ({ page }) => {
    await page.goto('http://localhost:5173');

    // 빠르게 날짜 생성
    await page.click('button[aria-label="Add new date"]');
    await page.fill('input[name="date"]', '2025-01-25');
    await page.fill('input[name="region"]', '삼송');
    await page.click('button:has-text("추가")');

    // 네비게이션 즉시 확인
    await page.waitForURL('**/date/2025-01-25', { timeout: 5000 });

    // 로딩 완료 대기 없이 즉시 장소 추가 시도
    await page.click('button:has-text("카페 추가")');
    await page.fill('input[name="name"]', '카페1');
    await page.fill('input[name="link"]', 'https://map.kakao.com/...');
    await page.click('button:has-text("추가")');

    // ✅ 에러 없이 정상 처리되는지 확인
    await expect(page.locator('text=카페1')).toBeVisible({ timeout: 5000 });
  });

  test('네트워크 지연 시나리오', async ({ page }) => {
    // 네트워크 속도 제한
    await page.route('**/api/**', async (route) => {
      await new Promise(resolve => setTimeout(resolve, 2000)); // 2초 지연
      await route.continue();
    });

    await page.goto('http://localhost:5173');

    // 느린 네트워크에서 날짜 추가
    await page.click('button[aria-label="Add new date"]');
    await page.fill('input[name="date"]', '2025-01-25');
    await page.fill('input[name="region"]', '삼송');
    await page.click('button:has-text("추가")');

    // ✅ 로딩 인디케이터 확인
    await expect(page.locator('text=로딩 중')).toBeVisible();

    // ✅ 최종적으로 정상 완료
    await expect(page.locator('text=2025년 1월 25일')).toBeVisible({ timeout: 15000 });
  });
});
```

**담당**: Performance Engineer
**소요 시간**: 2시간
**산출물**: E2E 테스트 스위트

---

#### 4.3. 성능 테스트
```typescript
// src/__tests__/performance/state-update.test.ts

describe('State Update Performance', () => {
  test('mergeDateLogData 성능: 100개 날짜 병합', () => {
    const existing: DateLogData = {};

    // 100개 날짜 생성
    for (let i = 1; i <= 100; i++) {
      existing[`2025-01-${String(i).padStart(2, '0')}`] = {
        date: `2025-01-${String(i).padStart(2, '0')}`,
        regions: [{ id: `uuid${i}`, name: `지역${i}`, categories: { ... } }]
      };
    }

    const newEntries: DateEntryResponse[] = [{
      id: 'new-uuid',
      date: '2025-01-01',
      region: '새 지역',
      cafes: [],
      restaurants: [],
      spots: []
    }];

    // 성능 측정
    const startTime = performance.now();
    const result = DateLogAdapter.mergeDateLogData(existing, newEntries);
    const endTime = performance.now();

    // ✅ 500ms 이내 완료
    expect(endTime - startTime).toBeLessThan(500);

    // ✅ 데이터 무결성 확인
    expect(Object.keys(result)).toHaveLength(100);
    expect(result['2025-01-01'].regions).toHaveLength(2);
  });

  test('대량 장소 추가 시 상태 업데이트 성능', async () => {
    const { result } = renderHook(() => useDateLogAPI());

    // 날짜 생성
    await act(async () => {
      await result.current.addDate('2025-01-25', '삼송');
    });

    // 100개 장소 연속 추가
    const startTime = performance.now();

    for (let i = 1; i <= 100; i++) {
      await act(async () => {
        await result.current.addPlace('2025-01-25', 'region-id', 'cafe', {
          name: `카페${i}`,
          link: 'https://map.kakao.com/...',
          visited: false
        });
      });
    }

    const endTime = performance.now();

    // ✅ 평균 50ms 이내 (총 5초 이내)
    const avgTime = (endTime - startTime) / 100;
    expect(avgTime).toBeLessThan(50);
  });
});
```

**담당**: Performance Engineer
**소요 시간**: 1시간
**산출물**: 성능 벤치마크 테스트

---

### ✅ Phase 4 Quality Gates

- [ ] E2E 테스트가 critical path 커버
- [ ] 통합 테스트가 모든 시나리오 통과
- [ ] 성능 메트릭이 허용 범위 내
- [ ] 기존 기능에 회귀 없음
- [ ] 브라우저 호환성 테스트 통과

---

## 📈 전체 수락 기준 (Acceptance Criteria)

### 기능 요구사항
- [x] 사용자가 새 날짜와 지역을 생성할 수 있다
- [x] 사용자가 날짜 상세 페이지로 네비게이션할 수 있다
- [x] 사용자가 모든 카테고리(카페, 식당, 스팟)에 장소를 추가할 수 있다
- [x] 장소가 제출 즉시 화면에 표시된다
- [x] "Back to Calendar" 에러 메시지가 표시되지 않는다
- [x] 데이터가 페이지 새로고침 후에도 유지된다
- [x] 에러 상태가 사용자 친화적 한국어 메시지로 표시된다
- [x] 로딩 상태가 중복 작업을 방지한다

### 기술 요구사항
- [ ] 모든 코드 변경사항이 main 브랜치에 병합됨
- [ ] 모든 단위 테스트 통과 (≥80% 커버리지)
- [ ] 모든 통합 테스트 통과
- [ ] E2E 테스트가 happy path + 에러 시나리오 커버
- [ ] TypeScript 에러 없음
- [ ] 최소 1명의 다른 개발자에 의한 코드 리뷰 완료
- [ ] 문서 업데이트 (필요시)
- [ ] 개발 환경에서 테스트 완료
- [ ] 기존 기능에 회귀 없음

### 성공 지표
- **버그 재현율**: 0% ("Back to Calendar" 버그 미발생)
- **데이터 무결성**: 100% (모든 날짜/지역/장소 작업에서 데이터 손실 없음)
- **응답 시간**: <500ms (상태 업데이트)
- **에러 복구율**: 100% (사용자가 실패한 작업 재시도 가능)

---

## 📊 타임라인 및 의존성

```
Phase 1 (2-3시간)
  ├─ 1.1 버그 문서화 (30분)
  ├─ 1.2 함수 수정 (1시간)
  ├─ 1.3 테스트 작성 (1시간)
  └─ 1.4 문서화 (30분)
        ↓
Phase 2 (2-4시간) [Phase 1 완료 필요]
  ├─ 2.1 상태 관리 추가 (30분)
  ├─ 2.2 에러 처리 개선 (1.5시간)
  ├─ 2.3 UI 추가 (1시간)
  └─ 2.4 테스트 (1시간)
        ↓
Phase 3 (2-3시간) [Phase 1, 2 완료 필요]
  ├─ 3.1 네비게이션 개선 (1.5시간)
  ├─ 3.2 Timeout 추가 (1시간)
  └─ 3.3 테스트 (30분)
        ↓
Phase 4 (3-5시간) [Phase 1, 2, 3 완료 필요]
  ├─ 4.1 통합 테스트 (2시간)
  ├─ 4.2 E2E 테스트 (2시간)
  └─ 4.3 성능 테스트 (1시간)
```

**총 예상 소요 시간**: 9-15시간

**Critical Path**: Phase 1 → Phase 2 → Phase 3 → Phase 4 (순차적)

**병렬 작업 기회**:
- 각 Phase 내에서 테스트 작성은 구현과 동시 진행 가능
- 문서화는 구현 중 병렬로 작성 가능

---

## 🎯 모니터링 및 검증

### 개발 중 모니터링
- **Browser Console**: 상태 업데이트 로그 확인
- **Network Tab**: API 호출 타이밍 분석
- **React DevTools**: 컴포넌트 리렌더링 추적
- **Backend Logs**: API 호출 순서 검증

### 배포 후 검증
1. **Staging 환경 테스트**
   - 전체 사용자 플로우 수동 테스트
   - 다양한 네트워크 조건 테스트
   - 브라우저 호환성 확인

2. **Production 배포 전 체크리스트**
   - [ ] 모든 테스트 통과
   - [ ] Staging 환경 검증 완료
   - [ ] Rollback 계획 준비
   - [ ] 배포 후 모니터링 계획 수립

3. **Production 배포 후**
   - 첫 1시간: 실시간 에러 모니터링
   - 첫 24시간: 사용자 피드백 수집
   - 첫 1주일: 데이터 무결성 검증

---

## 🔄 Rollback 전략

### Phase별 Rollback

| Phase | Rollback Action | 위험도 | 소요 시간 |
|-------|----------------|--------|----------|
| Phase 1 | `mergeDateLogData` 이전 버전 복원 | Low | 5분 |
| Phase 2 | 에러 처리 코드 제거 | Very Low | 5분 |
| Phase 3 | 네비게이션 타이밍 원복 | Low | 5분 |
| Phase 4 | N/A (테스팅 단계) | - | - |

### Emergency Rollback
- **Trigger**: Production에서 critical 버그 발견
- **Action**: 전체 PR revert
- **Time**: <10분
- **Validation**: 기존 기능 정상 동작 확인

---

## 📚 추가 참고사항

### 관련 문서
- `CLAUDE.md`: 프로젝트 구조 및 아키텍처
- `src/services/api/adapter.ts`: 데이터 변환 로직
- `src/hooks/useDateLogAPI.ts`: API 상태 관리

### 기술 스택
- React 18 + TypeScript
- TailwindCSS
- React Router
- Jest + Testing Library
- Playwright (E2E)

### 지원 리소스
- Backend API 문서: `date-log-server` 레포지토리
- 디자인 시스템: TailwindCSS 커스텀 설정
- CI/CD: Render Blueprint 설정

---

## ✅ 완료 체크리스트

### Phase 1
- [ ] 버그 재현 테스트 작성
- [ ] `mergeDateLogData` 함수 수정
- [ ] 포괄적 테스트 케이스 작성
- [ ] 함수 문서화 업데이트
- [ ] 코드 리뷰 완료

### Phase 2
- [ ] 에러 상태 관리 추가
- [ ] `handlePlaceFormSubmit` 개선
- [ ] 에러 UI 추가
- [ ] 에러 처리 테스트 작성
- [ ] 코드 리뷰 완료

### Phase 3
- [ ] `handleAddDate` 상태 동기화 추가
- [ ] Timeout 보호 메커니즘 구현
- [ ] 타이밍 테스트 작성
- [ ] 코드 리뷰 완료

### Phase 4
- [ ] 통합 테스트 스위트 작성
- [ ] E2E 테스트 작성
- [ ] 성능 테스트 작성
- [ ] 모든 테스트 통과 확인
- [ ] 최종 검증 완료

### 배포
- [ ] Staging 배포 및 검증
- [ ] Production 배포 승인
- [ ] Production 배포 실행
- [ ] 배포 후 모니터링
- [ ] 사용자 피드백 수집

---

**워크플로우 버전**: 1.0
**작성일**: 2025-01-25
**최종 수정**: 2025-01-25
**담당 팀**: DateLog Development Team
