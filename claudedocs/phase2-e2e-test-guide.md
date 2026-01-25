# Phase 2 E2E 테스트 가이드

## 개요
Phase 2 "Back to Calendar" 깜빡임 버그 수정사항을 검증하기 위한 E2E 테스트 가이드입니다.

## 새로 작성된 테스트 파일
- **파일**: `e2e/phase2-back-to-calendar-fix.spec.ts`
- **목적**: Phase 2 수정사항 검증 및 회귀 테스트

## 테스트 항목

### 1. "Back to Calendar" 깜빡임 수정 검증
4가지 핵심 시나리오를 테스트합니다:

#### 시나리오 1: 첫 방문 시 스피너 표시
```typescript
test('시나리오 1: 첫 방문 시 스피너 표시 → 데이터 표시 (깜빡임 없음)')
```
**검증 내용**:
- ✅ 로딩 스피너가 표시됨
- ✅ 스피너 표시 중 "Back to Calendar" 버튼이 보이지 않음
- ✅ 데이터 로드 후 정상 화면 표시

**기대 동작**:
```
날짜 클릭 → 스피너 표시 → 데이터 로드 → 상세 화면
(깜빡임 없음)
```

#### 시나리오 2: 재방문 시 부드러운 전환
```typescript
test('시나리오 2: 재방문 시 기존 데이터 즉시 표시 → 부드러운 전환')
```
**검증 내용**:
- ✅ 재방문 시 "Back to Calendar" 버튼이 깜빡이지 않음
- ✅ 기존 데이터가 즉시 표시됨
- ✅ 렌더링 시간이 2초 이내 (부드러운 UX)

**기대 동작**:
```
날짜 재방문 → 기존 데이터 즉시 표시 → 백그라운드 업데이트
(깜빡임 없음)
```

#### 시나리오 3: 다중 Region 데이터 보존
```typescript
test('시나리오 3: 다중 region 데이터 보존 검증')
```
**검증 내용**:
- ✅ "삼송" region 추가
- ✅ "연신내" region 추가
- ✅ 홈으로 나갔다가 다시 돌아오기
- ✅ 두 region 모두 유지됨

**기대 동작**:
```
삼송 추가 → 연신내 추가 → 홈으로 이동 → 날짜 재방문
→ 삼송 ✅ + 연신내 ✅ (모두 보존)
```

#### 시나리오 4: 빠른 네비게이션
```typescript
test('시나리오 4: 빠른 네비게이션 - 모든 전환이 부드러워야 함')
```
**검증 내용**:
- ✅ 날짜 A → 날짜 B → 날짜 A 빠른 전환
- ✅ 모든 전환에서 "Back to Calendar" 깜빡임 없음

**기대 동작**:
```
날짜A → 날짜B → 날짜A
(모든 전환이 부드럽고 깜빡임 없음)
```

### 2. API 통합 모드 검증
```typescript
test('API 모드: revalidateDate 호출 시 상태 전환 확인')
```
**검증 내용**:
- ✅ `VITE_ENABLE_API=true`일 때 API 호출 발생
- ✅ revalidateDate로 인한 추가 API 호출 확인
- ✅ 네트워크 요청 모니터링

### 3. 회귀 테스트
기존 기능이 정상 작동하는지 확인:

- ✅ 날짜 상세 페이지 기본 렌더링
- ✅ 카테고리 탭 전환 기능
- ✅ 뒤로가기 네비게이션

## 테스트 실행 방법

### 사전 준비
1. **환경 변수 설정** (`.env.development`):
   ```bash
   VITE_API_BASE_URL=http://localhost:3001/v1
   VITE_ENABLE_API=false  # 또는 true (API 모드 테스트 시)
   VITE_KAKAO_MAP_API_KEY=<your-key>
   ```

2. **의존성 설치** (미설치 시):
   ```bash
   npm install
   ```

### 방법 1: 전체 E2E 테스트 실행
```bash
cd my-date-log

# 모든 E2E 테스트 실행 (개발 서버 자동 시작)
npx playwright test
```

**설명**:
- Playwright가 자동으로 `npm run dev` 실행
- 포트 5173에서 개발 서버 시작
- 모든 E2E 테스트 실행 (기존 + Phase 2)

### 방법 2: Phase 2 테스트만 실행
```bash
cd my-date-log

# Phase 2 검증 테스트만 실행
npx playwright test phase2-back-to-calendar-fix.spec.ts
```

### 방법 3: 개발 서버 수동 시작 후 테스트
```bash
# 터미널 1: 개발 서버 시작
cd my-date-log
npm run dev

# 터미널 2: 테스트 실행
cd my-date-log
npx playwright test --headed  # UI 모드로 테스트 확인
```

**옵션**:
- `--headed`: 브라우저 UI를 보면서 테스트 실행
- `--debug`: 디버그 모드로 단계별 실행
- `--ui`: Playwright UI 모드로 실행

### 방법 4: UI 모드로 대화형 테스트
```bash
cd my-date-log
npx playwright test --ui
```

**장점**:
- 각 테스트를 개별적으로 실행 가능
- 실시간으로 테스트 결과 확인
- 스크린샷 및 타임라인 확인

## 테스트 결과 확인

### 터미널 출력
테스트 실행 후 터미널에서 결과 확인:
```
✅ 시나리오 1: 첫 방문 시 깜빡임 없음 검증 완료
✅ 시나리오 2: 재방문 부드러운 전환 검증 완료 (450ms)
✅ 시나리오 3: Region 보존 검증 완료 (삼송: true, 연신내: true)
✅ 시나리오 4: 빠른 네비게이션 부드러운 전환 검증 완료
```

### HTML 리포트
```bash
# 테스트 실행 후 HTML 리포트 생성
npx playwright show-report
```

**리포트 내용**:
- 각 테스트의 통과/실패 상태
- 실행 시간 및 타임라인
- 실패 시 스크린샷 및 비디오
- 네트워크 요청 로그

### 스크린샷 및 비디오
실패한 테스트의 스크린샷과 비디오는 아래 경로에 저장:
```
my-date-log/
├── test-results/          # 실패한 테스트 결과
│   ├── screenshots/
│   └── videos/
└── playwright-report/     # HTML 리포트
```

## 예상 테스트 결과

### ✅ 성공 시나리오
```
Running 11 tests using 1 worker

✓  [chromium] › phase2-back-to-calendar-fix.spec.ts:23 (5.2s)
   시나리오 1: 첫 방문 시 스피너 표시 → 데이터 표시 (깜빡임 없음)

✓  [chromium] › phase2-back-to-calendar-fix.spec.ts:52 (3.8s)
   시나리오 2: 재방문 시 기존 데이터 즉시 표시 → 부드러운 전환

✓  [chromium] › phase2-back-to-calendar-fix.spec.ts:81 (4.5s)
   시나리오 3: 다중 region 데이터 보존 검증

✓  [chromium] › phase2-back-to-calendar-fix.spec.ts:123 (6.1s)
   시나리오 4: 빠른 네비게이션 - 모든 전환이 부드러워야 함

  11 passed (45.2s)
```

### ❌ 실패 시 확인 사항

#### 1. "Back to Calendar" 여전히 깜빡임
**원인**:
- `revalidateDate` 함수 수정이 제대로 적용되지 않음
- `hasExistingData` 체크가 정상 동작하지 않음

**해결**:
```bash
# 코드 변경사항 확인
git diff src/hooks/useDateLogAPI.ts

# TypeScript 컴파일 확인
npx tsc --noEmit
```

#### 2. Region 데이터 손실
**원인**:
- `mergeDateLogData` 호출이 정상 작동하지 않음
- Shallow spread가 여전히 사용됨

**해결**:
```typescript
// src/hooks/useDateLogAPI.ts 확인
setData((prev) => DateLogAdapter.mergeDateLogData(prev, entries));
// ✅ 위 코드가 적용되어 있어야 함

// ❌ 아래처럼 shallow spread 사용 시 실패
setData((prev) => ({ ...prev, ...frontendData }));
```

#### 3. API 모드 테스트 실패
**원인**:
- 백엔드 서버가 실행되지 않음
- 환경 변수 설정 오류

**해결**:
```bash
# 백엔드 서버 확인
curl http://localhost:3001/v1/health

# 환경 변수 확인
cat .env.development
```

## 수동 테스트 체크리스트

E2E 테스트 외에 수동으로 확인해야 할 항목:

### [ ] 1. 첫 방문 깜빡임 확인
1. 브라우저 개발자 도구 열기 (F12)
2. Network 탭에서 "Slow 3G" 선택 (느린 네트워크 시뮬레이션)
3. 캘린더에서 새 날짜 클릭
4. **확인**: 스피너만 표시되고 "Back to Calendar" 버튼이 깜빡이지 않음

### [ ] 2. 재방문 부드러운 전환
1. 이미 방문한 날짜 클릭
2. **확인**: 기존 데이터가 즉시 표시됨 (깜빡임 없음)
3. 네트워크 탭에서 백그라운드 API 호출 확인

### [ ] 3. 다중 Region 보존
1. 날짜에 "삼송" region 추가
2. 같은 날짜에 "연신내" region 추가
3. 홈으로 이동
4. 같은 날짜 재방문
5. **확인**: "삼송"과 "연신내" 모두 표시됨

### [ ] 4. 빠른 네비게이션
1. 날짜 A 클릭 → 날짜 B 클릭 → 날짜 A 재클릭 (빠르게)
2. **확인**: 모든 전환이 부드럽고 깜빡임 없음

## 성공 기준

Phase 2 수정사항이 성공적으로 적용되었다고 판단하는 기준:

### ✅ 필수 조건
- [ ] **시나리오 1-4 모두 통과**: 모든 E2E 테스트 통과
- [ ] **회귀 테스트 통과**: 기존 기능 정상 작동
- [ ] **수동 테스트 통과**: 위 체크리스트 모두 확인

### ✅ 성능 기준
- [ ] 재방문 렌더링 시간 < 2초
- [ ] "Back to Calendar" 깜빡임 0회
- [ ] Region 데이터 손실 0건

### ✅ 사용자 경험
- [ ] 모든 전환이 부드러움
- [ ] 로딩 상태가 명확함
- [ ] 데이터 일관성 유지

## 문제 해결

### 테스트 타임아웃
```bash
# playwright.config.ts에서 타임아웃 증가
use: {
  timeout: 30000,  // 30초로 증가
}
```

### 개발 서버 시작 실패
```bash
# 포트 충돌 확인
lsof -ti:5173
kill -9 <PID>  # 기존 프로세스 종료

# 수동으로 개발 서버 시작
npm run dev
```

### 브라우저 다운로드 오류
```bash
# Playwright 브라우저 재설치
npx playwright install chromium
```

## 추가 리소스

### Playwright 문서
- [공식 문서](https://playwright.dev)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [Debugging Tests](https://playwright.dev/docs/debug)

### 프로젝트 문서
- `claudedocs/phase2-implementation-summary.md` - 구현 요약
- `e2e/date-detail.spec.ts` - 기존 E2E 테스트
- `CLAUDE.md` - 프로젝트 전체 가이드

## 다음 단계

E2E 테스트 통과 후:

1. **커밋 및 푸시**:
   ```bash
   git add e2e/phase2-back-to-calendar-fix.spec.ts
   git commit -m "test: Add Phase 2 E2E validation tests"
   ```

2. **배포 준비**:
   - Staging 환경 테스트
   - Production 배포 계획

3. **모니터링**:
   - 사용자 피드백 수집
   - 성능 메트릭 확인
   - 에러 로그 모니터링
