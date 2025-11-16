# DateLog Frontend - 다음 작업 단계

**프로젝트**: my-date-log
**현재 상태**: Phase 4 완료 (Render 배포 설정 완료, 실제 배포 대기)
**마지막 작업**: 2025년 10월 25일

---

## 🎯 작업 우선순위

### 🔴 Critical - 즉시 정리 필요
- [ ] Git 상태 정리 (uncommitted changes)
- [ ] Untracked 파일 정리

### 🟡 High - 배포 전 필수
- [ ] 환경 변수 검증
- [ ] Render Static Site 생성
- [ ] 배포 테스트

### 🟢 Medium - 배포 후 작업
- [ ] Backend API 연동 확인
- [ ] Kakao Maps 로딩 확인
- [ ] E2E 기능 테스트

---

## 📋 상세 작업 가이드

## Task 1: Git 상태 정리 🔴

### 1.1 현재 상태 확인

```bash
cd my-date-log

# Git 상태 확인
git status
```

**현재 상태**:
```
Changes not staged for commit:
  modified:   .claude/settings.local.json
  modified:   src/App.tsx

Untracked files:
  FIX_SUMMARY.md
  PHASE4_COMPLETION.md.backup
  PHASE4_DEPLOYMENT.md.backup
  TROUBLESHOOTING.md
  check-env.js
  start-dev.bat
  test-env.html
```

### 1.2 변경사항 확인 및 처리

**App.tsx 변경사항 확인**:
```bash
# 변경 내용 확인
git diff src/App.tsx

# 변경사항이 필요한 경우 커밋
git add src/App.tsx
git commit -m "fix: Update App.tsx for [변경 내용 설명]"

# 변경사항이 불필요한 경우 되돌리기
git restore src/App.tsx
```

**settings.local.json 처리**:
```bash
# 로컬 설정 파일은 보통 되돌리기
git restore .claude/settings.local.json

# 또는 .gitignore에 추가
echo ".claude/settings.local.json" >> .gitignore
```

### 1.3 Untracked 파일 정리

```bash
# 필요한 파일 확인
cat FIX_SUMMARY.md
cat TROUBLESHOOTING.md

# 필요한 파일은 커밋
git add TROUBLESHOOTING.md
git commit -m "docs: Add troubleshooting guide"

# 불필요한 파일 삭제 (미리 확인)
git clean -n  # 삭제될 파일 미리보기

# 실제 삭제
git clean -f

# 또는 수동 삭제
rm FIX_SUMMARY.md
rm PHASE4_COMPLETION.md.backup
rm PHASE4_DEPLOYMENT.md.backup
rm check-env.js
rm start-dev.bat
rm test-env.html
```

### 1.4 최종 Git 상태 확인

```bash
git status

# 예상 결과: "nothing to commit, working tree clean"
```

**✅ 완료 기준**:
- [ ] `git status`가 clean
- [ ] 필요한 변경사항은 커밋됨
- [ ] 불필요한 파일 삭제됨

---

## Task 2: 환경 변수 검증 🟡

### 2.1 환경 변수 파일 확인

```bash
# 환경 변수 파일 목록 확인
ls -la .env*

# 예상 파일:
# .env.development (gitignored)
# .env.staging (gitignored)
# .env.production (committed)
```

### 2.2 각 환경별 설정 검증

**Development (.env.development)**:
```env
VITE_KAKAO_MAP_API_KEY=your-dev-key
VITE_API_BASE_URL=http://localhost:3001/v1
VITE_API_TIMEOUT=10000
VITE_ENABLE_API=false
```

**Staging (.env.staging)**:
```env
VITE_KAKAO_MAP_API_KEY=ff76d41c3df3ea33d5547a24db77743c
VITE_API_BASE_URL=https://datelog-backend-staging.onrender.com/v1
VITE_API_TIMEOUT=10000
VITE_ENABLE_API=true
```

**Production (.env.production)**:
```env
VITE_KAKAO_MAP_API_KEY=ff76d41c3df3ea33d5547a24db77743c
VITE_API_BASE_URL=https://date-log-back.onrender.com/v1
VITE_API_TIMEOUT=10000
VITE_ENABLE_API=true
```

### 2.3 환경 변수 로딩 테스트

```bash
# Development 모드로 테스트
npm run dev

# 브라우저 콘솔에서 확인
console.log(import.meta.env.VITE_API_BASE_URL)
console.log(import.meta.env.VITE_KAKAO_MAP_API_KEY)
```

### 2.4 빌드 테스트

```bash
# Production 빌드 테스트
npm run build:production

# Staging 빌드 테스트
npm run build:staging

# 빌드 결과 확인
ls -la dist/
```

**✅ 완료 기준**:
- [ ] 3개 환경 변수 파일 모두 존재
- [ ] 각 환경별 설정 올바름
- [ ] 로컬 개발 서버 정상 실행
- [ ] Production/Staging 빌드 성공

---

## Task 3: Render Static Site 배포 🟡

### 3.1 Render 계정 준비

1. https://render.com 접속
2. 로그인 또는 회원가입
3. GitHub 계정 연동 확인

### 3.2 Static Site 생성 (방법 1: Blueprint)

```bash
# Render CLI 설치 (선택)
npm install -g render-cli

# Blueprint로 배포
render blueprint launch

# render.yaml을 읽어서 자동으로 Static Site 생성
```

### 3.3 Static Site 생성 (방법 2: 수동)

**Render Dashboard에서**:

1. **New → Static Site** 클릭
2. **GitHub 레포지토리 선택**: `my-date-log`
3. **기본 설정**:
   - Name: `datelog-frontend-production`
   - Branch: `main`
   - Build Command: `npm install && npm run build:production`
   - Publish Directory: `dist`

4. **Auto-Deploy**: Enable

### 3.4 환경 변수 설정

**Render Dashboard → Environment**:

```env
NODE_ENV=production
VITE_KAKAO_MAP_API_KEY=ff76d41c3df3ea33d5547a24db77743c
VITE_API_BASE_URL=https://date-log-back.onrender.com/v1
VITE_API_TIMEOUT=10000
VITE_ENABLE_API=true
```

**⚠️ 중요**:
- Kakao Map API Key는 Render Dashboard에서 설정 (보안)
- `.env.production`의 값은 placeholder

### 3.5 배포 설정 확인

**Render Dashboard → Settings**:

**Redirects/Rewrites**:
- Source: `/*`
- Destination: `/index.html`
- Action: `Rewrite`

**Headers**:
- Path: `/assets/*`
- Name: `Cache-Control`
- Value: `public, max-age=31536000, immutable`

### 3.6 첫 배포 실행

```bash
# Git push로 자동 배포 트리거
git push origin main

# 또는 Render Dashboard에서 수동 배포
# Dashboard → Manual Deploy 버튼 클릭
```

**배포 로그 확인**:
- Render Dashboard → Logs
- 빌드 진행 상황 실시간 확인

**✅ 완료 기준**:
- [ ] Static Site 생성 완료
- [ ] 환경 변수 설정 완료
- [ ] Rewrites 설정 완료
- [ ] 첫 배포 성공 (빌드 완료)
- [ ] 배포된 URL 접속 가능

---

## Task 4: 배포 검증 및 테스트 🟢

### 4.1 기본 접속 확인

```bash
# 배포된 사이트 접속
https://datelog-frontend-production.onrender.com

# 브라우저에서 확인
- 메인 페이지 로딩
- 라우팅 작동 (날짜 목록, 상세)
- 콘솔 에러 없음
```

### 4.2 Backend API 연동 확인

**브라우저 개발자 도구 → Network**:

1. 날짜 목록 페이지 접속
2. API 호출 확인:
   ```
   Request URL: https://date-log-back.onrender.com/v1/dates
   Status: 200 OK
   Response: [날짜 데이터 배열]
   ```

3. CORS 에러 없는지 확인

**⚠️ CORS 에러 발생 시**:
```
Access to fetch at 'https://date-log-back.onrender.com/v1/dates'
from origin 'https://datelog-frontend-production.onrender.com'
has been blocked by CORS policy
```

**해결 방법**:
1. Backend 프로젝트의 `.env.prod` 업데이트:
   ```env
   CORS_ORIGIN=https://datelog-frontend-production.onrender.com
   ```
2. Git commit & push (Backend 자동 재배포)
3. Frontend에서 재테스트

### 4.3 Kakao Maps 확인

1. 날짜 상세 페이지 접속
2. 지도 정상 로딩 확인
3. 마커 표시 확인
4. 정보창 동작 확인

**⚠️ 지도 로딩 실패 시**:
- 브라우저 콘솔 에러 확인
- Kakao API Key 유효성 확인
- Network 탭에서 Kakao API 호출 확인

### 4.4 CRUD 기능 테스트

**Create (생성)**:
```
1. "새 날짜 추가" 버튼 클릭
2. 날짜 및 지역 입력
3. "저장" 클릭
4. 목록에 추가되는지 확인
```

**Read (조회)**:
```
1. 날짜 목록에서 항목 클릭
2. 상세 페이지 로딩 확인
3. 카페/음식점/관광지 목록 표시 확인
```

**Update (수정)**:
```
1. 장소 항목에서 "수정" 클릭
2. 정보 변경 후 저장
3. 변경사항 반영 확인
```

**Delete (삭제)**:
```
1. 장소 항목에서 "삭제" 클릭
2. 확인 후 삭제
3. 목록에서 제거 확인
```

### 4.5 성능 측정 (Lighthouse)

```bash
# Chrome DevTools → Lighthouse
- Performance: > 90
- Accessibility: > 90
- Best Practices: > 90
- SEO: > 90
```

**개선이 필요한 경우**:
- 이미지 최적화
- Code splitting 확인
- Lazy loading 적용

**✅ 완료 기준**:
- [ ] 사이트 정상 접속
- [ ] Backend API 통신 성공
- [ ] CORS 에러 없음
- [ ] Kakao Maps 정상 로딩
- [ ] 모든 CRUD 기능 작동
- [ ] Lighthouse 점수 양호

---

## Task 5: LocalStorage 데이터 마이그레이션 (선택) 🟢

**기존 LocalStorage 데이터가 있는 경우**:

### 5.1 마이그레이션 스크립트 확인

```bash
# 마이그레이션 스크립트 위치 확인
cat src/utils/dataMigration.ts
```

### 5.2 마이그레이션 실행

**브라우저에서**:
1. 개발자 도구 → Console 열기
2. 마이그레이션 함수 실행:
   ```javascript
   // 마이그레이션 실행
   await migrateLocalStorageToBackend()
   ```

**또는 UI에서**:
1. 설정 페이지 접속
2. "LocalStorage → Backend 마이그레이션" 버튼 클릭
3. 진행 상황 확인

### 5.3 마이그레이션 검증

```bash
# Backend API에서 데이터 확인
curl https://date-log-back.onrender.com/v1/dates

# 브라우저에서 확인
# 날짜 목록에 마이그레이션된 데이터 표시
```

**✅ 완료 기준**:
- [ ] 마이그레이션 성공
- [ ] 모든 날짜 데이터 이전
- [ ] 모든 장소 데이터 이전
- [ ] 데이터 무결성 확인

---

## 🚨 트러블슈팅

### 문제 1: 빌드 실패 - "Environment variable not found"

**원인**: `.env.production` 파일 누락 또는 변수 미설정

**해결**:
```bash
# .env.production 확인
cat .env.production

# 필요한 변수 모두 있는지 확인
# VITE_로 시작하는 변수만 Vite에서 사용 가능
```

### 문제 2: CORS 에러

**원인**: Backend CORS_ORIGIN이 Frontend URL과 불일치

**해결**:
```bash
# Backend .env.prod 확인
CORS_ORIGIN=https://datelog-frontend-production.onrender.com

# 정확한 URL 사용 (trailing slash 주의)
# ✅ https://datelog-frontend-production.onrender.com
# ❌ https://datelog-frontend-production.onrender.com/
```

### 문제 3: Kakao Maps 로딩 실패

**원인**: API Key 오류 또는 도메인 등록 누락

**해결**:
```bash
# 1. Kakao Developers에서 도메인 등록 확인
# https://developers.kakao.com

# 2. Web 플랫폼에 Render 도메인 추가
# datelog-frontend-production.onrender.com

# 3. API Key 재확인
```

### 문제 4: 라우팅 404 에러 (페이지 새로고침 시)

**원인**: SPA rewrites 설정 누락

**해결**:
```bash
# Render Dashboard → Redirects/Rewrites
# Source: /*
# Destination: /index.html
# Action: Rewrite

# 또는 render.yaml 확인:
routes:
  - type: rewrite
    source: /*
    destination: /index.html
```

### 문제 5: 배포 후 변경사항 반영 안 됨

**원인**: 브라우저 캐시 또는 Render 캐시

**해결**:
```bash
# 1. 브라우저 강력 새로고침
# Ctrl + Shift + R (Windows)
# Cmd + Shift + R (Mac)

# 2. Render 캐시 클리어
# Dashboard → Settings → Clear Build Cache

# 3. 수동 재배포
# Dashboard → Manual Deploy
```

### 문제 6: 느린 API 응답

**원인**: Render Free Tier의 Cold Start

**해결**:
```bash
# 1. Paid Plan으로 업그레이드 (Cold Start 없음)

# 2. 또는 주기적인 Health Check 요청으로 유지
# 외부 서비스 (UptimeRobot, Cron-job.org)
```

---

## 📊 체크리스트 요약

### 사전 준비
- [ ] Git 상태 정리
- [ ] Uncommitted changes 처리
- [ ] Untracked 파일 삭제
- [ ] 환경 변수 검증

### Render 배포
- [ ] Render Static Site 생성
- [ ] 환경 변수 설정
- [ ] Rewrites 설정
- [ ] Headers 설정
- [ ] 첫 배포 성공

### 배포 검증
- [ ] 사이트 접속 확인
- [ ] Backend API 연동 확인
- [ ] CORS 정상 작동
- [ ] Kakao Maps 로딩 확인
- [ ] CRUD 기능 테스트
- [ ] Lighthouse 성능 확인

### 후속 작업
- [ ] LocalStorage 마이그레이션 (선택)
- [ ] 모니터링 설정
- [ ] 에러 트래킹 설정 (Sentry 등)

---

## 📚 참고 문서

- **배포 가이드**: `PHASE4_DEPLOYMENT.md` (1,000+ 라인)
- **Phase 4 완료 보고서**: `PHASE4_COMPLETION.md`
- **데이터 마이그레이션**: `PHASE3_DATA_MIGRATION.md`
- **트러블슈팅**: `TROUBLESHOOTING.md` (생성 예정)
- **Render 문서**: https://render.com/docs/static-sites

---

## 💡 다음 단계 추천

**최우선 작업**:
```bash
1. Git 상태 정리 (Task 1) - 10분
2. 환경 변수 검증 (Task 2) - 10분
3. Render 배포 (Task 3) - 20-30분
4. 배포 검증 (Task 4) - 20-30분
```

**예상 소요 시간**:
- Task 1: 10분 (Git 정리)
- Task 2: 10분 (환경 변수 검증)
- Task 3: 20-30분 (Render 배포)
- Task 4: 20-30분 (검증 및 테스트)
- Task 5: 10분 (마이그레이션, 선택)

**총 예상 시간**: 1-1.5시간

---

## 🔗 Backend 연동 확인사항

**Backend가 먼저 배포되어야 함**:
1. Backend 배포 완료 확인
2. Backend Health Check 성공
3. Backend API 엔드포인트 테스트 성공
4. 그 다음 Frontend 배포

**Backend 배포 가이드**: `../date-log-server/NEXT_STEPS.md`

---

**마지막 업데이트**: 2025년 11월 15일


## General Rules

1. **Clarify Ambiguities**
   - Always ask questions whenever the user's request seems ambiguous, unclear, or logically inconsistent.
   - Do not assume or infer meaning without explicit confirmation from the user.

2. **Language Policy**
   - All responses, documentation, and generated files must be written in **Korean**, unless the user explicitly requests otherwise.

3. **Provide Multiple Optimal Solutions**
   - For any development-related request, propose **at least three possible solutions or approaches** before starting any implementation.
   - Each proposed approach must:
      - Clearly explain *why* it is considered optimal.
      - Highlight trade-offs or limitations.
      - Avoid premature coding until the user chooses one.

4. **Use Common Components First**
   - Prioritize reusing shared UI components such as `MInput`, `MButton`, `MIcon`, etc.
   - Always verify if a reusable component already exists before developing new ones.
   - If creating a new component or using plain HTML elements, provide a clear justification (e.g., functional, stylistic, or technical reasons).

5. **Separation of Page and Business Logic**
   - Follow the **Single Responsibility Principle (SRP)**.
   - Keep page-level components and business logic strictly separated for maintainability and clarity.