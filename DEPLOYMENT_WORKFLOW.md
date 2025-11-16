# DateLog Frontend 배포 워크플로우

**프로젝트**: my-date-log (DateLog Frontend)
**배포 대상**: Render Static Site (Production)
**예상 소요 시간**: 100분 (약 1시간 40분)
**최종 업데이트**: 2025-11-16

---

## 📋 목차

1. [개요](#개요)
2. [전제 조건](#전제-조건)
3. [워크플로우 Phase](#워크플로우-phase)
4. [자동화 스크립트](#자동화-스크립트)
5. [트러블슈팅](#트러블슈팅)
6. [롤백 절차](#롤백-절차)
7. [완료 체크리스트](#완료-체크리스트)

---

## 개요

### 배포 목표
- DateLog Frontend를 Render에 프로덕션 배포
- 백엔드 API 연동 확인 (https://date-log-back.onrender.com)
- Kakao Maps 정상 작동 확인
- 모든 CRUD 기능 검증

### 배포 전략
- **Systematic Approach**: 단계별 검증 게이트 적용
- **Fail-Fast**: 각 Phase에서 문제 발견 시 즉시 중단
- **Rollback-Ready**: 모든 Phase에 롤백 절차 포함

### 워크플로우 구조
```
Phase 0: Pre-flight Validation (15분)
    ↓
Phase 1: Workspace Preparation (10분)
    ↓
Phase 2: Environment Configuration (10분) ← 병렬화
    ↓
Phase 3: Deployment (30분)
    ↓
Phase 4: Validation (25분) ← 일부 병렬화
    ↓
Phase 5: Data Migration (10분, 선택적)
    ↓
Phase 6: Post-deployment (10분)
```

---

## 전제 조건

### 필수 요구사항
- ✅ Node.js 설치 (v18 이상)
- ✅ Git 설치 및 설정
- ✅ Render 계정 생성 및 로그인
- ✅ GitHub 레포지토리 연동
- ✅ **Backend 배포 완료** (https://date-log-back.onrender.com)
- ✅ Kakao Developers 계정 및 API 키 발급

### 확인 사항
```bash
# Node.js 버전 확인
node --version  # v18.x 이상

# Git 설정 확인
git config user.name
git config user.email

# 레포지토리 확인
git remote -v
```

### 백엔드 배포 확인
```bash
# Backend Health Check (필수!)
curl https://date-log-back.onrender.com/v1/health
# 예상 응답: {"status":"ok"} 또는 200 OK
```

⚠️ **백엔드가 정상 작동하지 않으면 배포를 진행하지 마세요!**

---

## 워크플로우 Phase

## Phase 0: Pre-flight Validation 🔴

**목적**: 배포 전 로컬 환경에서 모든 것이 정상 작동하는지 검증
**예상 시간**: 15분
**담당**: Quality Engineer + Frontend Architect

### 0.1 테스트 실행 (5분)

```bash
# 전체 테스트 실행
npm test

# 예상 결과: All tests passed
# 커버리지: 80% 이상 (branches, functions, lines, statements)
```

**검증 기준**:
- ✅ 모든 테스트 통과
- ✅ 커버리지 임계값 충족 (80%)
- ❌ 실패 시: 테스트 수정 후 재실행

### 0.2 코드 품질 검증 (3분)

```bash
# ESLint 검사
npm run lint

# 예상 결과: No linting errors
```

**검증 기준**:
- ✅ Lint 에러 없음
- ⚠️ 경고는 허용 (배포 차단 안 함)
- ❌ 실패 시: 코드 수정 후 재실행

### 0.3 로컬 프로덕션 빌드 (7분)

```bash
# Production 빌드 실행
npm run build:production

# 빌드 결과 확인
ls -la dist/

# 로컬에서 프리뷰
npm run preview
# 브라우저: http://localhost:3000
```

**검증 기준**:
- ✅ 빌드 성공 (dist/ 디렉토리 생성)
- ✅ 로컬 프리뷰에서 정상 작동
- ✅ 콘솔 에러 없음
- ❌ 실패 시: 환경 변수 또는 코드 수정

### 성공 기준
- [ ] `npm test` 통과
- [ ] `npm run lint` 통과
- [ ] `npm run build:production` 성공
- [ ] 로컬 프리뷰 정상 작동

### 롤백 절차
해당 없음 (로컬 작업만 수행)

---

## Phase 1: Workspace Preparation 🟡

**목적**: Git 작업 공간을 깨끗하게 만들어 안전한 배포 준비
**예상 시간**: 10분
**담당**: DevOps Architect

### 1.1 Git 상태 확인 (2분)

```bash
# 현재 브랜치 확인
git branch
# 예상: * main 또는 * production

# Git 상태 확인
git status

# 최근 커밋 확인
git log --oneline -5
```

**현재 상태 (시작 전)**:
```
Changes not staged for commit:
  modified:   .claude/settings.local.json
  modified:   src/App.tsx

Untracked files:
  CLAUDE.md
  FIX_SUMMARY.md
  NEXT_STEPS.md
  PHASE4_COMPLETION.md.backup
  PHASE4_DEPLOYMENT.md.backup
  TROUBLESHOOTING.md
  check-env.js
  start-dev.bat
  test-env.html
```

### 1.2 변경사항 처리 (5분)

**src/App.tsx 처리**:
```bash
# 변경 내용 확인
git diff src/App.tsx

# 필요한 변경사항인 경우 → 커밋
git add src/App.tsx
git commit -m "fix: Update App.tsx for production deployment"

# 불필요한 변경사항인 경우 → 되돌리기
git restore src/App.tsx
```

**.claude/settings.local.json 처리**:
```bash
# 로컬 설정 파일은 되돌리기
git restore .claude/settings.local.json

# 또는 .gitignore에 추가
echo ".claude/settings.local.json" >> .gitignore
```

### 1.3 Untracked 파일 정리 (3분)

**문서 파일 커밋** (필요한 경우):
```bash
# 유용한 문서는 커밋
git add TROUBLESHOOTING.md NEXT_STEPS.md DEPLOYMENT_WORKFLOW.md
git commit -m "docs: Add deployment documentation"
```

**임시 파일 삭제**:
```bash
# 삭제 전 미리보기
git clean -n

# 실제 삭제 (불필요한 파일만)
rm FIX_SUMMARY.md
rm PHASE4_COMPLETION.md.backup
rm PHASE4_DEPLOYMENT.md.backup
rm check-env.js
rm start-dev.bat
rm test-env.html
```

### 1.4 최종 확인 (1분)

```bash
# Git 상태 재확인
git status

# 예상 결과: "nothing to commit, working tree clean"
```

### 성공 기준
- [ ] `git status` clean 상태
- [ ] 필요한 변경사항 모두 커밋됨
- [ ] 불필요한 파일 모두 삭제됨
- [ ] 브랜치가 main 또는 production

### 롤백 절차
```bash
# 잘못 커밋한 경우
git reset --soft HEAD~1  # 커밋 취소, 변경사항 유지

# 잘못 삭제한 경우
git reflog  # 삭제 전 커밋 찾기
git checkout <commit-hash> <file-path>  # 파일 복구
```

---

## Phase 2: Environment Configuration 🟡

**목적**: 모든 환경 변수와 외부 의존성 확인
**예상 시간**: 10분 (병렬화 적용)
**담당**: Security Engineer + Backend Architect

### 2.1 환경 변수 파일 검증 (병렬 작업, 5분)

**파일 존재 확인**:
```bash
# 3개 환경 파일 확인
ls -la .env*

# 예상 결과:
# .env.development
# .env.staging
# .env.production
# .env.example
```

**각 환경별 검증** (병렬 실행 가능):

**Development 환경**:
```bash
cat .env.development

# 필수 변수 확인:
# VITE_KAKAO_MAP_API_KEY=<your-dev-key>
# VITE_API_BASE_URL=http://localhost:3001/v1
# VITE_API_TIMEOUT=10000
# VITE_ENABLE_API=false
```

**Staging 환경**:
```bash
cat .env.staging

# 필수 변수 확인:
# VITE_KAKAO_MAP_API_KEY=ff76d41c3df3ea33d5547a24db77743c
# VITE_API_BASE_URL=https://datelog-backend-staging.onrender.com/v1
# VITE_API_TIMEOUT=10000
# VITE_ENABLE_API=true
```

**Production 환경**:
```bash
cat .env.production

# 필수 변수 확인:
# VITE_KAKAO_MAP_API_KEY=ff76d41c3df3ea33d5547a24db77743c
# VITE_API_BASE_URL=https://date-log-back.onrender.com/v1
# VITE_API_TIMEOUT=10000
# VITE_ENABLE_API=true
```

⚠️ **보안 주의사항**:
- .env.development, .env.staging은 `.gitignore`에 포함되어야 함
- .env.production은 placeholder 값만 포함 (실제 키는 Render Dashboard에 설정)

### 2.2 백엔드 상태 확인 (병렬 작업, 3분)

**Production 백엔드**:
```bash
# Health Check
curl -i https://date-log-back.onrender.com/v1/health

# 예상 응답: HTTP/1.1 200 OK
# {"status":"ok"} 또는 유사한 응답

# API 엔드포인트 테스트 (선택적)
curl https://date-log-back.onrender.com/v1/dates
```

**Staging 백엔드** (선택적):
```bash
curl -i https://datelog-backend-staging.onrender.com/v1/health
```

**CORS 설정 확인**:
```bash
# Backend .env.prod 확인 (Backend 레포지토리에서)
# CORS_ORIGIN=https://datelog-frontend-production.onrender.com

# 또는 Backend 팀에 확인 요청
```

### 2.3 Kakao Maps 도메인 등록 확인 (2분)

1. https://developers.kakao.com 접속
2. 내 애플리케이션 → 앱 선택
3. 플랫폼 → Web 플랫폼 확인
4. 등록된 도메인 확인:
   - ✅ `datelog-frontend-production.onrender.com`
   - ✅ `localhost:5173` (개발용)

⚠️ **미등록 시**: Web 플랫폼에 도메인 추가 후 저장

### 성공 기준
- [ ] 3개 .env 파일 모두 존재하고 올바른 값 포함
- [ ] Production 백엔드 health check 200 OK
- [ ] Staging 백엔드 정상 (선택적)
- [ ] CORS_ORIGIN에 프론트엔드 도메인 포함
- [ ] Kakao Maps 도메인 등록 완료

### 롤백 절차
환경 변수 수정 시 백업 생성:
```bash
cp .env.production .env.production.backup
```

---

## Phase 3: Deployment 🔴

**목적**: Render에 프로덕션 배포 실행
**예상 시간**: 30분
**담당**: DevOps Architect

### 3.1 Render Static Site 생성 (방법 선택)

#### 방법 1: Blueprint 자동 배포 (추천, 10분)

```bash
# Render CLI 설치 (선택)
npm install -g render-cli

# Blueprint로 배포
render blueprint launch

# render.yaml을 읽어서 자동으로 Static Site 생성
```

#### 방법 2: 수동 배포 (20분)

**Render Dashboard 작업**:

1. **New → Static Site** 클릭
2. **GitHub 레포지토리 선택**: `your-username/my-date-log`
3. **기본 설정 입력**:
   - **Name**: `datelog-frontend-production`
   - **Branch**: `main` (또는 `production`)
   - **Build Command**: `npm install && npm run build:production`
   - **Publish Directory**: `dist`
   - **Auto-Deploy**: Enable (Git push 시 자동 배포)

### 3.2 환경 변수 설정 (5분)

**Render Dashboard → Environment**:

```env
NODE_ENV=production
VITE_KAKAO_MAP_API_KEY=ff76d41c3df3ea33d5547a24db77743c
VITE_API_BASE_URL=https://date-log-back.onrender.com/v1
VITE_API_TIMEOUT=10000
VITE_ENABLE_API=true
```

⚠️ **중요**:
- Kakao Map API Key는 Render Dashboard에서만 설정 (보안)
- `.env.production` 파일의 값은 placeholder

### 3.3 Rewrites 설정 (3분)

**Render Dashboard → Redirects/Rewrites**:

SPA 라우팅을 위한 Rewrite 규칙 추가:
```yaml
- type: rewrite
  source: /*
  destination: /index.html
```

**또는 render.yaml 확인**:
```yaml
services:
  - type: web
    name: datelog-frontend-production
    env: static
    buildCommand: npm install && npm run build:production
    staticPublishPath: ./dist
    routes:
      - type: rewrite
        source: /*
        destination: /index.html
```

### 3.4 Headers 설정 (2분)

**Render Dashboard → Headers**:

성능 최적화를 위한 캐시 헤더:
```yaml
- path: /assets/*
  name: Cache-Control
  value: public, max-age=31536000, immutable
```

### 3.5 배포 실행 (10분)

**자동 배포 트리거**:
```bash
# Git push로 자동 배포
git push origin main

# 또는 production 브랜치 사용 시
git push origin production
```

**또는 수동 배포**:
- Render Dashboard → **Manual Deploy** 버튼 클릭

**배포 로그 확인**:
1. Render Dashboard → Logs
2. 빌드 진행 상황 실시간 모니터링
3. 성공 메시지 확인: "Build successful"

**배포 완료 확인**:
```bash
# 배포된 URL 접속
# https://datelog-frontend-production.onrender.com

# curl로 확인
curl -I https://datelog-frontend-production.onrender.com
# 예상: HTTP/2 200
```

### 성공 기준
- [ ] Static Site 생성 완료
- [ ] 환경 변수 모두 설정됨
- [ ] Rewrites 규칙 적용됨
- [ ] Headers 설정 완료
- [ ] 빌드 성공 (Logs에서 확인)
- [ ] 배포된 URL 접속 가능 (200 OK)

### 롤백 절차
```bash
# 방법 1: Render Dashboard에서 이전 배포 선택
# Dashboard → Deployments → 이전 배포 선택 → Redeploy

# 방법 2: Git revert
git revert HEAD
git push origin main  # 자동 재배포
```

---

## Phase 4: Validation 🟡

**목적**: 배포된 애플리케이션이 정상 작동하는지 검증
**예상 시간**: 25분 (일부 병렬화)
**담당**: Quality Engineer + Frontend Architect + Backend Architect

### 4.1 기본 접속 확인 (순차, 3분)

```bash
# URL 접속 확인
curl -I https://datelog-frontend-production.onrender.com

# 예상 응답:
# HTTP/2 200
# content-type: text/html
```

**브라우저 확인**:
1. https://datelog-frontend-production.onrender.com 접속
2. 메인 페이지 정상 로딩 확인
3. 개발자 도구 → Console: 에러 없는지 확인
4. 개발자 도구 → Network: 리소스 로딩 확인

### 4.2 Backend API 연동 확인 (순차, 5분)

**브라우저 개발자 도구 → Network**:

1. 날짜 목록 페이지 접속
2. API 호출 확인:
   ```
   Request URL: https://date-log-back.onrender.com/v1/dates
   Status: 200 OK
   Response Type: application/json
   ```

3. **CORS 검증**:
   - Response Headers에서 확인:
   ```
   access-control-allow-origin: https://datelog-frontend-production.onrender.com
   ```
   - Console에 CORS 에러 없는지 확인

**CORS 에러 발생 시** 🚨:
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
2. Backend git commit & push (자동 재배포)
3. Frontend에서 재테스트 (5분 대기 후)

### 4.3 Kakao Maps 확인 (병렬 가능, 5분)

1. 날짜 상세 페이지 접속 (지도가 있는 페이지)
2. 지도 정상 로딩 확인
3. 마커 표시 확인
4. 정보창 클릭 동작 확인

**지도 로딩 실패 시** 🚨:
- 브라우저 Console 에러 메시지 확인
- Network 탭에서 Kakao API 호출 상태 확인:
  ```
  Failed to load resource: https://dapi.kakao.com/...
  ```
- **원인**: 도메인 미등록 → Phase 2.3으로 돌아가서 등록 후 재배포

### 4.4 CRUD 기능 테스트 (병렬 가능, 7분)

**Create (생성)**:
```
1. "새 날짜 추가" 버튼 클릭
2. 날짜 및 지역 입력 (예: 2025-11-20, 삼송)
3. "저장" 클릭
4. 목록에 새 항목 표시 확인
5. Network 탭: POST /v1/dates → 201 Created
```

**Read (조회)**:
```
1. 날짜 목록에서 항목 클릭
2. 상세 페이지 로딩 확인
3. 카페/음식점/관광지 목록 표시 확인
4. Network 탭: GET /v1/dates/:id → 200 OK
```

**Update (수정)**:
```
1. 장소 항목에서 "수정" 버튼 클릭
2. 정보 변경 (예: 카페 이름, 메모)
3. "저장" 클릭
4. 변경사항 반영 확인
5. Network 탭: PUT /v1/dates/:id → 200 OK
```

**Delete (삭제)**:
```
1. 장소 항목에서 "삭제" 버튼 클릭
2. 확인 팝업 → "확인" 클릭
3. 목록에서 제거 확인
4. Network 탭: DELETE /v1/dates/:id → 204 No Content
```

### 4.5 성능 측정 (병렬 가능, 5분)

**Lighthouse 실행**:
1. Chrome DevTools → Lighthouse
2. Categories: Performance, Accessibility, Best Practices, SEO 모두 체크
3. Device: Desktop 또는 Mobile
4. **Analyze page load** 클릭

**목표 점수**:
- Performance: **> 90**
- Accessibility: **> 90**
- Best Practices: **> 90**
- SEO: **> 90**

**점수 낮은 경우** (개선은 배포 후 별도 작업):
- Performance < 80: 이미지 최적화, code splitting 검토
- Accessibility < 80: ARIA 라벨, 키보드 네비게이션 검토
- Best Practices < 80: HTTPS, 보안 헤더 확인

### 성공 기준
- [ ] 사이트 정상 접속 (200 OK)
- [ ] Backend API 통신 성공
- [ ] CORS 에러 없음
- [ ] Kakao Maps 정상 로딩
- [ ] Create 기능 작동
- [ ] Read 기능 작동
- [ ] Update 기능 작동
- [ ] Delete 기능 작동
- [ ] Lighthouse 점수 양호 (>80)

### 롤백 절차
치명적 기능 실패 시 (API 연동 안 됨, Maps 안 뜸):
```bash
# Phase 3 롤백 실행
# Render Dashboard → Deployments → 이전 배포 선택 → Redeploy
```

마이너 이슈 (성능 낮음, UI 버그):
- 롤백하지 않고 별도 핫픽스로 처리

---

## Phase 5: Data Migration 🟢 (선택적)

**목적**: 기존 localStorage 데이터를 백엔드로 이전
**예상 시간**: 10분
**담당**: Backend Architect
**선택적**: 기존 사용자 데이터가 있는 경우만 실행

### 5.1 마이그레이션 준비 (2분)

**마이그레이션 스크립트 확인**:
```bash
cat src/scripts/migrate-data.ts
```

**Dry-run 실행** (미리보기):
```bash
npm run migrate

# 예상 출력:
# [Dry-run] 마이그레이션할 데이터:
# - 날짜: 15개
# - 장소: 45개
# - 총 API 호출: 15회
```

### 5.2 마이그레이션 실행 (5분)

**실제 마이그레이션**:
```bash
npm run migrate:execute

# 진행 상황 모니터링
# - 날짜 1/15 완료...
# - 날짜 2/15 완료...
# ...
# 마이그레이션 완료!
```

**또는 브라우저 UI에서**:
1. 배포된 사이트 접속
2. 설정 페이지 이동
3. "LocalStorage → Backend 마이그레이션" 버튼 클릭
4. 진행 상황 확인

### 5.3 마이그레이션 검증 (3분)

**백엔드 데이터 확인**:
```bash
# API로 데이터 확인
curl https://date-log-back.onrender.com/v1/dates

# 예상 응답: 마이그레이션된 날짜 목록 (JSON)
```

**브라우저 확인**:
1. 날짜 목록 페이지 새로고침
2. 모든 마이그레이션된 데이터 표시 확인
3. localStorage와 비교 (개발자 도구 → Application → Local Storage)

### 성공 기준
- [ ] Dry-run 성공
- [ ] 마이그레이션 실행 완료 (에러 없음)
- [ ] 모든 날짜 데이터 이전됨
- [ ] 모든 장소 데이터 이전됨
- [ ] 데이터 무결성 확인 (누락 없음)

### 롤백 절차
마이그레이션 실패 또는 데이터 손상 시:
```bash
# 백엔드 데이터 삭제 (Backend API 사용)
curl -X DELETE https://date-log-back.onrender.com/v1/dates/:id

# localStorage는 그대로 유지 (백업 역할)
```

---

## Phase 6: Post-deployment 🟢

**목적**: 모니터링 및 알림 설정으로 안정적인 운영 준비
**예상 시간**: 10분
**담당**: DevOps Architect
**선택적**: 권장하지만 배포 성공에 필수는 아님

### 6.1 에러 트래킹 설정 (5분)

**Sentry 설정** (예시):
```bash
# Sentry 설치
npm install @sentry/react @sentry/vite-plugin

# src/main.tsx에 Sentry 초기화
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "YOUR_SENTRY_DSN",
  environment: "production",
  tracesSampleRate: 0.1,
});
```

**또는 간단한 로깅**:
- Render Dashboard → Logs에서 수동 모니터링

### 6.2 성능 모니터링 (3분)

**옵션 1: Google Analytics**:
```html
<!-- public/index.html -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
```

**옵션 2: Render 내장 모니터링**:
- Render Dashboard → Metrics
- Bandwidth, Requests, Response Time 확인

### 6.3 알림 설정 (2분)

**Render Notifications**:
1. Render Dashboard → Settings → Notifications
2. 이메일 알림 활성화:
   - Deploy started
   - Deploy succeeded
   - Deploy failed
   - Service suspended

### 성공 기준
- [ ] 에러 트래킹 작동 (Sentry 또는 로그)
- [ ] 성능 모니터링 대시보드 접근 가능
- [ ] 알림 수신 확인 (테스트 배포로 검증)

### 롤백 절차
해당 없음 (모니터링 설정은 애플리케이션 작동에 영향 없음)

---

## 자동화 스크립트

### Pre-deployment 자동화 스크립트

**package.json에 추가**:
```json
{
  "scripts": {
    "pre-deploy": "npm test && npm run lint && npm run build:production",
    "deploy:check": "node scripts/check-deployment.js"
  }
}
```

**scripts/check-deployment.js**:
```javascript
#!/usr/bin/env node

const https = require('https');

const checks = [
  {
    name: 'Backend Health (Production)',
    url: 'https://date-log-back.onrender.com/v1/health',
    expected: 200
  },
  {
    name: 'Backend Health (Staging)',
    url: 'https://datelog-backend-staging.onrender.com/v1/health',
    expected: 200
  }
];

async function checkEndpoint(check) {
  return new Promise((resolve) => {
    https.get(check.url, (res) => {
      const success = res.statusCode === check.expected;
      console.log(`${success ? '✅' : '❌'} ${check.name}: ${res.statusCode}`);
      resolve(success);
    }).on('error', (err) => {
      console.log(`❌ ${check.name}: ${err.message}`);
      resolve(false);
    });
  });
}

async function main() {
  console.log('🔍 Deployment Pre-flight Check\n');

  const results = await Promise.all(checks.map(checkEndpoint));
  const allPassed = results.every(r => r);

  console.log(`\n${allPassed ? '✅ All checks passed!' : '❌ Some checks failed!'}`);
  process.exit(allPassed ? 0 : 1);
}

main();
```

**사용 방법**:
```bash
# Phase 0 시작 전 실행
npm run pre-deploy

# Phase 2 시작 전 실행
npm run deploy:check
```

---

## 트러블슈팅

### 문제 1: 빌드 실패 - "Environment variable not found"

**증상**:
```
Error: Environment variable VITE_KAKAO_MAP_API_KEY is not defined
```

**원인**: `.env.production` 파일 누락 또는 변수 미설정

**해결**:
```bash
# .env.production 확인
cat .env.production

# 필요한 변수 모두 있는지 확인
# VITE_로 시작하는 변수만 Vite에서 사용 가능

# Render Dashboard에서 환경 변수 재확인
# Settings → Environment → 모든 VITE_* 변수 존재 확인
```

---

### 문제 2: CORS 에러

**증상**:
```
Access to fetch at 'https://date-log-back.onrender.com/v1/dates'
from origin 'https://datelog-frontend-production.onrender.com'
has been blocked by CORS policy
```

**원인**: Backend CORS_ORIGIN이 Frontend URL과 불일치

**해결**:
```bash
# Backend .env.prod 확인
CORS_ORIGIN=https://datelog-frontend-production.onrender.com

# 정확한 URL 사용 (trailing slash 주의)
# ✅ https://datelog-frontend-production.onrender.com
# ❌ https://datelog-frontend-production.onrender.com/

# Backend 수정 후 재배포
cd ../date-log-server
git add .env.prod
git commit -m "fix: Update CORS_ORIGIN for frontend"
git push origin main

# 5분 대기 후 Frontend에서 재테스트
```

---

### 문제 3: Kakao Maps 로딩 실패

**증상**:
- 지도 영역이 회색으로 표시
- Console 에러: "Kakao Maps API authentication failed"

**원인**: API Key 오류 또는 도메인 등록 누락

**해결**:
```bash
# 1. Kakao Developers에서 도메인 등록 확인
# https://developers.kakao.com
# 내 애플리케이션 → 앱 설정 → 플랫폼

# 2. Web 플랫폼에 Render 도메인 추가
# datelog-frontend-production.onrender.com

# 3. API Key 재확인
# Render Dashboard → Environment → VITE_KAKAO_MAP_API_KEY

# 4. 재배포
# Render Dashboard → Manual Deploy
```

---

### 문제 4: 라우팅 404 에러 (페이지 새로고침 시)

**증상**:
- 메인 페이지는 작동
- 상세 페이지 새로고침 시 404 Not Found

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

# 설정 후 재배포
```

---

### 문제 5: 배포 후 변경사항 반영 안 됨

**증상**:
- 코드 변경 후 배포했지만 이전 버전 표시

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

# 4. 배포 로그 확인
# Dashboard → Logs → 최신 커밋 해시 확인
```

---

### 문제 6: 느린 API 응답

**증상**:
- 첫 API 호출이 10초 이상 소요
- 이후 호출은 빠름

**원인**: Render Free Tier의 Cold Start (15분 비활성 시 서버 대기 모드)

**해결**:
```bash
# 옵션 1: Paid Plan으로 업그레이드 (Cold Start 없음)

# 옵션 2: 주기적인 Health Check 요청으로 서버 활성 유지
# 외부 서비스 사용 (UptimeRobot, Cron-job.org)
# 5분마다 GET https://date-log-back.onrender.com/v1/health

# 옵션 3: 사용자에게 안내
# "첫 로딩은 10초 정도 소요될 수 있습니다"
```

---

## 롤백 절차

### 시나리오별 롤백 가이드

#### 시나리오 1: Phase 0-2 실패 (로컬 문제)
**상황**: 테스트 실패, 빌드 에러, 환경 변수 오류

**롤백**:
```bash
# 배포하지 않았으므로 롤백 불필요
# 로컬에서 문제 해결 후 재시도
```

---

#### 시나리오 2: Phase 3 배포 실패
**상황**: Render 빌드 에러, 배포 중단

**롤백**:
```bash
# 방법 1: Render Dashboard에서 이전 배포 선택
# 1. Dashboard → Deployments
# 2. 이전 정상 배포 찾기
# 3. "Redeploy" 클릭

# 방법 2: Git revert
git log --oneline -5  # 최근 커밋 확인
git revert <bad-commit-hash>
git push origin main  # 자동 재배포 트리거
```

**예상 복구 시간**: 5분

---

#### 시나리오 3: Phase 4 검증 실패 (런타임 에러)
**상황**: 배포 성공했지만 기능 작동 안 함 (API 에러, Maps 에러)

**롤백**:
```bash
# 치명적 이슈인 경우 즉시 롤백
# Render Dashboard → Deployments → 이전 배포 → Redeploy

# 또는 Git revert
git revert HEAD
git push origin main
```

**마이너 이슈인 경우** (성능 저하, UI 버그):
```bash
# 롤백하지 않고 핫픽스 배포
git checkout -b hotfix/issue-name
# 수정 작업
git commit -m "hotfix: Fix issue-name"
git push origin hotfix/issue-name
# PR 생성 → 리뷰 → 병합 → 자동 배포
```

**예상 복구 시간**: 10분

---

#### 시나리오 4: Phase 5 마이그레이션 실패
**상황**: 데이터 마이그레이션 중 에러

**롤백**:
```bash
# 백엔드 데이터 삭제 (잘못 이전된 데이터)
# Backend API 사용 또는 데이터베이스 직접 접근

# localStorage 데이터는 유지 (백업 역할)
# 다시 마이그레이션 시도 가능
```

**예상 복구 시간**: 5분

---

### 완전 재배포 절차 (최악의 시나리오)

**상황**: 모든 롤백 시도 실패, 완전히 새로 시작 필요

```bash
# 1. Render에서 Static Site 삭제
# Dashboard → Settings → Delete Service

# 2. Git에서 안정적인 커밋으로 되돌리기
git log --oneline -10
git reset --hard <stable-commit-hash>
git push -f origin main  # 주의: Force push

# 3. Phase 0부터 다시 시작
# DEPLOYMENT_WORKFLOW.md 처음부터 실행

# 4. 예상 소요 시간: 100분 (전체 워크플로우)
```

---

## 완료 체크리스트

### 배포 준비 완료 ✅
- [ ] `npm test` 통과
- [ ] `npm run lint` 통과
- [ ] `npm run build:production` 성공
- [ ] Git status clean
- [ ] 3개 .env 파일 존재 및 검증
- [ ] Backend health check 200 OK
- [ ] CORS 설정 확인
- [ ] Kakao Maps 도메인 등록

### 배포 실행 완료 ✅
- [ ] Render Static Site 생성
- [ ] 환경 변수 Render Dashboard에 설정
- [ ] Rewrites 규칙 적용 (`/* → /index.html`)
- [ ] Headers 설정 (Cache-Control)
- [ ] 배포 성공 (Logs 확인)
- [ ] 배포 URL 접속 가능

### 검증 완료 ✅
- [ ] 기본 접속 정상 (200 OK)
- [ ] Backend API 연동 성공
- [ ] CORS 에러 없음
- [ ] Kakao Maps 정상 로딩
- [ ] CRUD 모든 기능 작동 (Create, Read, Update, Delete)
- [ ] Lighthouse 성능 >80

### 후속 작업 완료 ✅ (선택적)
- [ ] 데이터 마이그레이션 성공 (해당 시)
- [ ] 에러 트래킹 설정 (Sentry 등)
- [ ] 성능 모니터링 설정
- [ ] 알림 설정 (배포 알림)

---

## 다음 단계

### 배포 성공 후 권장 작업

1. **문서화** (30분):
   ```bash
   # 배포 경험 기록
   # - 발생한 이슈와 해결 방법
   # - 소요 시간과 개선점
   # - 다음 배포 시 주의사항
   ```

2. **모니터링 대시보드 설정** (1시간):
   - Render Metrics 확인
   - 사용자 트래픽 분석
   - 에러 로그 모니터링

3. **성능 최적화** (2-4시간):
   - Lighthouse 권장사항 적용
   - 이미지 최적화
   - Code splitting 개선

4. **CI/CD 파이프라인 구축** (4-8시간):
   - GitHub Actions 설정
   - 자동 테스트 실행
   - 자동 배포 파이프라인

---

## 연락처 및 리소스

### 도움이 필요한 경우

- **Backend 이슈**: Backend 팀에 문의 (date-log-server 레포지토리)
- **Render 지원**: https://render.com/docs
- **Kakao Maps 지원**: https://developers.kakao.com
- **프로젝트 문서**:
  - `CLAUDE.md` - 프로젝트 개요
  - `NEXT_STEPS.md` - 원본 배포 가이드
  - `TROUBLESHOOTING.md` - 트러블슈팅 가이드

---

**마지막 업데이트**: 2025-11-16
**문서 버전**: 1.0
**작성자**: DevOps Team (SuperClaude Framework)

**배포 성공을 기원합니다! 🚀**
