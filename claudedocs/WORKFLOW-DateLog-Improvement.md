# DateLog 개선 워크플로우

설계문서 구현과 React Error #310 수정을 위한 브랜치 분리 전략 및 통합 워크플로우

---

## 1. 브랜치 전략

### 브랜치 구조

```
main (production)
  │
  ├── hotfix/react-error-310        # Stream B: 긴급 프로덕션 버그 수정
  │   └── 목표: Error #310 재현 → 분석 → 수정 → 긴급 배포
  │
  └── feature/datelog-stability     # Stream A: 설계문서 기반 안정성 개선
      └── 목표: 4-Layer 아키텍처 구현 → API 안정성 + UX 개선
```

### 브랜치 분리 이유

| 브랜치 | 특성 | 긴급도 | 중요도 | 배포 전략 |
|--------|------|--------|--------|-----------|
| **hotfix/react-error-310** | 최소 변경, 빠른 수정 | 🔴 높음 | 🟡 중간 | 긴급 배포 |
| **feature/datelog-stability** | 대규모 리팩토링 | 🟢 낮음 | 🔴 높음 | 안정화 후 배포 |

**독립성**: 두 브랜치는 서로 다른 문제를 해결하므로 병렬 작업 가능

---

## 2. Stream B: hotfix/react-error-310 워크플로우

### 🎯 목표
프로덕션 환경에서 발생하는 React Error #310 (hooks count/order violation) 수정

### 📋 Phase 1: Reproduction (30분-1시간)

**작업 내용**:
```bash
# 1. 브랜치 생성
git checkout main
git pull origin main
git checkout -b hotfix/react-error-310

# 2. 로컬 개발 환경 재현 시도
npm run dev
# → http://localhost:5173/date/2025-12-15 접속하여 에러 재현

# 3. 프로덕션 빌드 로컬 테스트
npm run build:production
npm run preview
# → http://localhost:3000/date/2025-12-15 접속하여 에러 재현
```

**체크리스트**:
- [ ] 개발 환경에서 에러 재현 확인
- [ ] 프로덕션 빌드에서 에러 재현 확인
- [ ] 에러 발생 조건 문서화 (특정 경로, 사용자 액션)

---

### 📋 Phase 2: Root Cause Analysis (1-2시간)

**작업 내용**:
1. **React DevTools 검사**:
   - 컴포넌트 트리 구조 확인
   - Props/State 변화 추적
   - Re-render 패턴 분석

2. **Source Map 활용**:
   ```bash
   # vite.config.ts에서 sourcemap 활성화 확인
   build: {
     sourcemap: true
   }
   ```

3. **의심 영역 조사**:
   - ✅ MainView.tsx (line 20:2836의 useCallback)
   - ✅ DateDetailView.tsx (조건부 컴포넌트 렌더링)
   - ✅ useDateLogAPI.ts (동적 훅 호출 가능성)
   - ⚠️ react-kakao-maps-sdk 내부 훅
   - ⚠️ React Router 동적 라우팅
   - ⚠️ Context Provider 조건부 마운트

**체크리스트**:
- [ ] 정확한 에러 발생 위치 특정
- [ ] 원인 카테고리 분류 (코드 이슈 / 라이브러리 이슈 / 환경 이슈)
- [ ] 수정 전략 수립

---

### 📋 Phase 3: Fix Implementation (1-2시간)

**수정 전략 (원인에 따라 선택)**:

#### 전략 1: 조건부 컴포넌트 → 항상 렌더링
```typescript
// ❌ Before (조건부 렌더링)
{showMap && <MapView places={allPlaces} />}

// ✅ After (항상 렌더링 + CSS 숨김)
<div className={showMap ? 'block' : 'hidden'}>
  <MapView places={allPlaces} />
</div>
```

#### 전략 2: 동적 훅 → 정적 훅
```typescript
// ❌ Before (조건부 훅 호출)
const data = condition ? useHook1() : useHook2();

// ✅ After (정적 훅 + 조건부 로직)
const data1 = useHook1();
const data2 = useHook2();
const data = condition ? data1 : data2;
```

#### 전략 3: React.memo 최적화 제거
```typescript
// ❌ Before (조건부 memo)
const Component = condition ? React.memo(Component) : Component;

// ✅ After (일관된 컴포넌트 정의)
const Component = React.memo(Component);
```

**체크리스트**:
- [ ] 수정 구현 완료
- [ ] 로컬 테스트 통과
- [ ] Git commit: `fix: resolve React Error #310 - [원인 요약]`

---

### 📋 Phase 4: Validation & Deployment (30분-1시간)

**검증 절차**:
```bash
# 1. 로컬 테스트
npm run dev
# → 문제 경로 다시 테스트

# 2. 프로덕션 빌드 테스트
npm run build:production
npm run preview
# → 동일 경로 테스트

# 3. Staging 배포 (선택적)
git push origin hotfix/react-error-310
# → Render에서 staging 브랜치 배포 확인

# 4. 프로덕션 배포
git checkout main
git merge hotfix/react-error-310
git tag v1.0.1-hotfix
git push origin main --tags
```

**체크리스트**:
- [ ] 로컬 검증 완료
- [ ] Staging 검증 완료 (선택적)
- [ ] 프로덕션 배포 완료
- [ ] 프로덕션에서 에러 해결 확인

**⏱️ Stream B 총 소요 시간**: 3-6시간

---

## 3. Stream A: feature/datelog-stability 워크플로우

### 🎯 목표
설계문서(DateDetailView-improve.md) 기반 4-Layer 아키텍처 구현

### 📋 Phase 1: Foundation - Layer 1 구현 (3-4시간)

**작업 내용**:
```bash
# 1. 브랜치 생성
git checkout main
git pull origin main
git checkout -b feature/datelog-stability

# 2. 디렉토리 구조 생성
mkdir -p src/services/api/errors
mkdir -p src/services/api/retry
```

**구현 파일**:

1. **src/services/api/errors/ErrorClassifier.ts**
   - API 에러 분류 (Network / Timeout / Server / Client)
   - 사용자 친화적 에러 메시지 생성
   - 재시도 가능 여부 판단

2. **src/services/api/retry/RetryStrategy.ts**
   - Exponential Backoff 구현
   - 최대 재시도 횟수 제어
   - Jitter 추가로 thundering herd 방지

3. **src/services/api/retry/CircuitBreaker.ts**
   - 연속 실패 감지 → Circuit Open
   - Half-Open 상태에서 health check
   - 성공 시 Circuit Close

**테스트**:
```bash
# 단위 테스트 작성
src/services/api/errors/__tests__/ErrorClassifier.test.ts
src/services/api/retry/__tests__/RetryStrategy.test.ts

# 테스트 실행
npm test
```

**체크리스트**:
- [ ] ErrorClassifier 구현 및 테스트
- [ ] RetryStrategy 구현 및 테스트
- [ ] CircuitBreaker 구현 및 테스트
- [ ] Git commit: `feat(api): implement error handling foundation`

---

### 📋 Phase 2: Hook Refactoring - Layer 2 구현 (2-3시간)

**작업 내용**:

1. **src/hooks/useDateLogAPI.ts 개선**:
   - 5-상태 모델 적용:
     ```typescript
     type LoadingState =
       | { status: 'idle' }
       | { status: 'loading' }
       | { status: 'revalidating', data: DateLogData }
       | { status: 'success', data: DateLogData }
       | { status: 'error', error: string };
     ```
   - RetryStrategy 통합:
     ```typescript
     const { execute } = useRetryStrategy({
       maxRetries: 3,
       baseDelay: 1000,
     });
     ```

2. **Optimistic Update + Rollback 개선**:
   - 낙관적 업데이트 시 이전 상태 저장
   - 에러 발생 시 자동 롤백
   - 사용자에게 롤백 알림

**테스트**:
```bash
# Hook 테스트
src/hooks/__tests__/useDateLogAPI.test.ts

# 시나리오 테스트
- API 성공 → success 상태
- API 타임아웃 → 재시도 → success
- API 3회 실패 → error 상태
- Optimistic update → 실패 → rollback
```

**체크리스트**:
- [ ] 5-상태 모델 적용
- [ ] RetryStrategy 통합
- [ ] Optimistic update + rollback 개선
- [ ] Hook 테스트 작성 및 통과
- [ ] Git commit: `refactor(hooks): improve useDateLogAPI with 5-state model`

---

### 📋 Phase 3: UI Components - Layer 3 구현 (2시간)

**작업 내용**:

1. **src/components/common/LoadingState.tsx**:
   ```typescript
   interface LoadingStateProps {
     variant: 'initial' | 'revalidating' | 'background';
     message?: string;
   }

   // Variants:
   // - initial: 전체 화면 스피너 (데이터 없음)
   // - revalidating: 상단 프로그레스 바 (기존 데이터 표시)
   // - background: 작은 인디케이터 (백그라운드 작업)
   ```

2. **src/components/common/ErrorState.tsx**:
   ```typescript
   interface ErrorStateProps {
     error: string;
     onRetry: () => void;
     onRollback?: () => void;
     canRetry: boolean;
   }
   ```

3. **src/components/common/EmptyState.tsx**:
   ```typescript
   interface EmptyStateProps {
     message: string;
     actionLabel?: string;
     onAction?: () => void;
   }
   ```

**통합**:
- DateDetailView.tsx에서 새 컴포넌트 사용
- 상태별 UI 분기 로직 단순화

**체크리스트**:
- [ ] LoadingState 구현 (3 variants)
- [ ] ErrorState 구현 (재시도 + 롤백)
- [ ] EmptyState 구현
- [ ] DateDetailView 통합
- [ ] Storybook 스토리 작성 (선택적)
- [ ] Git commit: `feat(ui): add state-based UI components`

---

### 📋 Phase 4: Global State - Layer 4 구현 (1-2시간)

**작업 내용**:

1. **src/contexts/KakaoMapsContext.tsx**:
   ```typescript
   interface KakaoMapsContextValue {
     isLoaded: boolean;
     error: string | null;
     retry: () => void;
   }

   // Provider:
   // - Kakao Maps SDK 로딩 상태 관리
   // - 에러 발생 시 재시도 메커니즘
   // - 모든 지도 컴포넌트에 상태 제공
   ```

2. **src/contexts/DataSourceContext.tsx** (선택적):
   ```typescript
   interface DataSourceContextValue {
     source: 'localStorage' | 'api';
     isOnline: boolean;
   }
   ```

**통합**:
- App.tsx에 Provider 추가
- MapView.tsx에서 KakaoMapsContext 사용

**체크리스트**:
- [ ] KakaoMapsContext 구현
- [ ] App.tsx Provider 추가
- [ ] MapView.tsx 리팩토링
- [ ] Integration 테스트
- [ ] Git commit: `feat(context): add KakaoMaps and DataSource contexts`

---

### 📋 Phase 5: Integration & Testing (1-2시간)

**통합 테스트 시나리오**:

1. **API 안정성 테스트**:
   - [ ] 네트워크 불안정 시뮬레이션 → 자동 재시도 확인
   - [ ] 타임아웃 시뮬레이션 → 에러 메시지 확인
   - [ ] Circuit breaker 동작 확인

2. **UI 상태 전환 테스트**:
   - [ ] idle → loading → success
   - [ ] loading → error → retry → success
   - [ ] success → revalidating → success
   - [ ] optimistic update → error → rollback

3. **Kakao Maps 통합 테스트**:
   - [ ] SDK 로딩 실패 시 에러 메시지
   - [ ] 재시도 메커니즘 동작
   - [ ] 지도 없이 나머지 기능 동작

**체크리스트**:
- [ ] 통합 테스트 모두 통과
- [ ] E2E 테스트 작성 (선택적)
- [ ] 성능 테스트 (로딩 시간, 메모리 사용량)
- [ ] Git commit: `test: add integration tests for stability improvements`

**⏱️ Stream A 총 소요 시간**: 8-11시간

---

## 4. 통합 워크플로우 및 타임라인

### 권장 실행 순서

```
📅 Week 1, Day 1-2: Stream B 집중 (긴급 버그 수정)
  ├─ ✅ Error #310 재현 및 원인 분석
  ├─ ✅ 수정 구현
  └─ 🚀 긴급 프로덕션 배포

📅 Week 1, Day 3-5: Stream A 시작 (안정성 개선)
  ├─ ✅ Phase 1-2 동시 진행 (Foundation + Hook)
  ├─ ⚠️ hotfix 병합 모니터링
  └─ 🔄 필요시 hotfix 반영 (main → feature)

📅 Week 2, Day 1-3: Stream A 완료
  ├─ ✅ Phase 3-4 (UI Components + Context)
  ├─ ✅ 통합 테스트
  └─ 🧪 Staging 배포 및 검증

📅 Week 2, Day 4-5: 안정화 및 프로덕션 배포
  ├─ ✅ 최종 검증
  └─ 🚀 프로덕션 배포 (v1.1.0)
```

---

## 5. 병합 전략

### 전략 1: hotfix → main (긴급 배포)

```bash
# 1. hotfix 브랜치 최종 검증
git checkout hotfix/react-error-310
npm run build:production
npm run preview
# → http://localhost:3000/date/2025-12-15 테스트

# 2. main에 병합
git checkout main
git merge hotfix/react-error-310

# 3. 태그 생성 및 배포
git tag v1.0.1-hotfix
git push origin main --tags

# 4. Render 자동 배포 확인
# → https://date-log.onrender.com/date/2025-12-15 검증
```

---

### 전략 2: main → feature (hotfix 반영)

```bash
# 1. feature 브랜치로 이동
git checkout feature/datelog-stability

# 2. main의 hotfix 반영
git merge main

# 3. 충돌 해결 (있을 경우)
# → 주로 DateDetailView.tsx, useDateLogAPI.ts에서 발생 가능
# → 충돌 해결 후:
git add .
git commit -m "merge: integrate hotfix/react-error-310 into feature"

# 4. 계속 개발
npm run dev
# → 모든 기능 정상 동작 확인 후 Phase 3-4 진행
```

---

### 전략 3: feature → main (안정화 후 배포)

```bash
# 1. feature 브랜치 최종 검증
git checkout feature/datelog-stability
npm run build:production
npm run preview

# 2. 모든 테스트 통과 확인
npm test
npm run lint

# 3. main에 병합
git checkout main
git merge feature/datelog-stability

# 4. 태그 생성 및 배포
git tag v1.1.0
git push origin main --tags

# 5. Render 자동 배포 확인
# → https://date-log.onrender.com 전체 기능 검증
```

---

## 6. 리스크 관리 및 롤백 계획

### 리스크 시나리오

| 리스크 | 확률 | 영향 | 대응 전략 |
|--------|------|------|----------|
| **hotfix가 feature에 충돌** | 중간 | 중간 | main → feature 즉시 병합 |
| **feature 테스트 실패** | 낮음 | 높음 | hotfix만 유지, feature 재작업 |
| **프로덕션 배포 후 새 버그** | 낮음 | 높음 | 즉시 롤백 + hotfix 재시도 |
| **Kakao Maps SDK 호환성 이슈** | 낮음 | 중간 | Layer 4 선택적 적용 |

---

### 롤백 계획

#### hotfix 롤백 (긴급)

```bash
# 1. 이전 버전으로 롤백
git checkout main
git revert HEAD
git push origin main

# 또는 태그로 강제 롤백
git reset --hard v1.0.0
git push origin main --force

# 2. Render에서 수동 배포
# → 이전 stable 버전 선택
```

#### feature 롤백

```bash
# 1. main에서 feature 병합 취소
git checkout main
git revert -m 1 HEAD  # merge commit 되돌리기
git push origin main

# 2. feature 브랜치 재작업
git checkout feature/datelog-stability
git reset --hard HEAD~1  # 문제 commit 취소
# → 수정 후 다시 테스트
```

---

## 7. 성공 지표 (Success Metrics)

### Stream B (hotfix) 성공 지표

- [ ] React Error #310 프로덕션에서 0건 발생 (24시간 모니터링)
- [ ] 사용자 리포트 0건
- [ ] 모든 페이지 정상 렌더링 (Lighthouse 검사)

### Stream A (feature) 성공 지표

- [ ] API 타임아웃 에러 90% 감소 (재시도 메커니즘)
- [ ] 사용자 친화적 에러 메시지 100% 적용
- [ ] Kakao Maps SDK 로딩 안정성 95% 이상
- [ ] 페이지 로딩 시간 10% 개선 (Optimistic UI)
- [ ] 테스트 커버리지 80% 이상 유지

---

## 8. 참고 문서

- **설계문서**: `claudedocs/DateDetailView-improve.md`
- **분석 결과**: `/sc:analyze` 출력 (이전 세션)
- **React Error #310**: https://reactjs.org/docs/error-decoder.html?invariant=310
- **프로젝트 가이드**: `CLAUDE.md`

---

## 9. 체크리스트 요약

### Stream B (hotfix/react-error-310)

- [ ] Phase 1: Reproduction (30분-1시간)
- [ ] Phase 2: Root Cause Analysis (1-2시간)
- [ ] Phase 3: Fix Implementation (1-2시간)
- [ ] Phase 4: Validation & Deployment (30분-1시간)
- [ ] 프로덕션 검증 완료

### Stream A (feature/datelog-stability)

- [ ] Phase 1: Foundation - Layer 1 (3-4시간)
- [ ] Phase 2: Hook Refactoring - Layer 2 (2-3시간)
- [ ] Phase 3: UI Components - Layer 3 (2시간)
- [ ] Phase 4: Global State - Layer 4 (1-2시간)
- [ ] Phase 5: Integration & Testing (1-2시간)
- [ ] Staging 검증 완료
- [ ] 프로덕션 배포 완료

---

**최종 업데이트**: 2025-12-21
**작성자**: Claude Code via /sc:workflow
**버전**: v1.0
