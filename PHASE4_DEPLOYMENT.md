# Phase 4: 프로덕션 배포 가이드

## 📋 배포 아키텍처

```
┌─────────────────────────────────────────────────────────────┐
│                    Production Architecture                   │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐         ┌──────────────┐                 │
│  │   Vercel     │         │   Render     │                 │
│  │  (Frontend)  │────────▶│  (Backend)   │                 │
│  │              │  HTTPS  │              │                 │
│  └──────────────┘         └───────┬──────┘                 │
│         │                         │                         │
│         │                         │                         │
│         │                  ┌──────▼──────┐                 │
│         │                  │  PostgreSQL │                 │
│         │                  │  (Render)   │                 │
│         │                  └─────────────┘                 │
│         │                                                   │
│    ┌────▼─────┐                                            │
│    │  Kakao   │                                            │
│    │   Maps   │                                            │
│    │   API    │                                            │
│    └──────────┘                                            │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## 🎯 배포 환경

### Development (로컬)
- **Frontend**: `http://localhost:5173`
- **Backend**: `http://localhost:3001`
- **Database**: Docker PostgreSQL (localhost:5432)
- **Data**: LocalStorage

### Staging (테스트)
- **Frontend**: `https://your-datelog-staging.vercel.app`
- **Backend**: `https://datelog-backend-staging.onrender.com`
- **Database**: Render PostgreSQL (Oregon)
- **Data**: PostgreSQL

### Production (실제 서비스)
- **Frontend**: `https://your-datelog.vercel.app`
- **Backend**: `https://date-log-back.onrender.com`
- **Database**: Render PostgreSQL (Oregon)
- **Data**: PostgreSQL

---

## 📂 환경 변수 설정

### Frontend 환경 변수

#### `.env.development` (로컬 개발)
```env
# Kakao Map API Key
VITE_KAKAO_MAP_API_KEY=ff76d41c3df3ea33d5547a24db77743c

# API Configuration
VITE_API_BASE_URL=http://localhost:3001/v1
VITE_API_TIMEOUT=10000
VITE_ENABLE_API=false
```

#### `.env.staging` (Staging 환경)
```env
# Kakao Map API Key
VITE_KAKAO_MAP_API_KEY=ff76d41c3df3ea33d5547a24db77743c

# API Configuration
VITE_API_BASE_URL=https://datelog-backend-staging.onrender.com/v1
VITE_API_TIMEOUT=10000
VITE_ENABLE_API=true
```

#### `.env.production` (Production 환경)
```env
# Kakao Map API Key
VITE_KAKAO_MAP_API_KEY=ff76d41c3df3ea33d5547a24db77743c

# API Configuration
VITE_API_BASE_URL=https://date-log-back.onrender.com/v1
VITE_API_TIMEOUT=10000
VITE_ENABLE_API=true
```

### Backend 환경 변수

#### `.env` (로컬 개발)
```env
# Server Configuration
PORT=3001
NODE_ENV=development

# CORS Configuration
CORS_ORIGIN=*

# Database Configuration
DATABASE_URL="postgresql://datelog:datelog_dev@localhost:5432/datelog_dev"
```

#### `.env.stag` (Staging 환경)
```env
# Server Configuration
NODE_ENV=staging
PORT=3001

# CORS Configuration
CORS_ORIGIN=https://your-datelog-staging.vercel.app

# Database Configuration (Render PostgreSQL)
DATABASE_URL=postgresql://admin:FbvtqKJu2wUPfeB9COXXF1lZXIvHtE9O@dpg-d3pkgmali9vc73bld3og-a.oregon-postgres.render.com:5432/date_schedule
```

#### `.env.prod` (Production 환경)
```env
# Server Configuration
NODE_ENV=production
PORT=3001

# CORS Configuration
CORS_ORIGIN=https://your-datelog.vercel.app

# Database Configuration (Render PostgreSQL)
# Internal network URL (faster, more secure)
DATABASE_URL=postgresql://admin:FbvtqKJu2wUPfeB9COXXF1lZXIvHtE9O@dpg-d3pkgmali9vc73bld3og-a:5432/date_schedule
```

---

## 🚀 Vercel 배포 (Frontend)

### 1. Vercel 프로젝트 생성

**방법 1: Vercel CLI**
```bash
cd my-date-log

# Vercel CLI 설치
npm install -g vercel

# Vercel 로그인
vercel login

# 프로젝트 배포 (최초)
vercel
```

**방법 2: Vercel 웹사이트**
1. https://vercel.com 접속
2. "New Project" 클릭
3. GitHub 저장소 연결
4. `my-date-log` 저장소 선택
5. Framework Preset: Vite
6. Root Directory: `./`
7. Build Command: `npm run build`
8. Output Directory: `dist`

### 2. 환경 변수 설정

Vercel Dashboard → Settings → Environment Variables:

**Staging 환경**:
```
VITE_API_BASE_URL=https://datelog-backend-staging.onrender.com/v1
VITE_API_TIMEOUT=10000
VITE_ENABLE_API=true
VITE_KAKAO_MAP_API_KEY=[your-staging-api-key]
```

**Production 환경**:
```
VITE_API_BASE_URL=https://date-log-back.onrender.com/v1
VITE_API_TIMEOUT=10000
VITE_ENABLE_API=true
VITE_KAKAO_MAP_API_KEY=[your-production-api-key]
```

### 3. 도메인 설정

**Staging**:
- Branch: `develop` 또는 `staging`
- Domain: `datelog-staging.vercel.app`

**Production**:
- Branch: `main` 또는 `production`
- Domain: `datelog.vercel.app`
- Custom Domain: `yourdomain.com` (optional)

### 4. 빌드 스크립트

```json
{
  "scripts": {
    "build:staging": "vite build --mode staging",
    "build:production": "vite build --mode production"
  }
}
```

Vercel Dashboard → Settings → Build & Development Settings:
- **Staging**: `npm run build:staging`
- **Production**: `npm run build:production`

---

## 🔧 Render 배포 (Backend)

### 1. Render 프로젝트 생성

#### Web Service 생성

1. https://render.com 접속
2. "New +" → "Web Service" 클릭
3. GitHub 저장소 연결
4. `date-log-server` 저장소 선택
5. 설정:
   - **Name**: `datelog-backend-staging` 또는 `datelog-backend-production`
   - **Region**: Oregon (US West)
   - **Branch**: `main` (staging) 또는 `production` (production)
   - **Runtime**: Node
   - **Build Command**: `npm install && npx prisma generate && npm run build`
   - **Start Command**: `npm start`
   - **Plan**: Free (staging) / Starter (production)

### 2. 환경 변수 설정

Render Dashboard → Environment:

**Staging**:
```
NODE_ENV=staging
PORT=3001
DATABASE_URL=postgresql://admin:FbvtqKJu2wUPfeB9COXXF1lZXIvHtE9O@dpg-d3pkgmali9vc73bld3og-a.oregon-postgres.render.com:5432/date_schedule
CORS_ORIGIN=https://datelog-staging.vercel.app
```

**Production**:
```
NODE_ENV=production
PORT=3001
DATABASE_URL=postgresql://admin:FbvtqKJu2wUPfeB9COXXF1lZXIvHtE9O@dpg-d3pkgmali9vc73bld3og-a:5432/date_schedule
CORS_ORIGIN=https://datelog.vercel.app
```

### 3. Health Check 설정

Render Dashboard → Health Check Path: `/v1/health`

### 4. 자동 배포 설정

Render Dashboard → Settings:
- **Auto-Deploy**: Yes
- **Branch**: `main` (staging) / `production` (production)

### 5. 데이터베이스 연결

**PostgreSQL Database (이미 존재)**:
- Name: `datelog-postgres`
- Database: `date_schedule`
- User: `admin`
- Region: Oregon
- Plan: Free

**Connection String**:
- **External**: `dpg-xxx-a.oregon-postgres.render.com:5432`
- **Internal**: `dpg-xxx-a:5432` (Render 내부 네트워크)

---

## 🗄️ 데이터베이스 마이그레이션

### 1. Staging DB 마이그레이션

```bash
cd date-log-server

# 환경 변수 설정
export DATABASE_URL="postgresql://admin:FbvtqKJu2wUPfeB9COXXF1lZXIvHtE9O@dpg-d3pkgmali9vc73bld3og-a.oregon-postgres.render.com:5432/date_schedule"

# Prisma 마이그레이션
npx prisma migrate deploy

# 또는 스키마 푸시 (개발 중)
npx prisma db push

# 데이터 확인
npx prisma studio
```

### 2. Production DB 마이그레이션

```bash
cd date-log-server

# 환경 변수 설정
export DATABASE_URL="postgresql://admin:FbvtqKJu2wUPfeB9COXXF1lZXIvHtE9O@dpg-d3pkgmali9vc73bld3og-a:5432/date_schedule"

# Prisma 마이그레이션
npx prisma migrate deploy

# 데이터 확인
npx prisma studio
```

### 3. LocalStorage → Production 데이터 마이그레이션

**Phase 3 마이그레이션 스크립트 사용**:

```bash
cd my-date-log

# 1. 백엔드 서버 URL 설정
export VITE_API_BASE_URL="https://date-log-back.onrender.com/v1"

# 2. Dry Run (미리보기)
npm run migrate

# 3. 실제 마이그레이션
npm run migrate:execute
```

**주의사항**:
- Production 마이그레이션 전 **반드시** Staging에서 먼저 테스트
- 데이터 백업 필수
- 마이그레이션 실패 시 롤백 계획 준비

---

## 📦 배포 프로세스

### Staging 배포

```bash
# 1. Frontend 배포
cd my-date-log
git checkout staging
git pull origin staging
npm run build:staging
git push origin staging
# Vercel이 자동 배포

# 2. Backend 배포
cd date-log-server
git checkout main
git pull origin main
npm run build
git push origin main
# Render가 자동 배포

# 3. DB 마이그레이션
export DATABASE_URL="[staging-db-url]"
npx prisma migrate deploy

# 4. 검증
curl https://datelog-backend-staging.onrender.com/v1/health
open https://datelog-staging.vercel.app
```

### Production 배포

```bash
# 1. Frontend 배포
cd my-date-log
git checkout production
git pull origin production
npm run build:production
git push origin production
# Vercel이 자동 배포

# 2. Backend 배포
cd date-log-server
git checkout production
git pull origin production
npm run build
git push origin production
# Render가 자동 배포

# 3. DB 마이그레이션
export DATABASE_URL="[production-db-url]"
npx prisma migrate deploy

# 4. 데이터 마이그레이션 (최초 배포 시)
cd my-date-log
npm run migrate:execute

# 5. 검증
curl https://date-log-back.onrender.com/v1/health
open https://datelog.vercel.app
```

---

## ✅ 배포 후 검증

### 1. Health Check

```bash
# Backend Health Check
curl https://date-log-back.onrender.com/v1/health

# 응답 예시
{
  "status": "healthy",
  "timestamp": "2025-10-19T00:00:00.000Z"
}
```

### 2. API 테스트

```bash
# 날짜 목록 조회
curl https://date-log-back.onrender.com/v1/date-entries

# 특정 날짜 조회
curl https://date-log-back.onrender.com/v1/date-entries?date=2025-10-18
```

### 3. Frontend 테스트

**체크리스트**:
- [ ] Calendar View 로드 성공
- [ ] 날짜 클릭 시 DetailView 이동
- [ ] 지도 표시 정상 (Kakao Maps API)
- [ ] 새 날짜 추가 기능
- [ ] 장소 추가/수정/삭제 기능
- [ ] 방문 체크 토글 기능
- [ ] 로딩 스피너 표시
- [ ] 에러 메시지 표시

### 4. 성능 테스트

```bash
# Lighthouse CI
npm install -g @lhci/cli

# 성능 측정
lhci autorun --collect.url=https://datelog.vercel.app
```

**목표 지표**:
- Performance: >90
- Accessibility: >95
- Best Practices: >90
- SEO: >90

### 5. 데이터베이스 확인

```bash
# Prisma Studio
cd date-log-server
npx prisma studio

# 또는 PostgreSQL CLI
psql postgresql://admin:FbvtqKJu2wUPfeB9COXXF1lZXIvHtE9O@dpg-d3pkgmali9vc73bld3og-a.oregon-postgres.render.com:5432/date_schedule
```

---

## 🔒 보안 설정

### 1. CORS 설정

**Backend (`src/server.ts`)**:
```typescript
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
}));
```

**Production에서 반드시 설정**:
```env
CORS_ORIGIN=https://datelog.vercel.app
```

### 2. 환경 변수 보안

**절대 Git에 커밋하지 말 것**:
- API Keys
- Database Passwords
- Secret Keys

**배포 플랫폼에서 설정**:
- Vercel: Dashboard → Settings → Environment Variables
- Render: Dashboard → Environment

### 3. HTTPS 강제

Vercel과 Render 모두 **자동으로 HTTPS 제공**.

### 4. Rate Limiting (권장)

```bash
npm install express-rate-limit
```

```typescript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});

app.use('/v1/', limiter);
```

---

## 📊 모니터링 및 로깅

### 1. Vercel Analytics

Vercel Dashboard → Analytics:
- **Visitors**: 방문자 수
- **Page Views**: 페이지 조회 수
- **Top Pages**: 인기 페이지
- **Devices**: 디바이스 분포
- **Locations**: 지역 분포

### 2. Render Logs

Render Dashboard → Logs:
- **Build Logs**: 빌드 과정 로그
- **Deploy Logs**: 배포 과정 로그
- **Runtime Logs**: 실행 중 로그

### 3. Error Tracking (Optional)

**Sentry 설정**:
```bash
npm install @sentry/react @sentry/node
```

**Frontend (`src/main.tsx`)**:
```typescript
import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
});
```

**Backend (`src/server.ts`)**:
```typescript
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
});
```

---

## 🔄 롤백 계획

### Frontend 롤백 (Vercel)

**방법 1: Vercel Dashboard**
1. Vercel Dashboard → Deployments
2. 이전 성공한 배포 선택
3. "Promote to Production" 클릭

**방법 2: Git Revert**
```bash
git revert HEAD
git push origin production
```

### Backend 롤백 (Render)

**방법 1: Render Dashboard**
1. Render Dashboard → Deploys
2. 이전 성공한 배포 선택
3. "Rollback to this version" 클릭

**방법 2: Git Revert**
```bash
git revert HEAD
git push origin production
```

### 데이터베이스 롤백

```bash
# 백업에서 복구
psql postgresql://[connection-string] < backup.sql

# 또는 특정 마이그레이션으로 되돌리기
npx prisma migrate resolve --rolled-back [migration-name]
```

---

## 🐛 트러블슈팅

### 문제 1: "CORS Error"

**증상**: Frontend에서 Backend API 호출 시 CORS 에러

**원인**: Backend CORS 설정이 Frontend URL과 일치하지 않음

**해결**:
```env
# Backend .env.prod
CORS_ORIGIN=https://datelog.vercel.app  # 정확한 URL 설정
```

### 문제 2: "Database Connection Failed"

**증상**: Backend가 DB에 연결 실패

**원인**: DATABASE_URL이 잘못됨

**해결**:
```bash
# Render Dashboard에서 DATABASE_URL 확인
# Internal URL 사용 (dpg-xxx-a:5432)
DATABASE_URL=postgresql://admin:password@dpg-xxx-a:5432/date_schedule
```

### 문제 3: "Build Failed"

**증상**: Vercel 또는 Render 빌드 실패

**원인**: 의존성 문제 또는 환경 변수 누락

**해결**:
```bash
# 로컬에서 빌드 테스트
npm run build

# package-lock.json 또는 yarn.lock 커밋 확인
git add package-lock.json
git commit -m "fix: update dependencies"
```

### 문제 4: "Kakao Maps Not Loading"

**증상**: 지도가 로드되지 않음

**원인**: API Key 누락 또는 잘못됨

**해결**:
```env
# Vercel Dashboard → Environment Variables
VITE_KAKAO_MAP_API_KEY=[your-actual-api-key]
```

### 문제 5: "Slow API Response"

**증상**: API 응답이 느림 (>2초)

**원인**: Render Free Plan의 Cold Start

**해결**:
- Render Starter Plan으로 업그레이드 ($7/month)
- 또는 Keep-Alive 서비스 사용 (UptimeRobot)

---

## 💡 최적화 팁

### 1. Frontend 최적화

**Code Splitting**:
```typescript
// src/router.tsx
const CalendarView = lazy(() => import('./components/calendar/CalendarView'));
const DateDetailView = lazy(() => import('./components/detail/DateDetailView'));
```

**Image Optimization**:
```bash
npm install vite-plugin-imagemin
```

**Bundle Size 분석**:
```bash
npm install rollup-plugin-visualizer
npm run build
```

### 2. Backend 최적화

**Connection Pooling**:
```typescript
// prisma/schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  connectionLimit = 10
}
```

**Caching**:
```bash
npm install node-cache
```

```typescript
import NodeCache from 'node-cache';
const cache = new NodeCache({ stdTTL: 600 }); // 10 minutes
```

### 3. Database 최적화

**Indexes**:
```prisma
model DateEntry {
  date String
  region String

  @@index([date])
  @@index([region])
  @@index([date, region])
}
```

---

## 📋 배포 체크리스트

### 사전 준비
- [ ] GitHub 저장소 생성 및 코드 푸시
- [ ] Vercel 계정 생성
- [ ] Render 계정 생성
- [ ] Kakao Developers API Key 발급
- [ ] PostgreSQL 데이터베이스 생성 (Render)

### Frontend 배포
- [ ] `.env.staging` 파일 생성
- [ ] `.env.production` 파일 업데이트
- [ ] `vercel.json` 파일 생성
- [ ] Vercel 프로젝트 생성
- [ ] 환경 변수 설정 (Vercel Dashboard)
- [ ] Git push 및 자동 배포 확인
- [ ] Custom Domain 설정 (optional)

### Backend 배포
- [ ] `.env.stag` 파일 완성
- [ ] `.env.prod` 파일 완성
- [ ] `render.yaml` 파일 생성
- [ ] Render Web Service 생성
- [ ] 환경 변수 설정 (Render Dashboard)
- [ ] Health Check 설정
- [ ] Git push 및 자동 배포 확인

### 데이터베이스 설정
- [ ] Staging DB 마이그레이션
- [ ] Production DB 마이그레이션
- [ ] LocalStorage 데이터 마이그레이션 (optional)
- [ ] 데이터 백업 설정

### 검증
- [ ] Health Check 성공
- [ ] API 테스트 성공
- [ ] Frontend E2E 테스트 성공
- [ ] 성능 측정 (Lighthouse)
- [ ] 보안 검사 (CORS, HTTPS)

### 모니터링
- [ ] Vercel Analytics 활성화
- [ ] Render Logs 확인
- [ ] Error Tracking 설정 (optional)

---

## 🎉 배포 완료!

축하합니다! DateLog 앱이 성공적으로 배포되었습니다.

**접속 URL**:
- **Staging**: https://datelog-staging.vercel.app
- **Production**: https://datelog.vercel.app
- **Backend API**: https://date-log-back.onrender.com/v1

**다음 단계**:
1. 사용자 피드백 수집
2. 성능 모니터링
3. 추가 기능 개발 (Phase 5: 사용자 인증)
4. Custom Domain 설정
5. SEO 최적화

---

## 📚 참고 문서

- [Vercel Documentation](https://vercel.com/docs)
- [Render Documentation](https://render.com/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Vite Documentation](https://vitejs.dev/)
- [Express Documentation](https://expressjs.com/)

---

**작성일**: 2025-10-19
**버전**: 1.0.0
**작성자**: Claude Code
