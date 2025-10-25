# Phase 4: 프로덕션 배포 가이드 (Render 전용)

## 📋 배포 아키텍처

```
┌─────────────────────────────────────────────────────────────┐
│                    Production Architecture                   │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐         ┌──────────────┐                 │
│  │    Render    │         │    Render    │                 │
│  │  (Frontend)  │────────▶│  (Backend)   │                 │
│  │ Static Site  │  HTTPS  │  Web Service │                 │
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
- **Frontend**: `https://datelog-frontend-staging.onrender.com`
- **Backend**: `https://datelog-backend-staging.onrender.com`
- **Database**: Render PostgreSQL (Oregon)
- **Data**: PostgreSQL

### Production (실제 서비스)
- **Frontend**: `https://datelog-frontend-production.onrender.com`
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
CORS_ORIGIN=https://datelog-frontend-staging.onrender.com

# Database Configuration (Render PostgreSQL)
DATABASE_URL=postgresql://admin:FbvtqKJu2wUPfeB9COXXF1lZXIvHtE9O@dpg-d3pkgmali9vc73bld3og-a.oregon-postgres.render.com:5432/date_schedule
```

#### `.env.prod` (Production 환경)
```env
# Server Configuration
NODE_ENV=production
PORT=3001

# CORS Configuration
CORS_ORIGIN=https://datelog-frontend-production.onrender.com

# Database Configuration (Render PostgreSQL)
# Internal network URL (faster, more secure)
DATABASE_URL=postgresql://admin:FbvtqKJu2wUPfeB9COXXF1lZXIvHtE9O@dpg-d3pkgmali9vc73bld3og-a:5432/date_schedule
```

---

## 🚀 Render 배포 (Frontend - Static Site)

### 1. Render Static Site 생성

#### 방법 1: Blueprint 배포 (권장)
프로젝트에 `render.yaml` 파일이 있으므로 Blueprint를 사용하는 것이 가장 편리합니다:

1. https://render.com 접속 및 로그인
2. "New +" → "Blueprint" 클릭
3. GitHub 저장소 연결
4. `my-date-log` 저장소 선택
5. `render.yaml` 파일 자동 감지
6. 환경 변수 확인 (Kakao Map API Key 등)
7. "Apply" 클릭하여 배포

#### 방법 2: 수동 Static Site 생성
1. https://render.com 접속 및 로그인
2. "New +" → "Static Site" 클릭
3. GitHub 저장소 연결
4. `my-date-log` 저장소 선택
5. 설정:
   - **Name**: `datelog-frontend-staging` 또는 `datelog-frontend-production`
   - **Branch**: `main` (staging) 또는 `production` (production)
   - **Build Command**: `npm install && npm run build:staging` (또는 `build:production`)
   - **Publish Directory**: `dist`

### 2. 환경 변수 설정

Render Dashboard → Environment:

**Staging**:
```
VITE_KAKAO_MAP_API_KEY=ff76d41c3df3ea33d5547a24db77743c
VITE_API_BASE_URL=https://datelog-backend-staging.onrender.com/v1
VITE_API_TIMEOUT=10000
VITE_ENABLE_API=true
```

**Production**:
```
VITE_KAKAO_MAP_API_KEY=ff76d41c3df3ea33d5547a24db77743c
VITE_API_BASE_URL=https://date-log-back.onrender.com/v1
VITE_API_TIMEOUT=10000
VITE_ENABLE_API=true
```

### 3. Headers와 Redirects 설정

Render가 `render.yaml`에서 자동으로 다음을 설정합니다:
- **Cache Headers**: Assets에 대해 1년 캐싱
- **SPA Routing**: 모든 경로를 `/index.html`로 리라이트

### 4. 자동 배포 설정

- **Auto-Deploy**: Render는 기본적으로 자동 배포 활성화
- **Branch**: `main` (staging) / `production` (production)
- Git push 시 자동으로 빌드 및 배포

---

## 🔧 Render 배포 (Backend - Web Service)

### 1. Render Web Service 생성

#### 방법 1: Blueprint 배포 (권장)
프로젝트에 `render.yaml` 파일이 있으므로:

1. Render Dashboard → "New +" → "Blueprint"
2. `date-log-server` 저장소 선택
3. `render.yaml` 자동 감지
4. 환경 변수 확인
5. "Apply" 클릭

#### 방법 2: 수동 Web Service 생성
1. https://render.com 접속
2. "New +" → "Web Service" 클릭
3. GitHub 저장소 연결
4. `date-log-server` 저장소 선택
5. 설정:
   - **Name**: `datelog-backend-staging` 또는 `date-log-back`
   - **Region**: Oregon (US West)
   - **Branch**: `main` (staging) 또는 `production` (production)
   - **Runtime**: Node
   - **Build Command**: `npm install && npx prisma generate && npm run build`
   - **Start Command**: `npm start`
   - **Plan**: Free (staging) / Starter (production - $7/month)

### 2. 환경 변수 설정

Render Dashboard → Environment:

**Staging**:
```
NODE_ENV=staging
PORT=3001
DATABASE_URL=postgresql://admin:FbvtqKJu2wUPfeB9COXXF1lZXIvHtE9O@dpg-d3pkgmali9vc73bld3og-a.oregon-postgres.render.com:5432/date_schedule
CORS_ORIGIN=https://datelog-frontend-staging.onrender.com
```

**Production**:
```
NODE_ENV=production
PORT=3001
DATABASE_URL=postgresql://admin:FbvtqKJu2wUPfeB9COXXF1lZXIvHtE9O@dpg-d3pkgmali9vc73bld3og-a:5432/date_schedule
CORS_ORIGIN=https://datelog-frontend-production.onrender.com
```

### 3. Health Check 설정

Render Dashboard → Health Check Path: `/v1/health`

**Health Check 엔드포인트**는 이미 구현되어 있습니다 (`src/server.ts`):
```typescript
app.get('/v1/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});
```

### 4. 데이터베이스 연결

**PostgreSQL Database (이미 존재)**:
- Name: `datelog-postgres`
- Database: `date_schedule`
- User: `admin`
- Region: Oregon
- Plan: Free

**Connection String**:
- **External (Staging)**: `dpg-xxx-a.oregon-postgres.render.com:5432`
- **Internal (Production)**: `dpg-xxx-a:5432` (Render 내부 네트워크, 더 빠름)

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
git checkout main
git pull origin main
git push origin main
# Render가 자동 빌드 및 배포

# 2. Backend 배포
cd ../date-log-server
git checkout main
git pull origin main
git push origin main
# Render가 자동 빌드 및 배포

# 3. DB 마이그레이션 (필요시)
export DATABASE_URL="[staging-db-url]"
npx prisma migrate deploy

# 4. 검증
curl https://datelog-backend-staging.onrender.com/v1/health
```

### Production 배포

```bash
# 1. Frontend 배포
cd my-date-log
git checkout production
git merge main  # main에서 테스트 완료된 코드 병합
git push origin production
# Render가 자동 빌드 및 배포

# 2. Backend 배포
cd ../date-log-server
git checkout production
git merge main  # main에서 테스트 완료된 코드 병합
git push origin production
# Render가 자동 빌드 및 배포

# 3. DB 마이그레이션 (필요시)
export DATABASE_URL="[production-db-url]"
npx prisma migrate deploy

# 4. 데이터 마이그레이션 (최초 배포 시)
cd ../my-date-log
npm run migrate:execute

# 5. 검증
curl https://date-log-back.onrender.com/v1/health
```

---

## ✅ 배포 후 검증

### 1. Health Check

```bash
# Backend Health Check
curl https://date-log-back.onrender.com/v1/health

# 기대 응답
{
  "status": "healthy",
  "timestamp": "2025-10-19T00:00:00.000Z"
}
```

### 2. API 테스트

```bash
# 날짜 목록 조회
curl https://date-log-back.onrender.com/v1/dates

# 특정 날짜로 조회
curl "https://date-log-back.onrender.com/v1/dates/by-date/2025-10-18"
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

### 4. CORS 테스트

브라우저 콘솔에서:
```javascript
fetch('https://date-log-back.onrender.com/v1/health')
  .then(r => r.json())
  .then(console.log);
```

CORS 에러가 없어야 함.

### 5. 데이터베이스 확인

```bash
# Prisma Studio
cd date-log-server
npx prisma studio

# 또는 PostgreSQL CLI
psql "postgresql://admin:FbvtqKJu2wUPfeB9COXXF1lZXIvHtE9O@dpg-d3pkgmali9vc73bld3og-a.oregon-postgres.render.com:5432/date_schedule"
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

**Production 필수 설정**:
```env
CORS_ORIGIN=https://datelog-frontend-production.onrender.com
```

### 2. 환경 변수 보안

**절대 Git에 커밋하지 말 것**:
- Kakao Map API Keys
- Database Passwords
- Secret Keys

**Render Dashboard에서 설정**:
- Dashboard → Environment Variables
- 민감한 정보는 Render에서만 관리

### 3. HTTPS

Render는 모든 Static Site와 Web Service에 **자동으로 HTTPS 제공**.

### 4. Rate Limiting (권장)

```bash
npm install express-rate-limit
```

```typescript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15분
  max: 100, // IP당 최대 100 요청
  message: 'Too many requests from this IP'
});

app.use('/v1/', limiter);
```

---

## 📊 모니터링 및 로깅

### 1. Render Logs

Render Dashboard → Logs:
- **Build Logs**: 빌드 과정 로그
- **Deploy Logs**: 배포 과정 로그
- **Runtime Logs**: 실행 중 로그
- **Event Logs**: 이벤트 히스토리

### 2. Metrics

Render Dashboard → Metrics:
- **CPU Usage**: CPU 사용률
- **Memory Usage**: 메모리 사용률
- **Bandwidth**: 네트워크 트래픽
- **Request Count**: 요청 수

### 3. Uptime Monitoring (선택사항)

**UptimeRobot 설정**:
1. https://uptimerobot.com 가입
2. "Add New Monitor" 클릭
3. Monitor Type: HTTP(S)
4. URL: `https://date-log-back.onrender.com/v1/health`
5. Monitoring Interval: 5분
6. Alert Contacts: 이메일 설정

**목적**: Free Plan Cold Start 방지 및 다운타임 모니터링

### 4. Error Tracking (선택사항)

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
  tracesSampleRate: 0.1,
});
```

**Backend (`src/server.ts`)**:
```typescript
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
});

app.use(Sentry.Handlers.requestHandler());
app.use(Sentry.Handlers.errorHandler());
```

---

## 🔄 롤백 계획

### Frontend 롤백 (Render)

**방법 1: Render Dashboard** (권장)
1. Render Dashboard → Static Site 선택
2. "Deploys" 탭 클릭
3. 이전 성공한 배포 선택
4. "Rollback to this deploy" 클릭

**방법 2: Git Revert**
```bash
git revert HEAD
git push origin production
```

### Backend 롤백 (Render)

**방법 1: Render Dashboard** (권장)
1. Render Dashboard → Web Service 선택
2. "Deploys" 탭 클릭
3. 이전 성공한 배포 선택
4. "Rollback to this deploy" 클릭

**방법 2: Git Revert**
```bash
git revert HEAD
git push origin production
```

### 데이터베이스 롤백

```bash
# 1. 백업에서 복구
pg_restore -d database_url < backup.dump

# 2. 특정 마이그레이션으로 되돌리기
npx prisma migrate resolve --rolled-back [migration-name]
```

---

## 🐛 트러블슈팅

### 문제 1: "CORS Error"

**증상**:
```
Access to fetch at 'https://date-log-back.onrender.com/v1/dates' from origin 'https://datelog-frontend-production.onrender.com' has been blocked by CORS policy
```

**원인**: Backend CORS 설정이 Frontend URL과 일치하지 않음

**해결**:
```env
# Backend .env.prod
CORS_ORIGIN=https://datelog-frontend-production.onrender.com
```

Render Dashboard에서 환경 변수 업데이트 후 재배포.

---

### 문제 2: "Database Connection Failed"

**증상**:
```
PrismaClientInitializationError: Can't reach database server
```

**원인**: DATABASE_URL이 잘못되었거나 DB가 다운됨

**해결**:
```bash
# 1. Render Dashboard에서 DATABASE_URL 확인
# 2. Internal URL 사용 (Production)
DATABASE_URL=postgresql://admin:password@dpg-xxx-a:5432/date_schedule

# 3. External URL 사용 (Staging/개발)
DATABASE_URL=postgresql://admin:password@dpg-xxx-a.oregon-postgres.render.com:5432/date_schedule
```

---

### 문제 3: "Build Failed"

**증상**: Render 빌드 실패 메시지

**원인**:
- 의존성 문제
- Node 버전 불일치
- 환경 변수 누락

**해결**:
```bash
# 1. 로컬에서 빌드 테스트
npm run build

# 2. Node 버전 확인
node --version  # 18 이상 필요

# 3. package-lock.json 최신화
npm install
git add package-lock.json
git commit -m "chore: update dependencies"
git push
```

---

### 문제 4: "Kakao Maps Not Loading"

**증상**: 지도가 빈 화면으로 표시

**원인**:
- API Key 누락
- 도메인 미등록

**해결**:
```bash
# 1. Render Dashboard에서 환경 변수 확인
VITE_KAKAO_MAP_API_KEY=[your-key]

# 2. Kakao Developers에서 도메인 등록
# https://developers.kakao.com/console
# 플랫폼 설정 → 사이트 도메인 추가:
#   https://datelog-frontend-production.onrender.com
```

---

### 문제 5: "Slow API Response" / "Cold Start"

**증상**:
- 첫 요청이 느림 (10-30초)
- API 응답이 느림

**원인**: Render Free Plan Cold Start (15분 비활성 시 슬립)

**해결 방법**:

**옵션 1**: Starter Plan 업그레이드 ($7/month)
- Render Dashboard → Upgrade Plan
- Cold Start 없음

**옵션 2**: Keep-Alive 서비스 사용 (Free Plan 유지)
```bash
# UptimeRobot 설정
# 5분마다 health check 요청
https://date-log-back.onrender.com/v1/health
```

**옵션 3**: Cron Job 설정
```bash
# Render Cron Job 추가
*/5 * * * * curl https://date-log-back.onrender.com/v1/health
```

---

## 💡 최적화 팁

### 1. Frontend 최적화

**Code Splitting**:
```typescript
// src/router.tsx
import { lazy } from 'react';

const CalendarView = lazy(() => import('./components/calendar/CalendarView'));
const DateDetailView = lazy(() => import('./components/detail/DateDetailView'));
```

**Image Optimization**:
```bash
npm install vite-plugin-imagemin -D
```

```typescript
// vite.config.ts
import viteImagemin from 'vite-plugin-imagemin';

export default defineConfig({
  plugins: [
    react(),
    viteImagemin({
      gifsicle: { optimizationLevel: 7 },
      optipng: { optimizationLevel: 7 },
      mozjpeg: { quality: 80 },
      svgo: { plugins: [{ removeViewBox: false }] },
    }),
  ],
});
```

**Bundle Size 분석**:
```bash
npm install rollup-plugin-visualizer -D
npm run build
```

---

### 2. Backend 최적화

**Connection Pooling**:
```typescript
// prisma/schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
  previewFeatures = ["interactiveTransactions"]
}
```

**Caching**:
```bash
npm install node-cache
```

```typescript
import NodeCache from 'node-cache';

const cache = new NodeCache({ stdTTL: 600 }); // 10분 캐시

app.get('/v1/dates', async (req, res) => {
  const cacheKey = 'dates_list';
  const cached = cache.get(cacheKey);

  if (cached) {
    return res.json(cached);
  }

  const data = await dateService.findAll();
  cache.set(cacheKey, data);
  res.json(data);
});
```

**Compression**:
```bash
npm install compression
```

```typescript
import compression from 'compression';

app.use(compression());
```

---

### 3. Database 최적화

**Indexes**:
```prisma
model DateEntry {
  id     String   @id @default(uuid())
  date   DateTime @unique @db.Date
  region String   @db.VarChar(50)

  @@index([date])
  @@index([region])
  @@index([date, region])
  @@map("date_entries")
}

model Cafe {
  id          String @id @default(uuid())
  dateEntryId String @map("date_entry_id")
  visited     Boolean @default(false)

  @@index([dateEntryId])
  @@index([visited])
  @@map("cafes")
}
```

---

## 📋 배포 체크리스트

### 사전 준비
- [ ] GitHub 저장소 생성 및 코드 푸시
- [ ] Render 계정 생성
- [ ] Kakao Developers API Key 발급
- [ ] PostgreSQL 데이터베이스 생성 (Render)

### Frontend 배포 (my-date-log)
- [ ] `.env.staging` 파일 생성
- [ ] `.env.production` 파일 생성
- [ ] `render.yaml` 파일 확인
- [ ] `vercel.json` 파일 삭제
- [ ] Render Static Site 생성 (Blueprint 또는 수동)
- [ ] 환경 변수 설정 (Render Dashboard)
- [ ] Git push 및 자동 배포 확인
- [ ] Custom Domain 설정 (선택사항)

### Backend 배포 (date-log-server)
- [ ] `.env.stag` 파일 확인
- [ ] `.env.prod` 파일 확인
- [ ] `render.yaml` 파일 확인
- [ ] Render Web Service 생성 (Blueprint 또는 수동)
- [ ] 환경 변수 설정 (Render Dashboard)
- [ ] Health Check 설정 (`/v1/health`)
- [ ] Git push 및 자동 배포 확인

### 데이터베이스 설정
- [ ] Staging DB 마이그레이션 실행
- [ ] Production DB 마이그레이션 실행
- [ ] LocalStorage 데이터 마이그레이션 (선택사항)
- [ ] 데이터 백업 설정

### 검증 및 모니터링
- [ ] Backend Health Check 성공
- [ ] API 엔드포인트 테스트 성공
- [ ] Frontend 전체 기능 테스트
- [ ] CORS 검증
- [ ] 성능 측정
- [ ] Uptime Monitoring 설정 (선택사항)
- [ ] Error Tracking 설정 (선택사항)

---

## 🎉 배포 완료!

축하합니다! DateLog 앱이 Render에 성공적으로 배포되었습니다.

**접속 URL**:
- **Staging Frontend**: https://datelog-frontend-staging.onrender.com
- **Production Frontend**: https://datelog-frontend-production.onrender.com
- **Staging Backend**: https://datelog-backend-staging.onrender.com
- **Production Backend**: https://date-log-back.onrender.com

**다음 단계**:
1. 사용자 피드백 수집
2. Render Logs 모니터링
3. 성능 최적화 (Starter Plan 고려)
4. 추가 기능 개발
5. Custom Domain 설정
6. SEO 최적화

---

## 📚 참고 문서

- [Render Documentation](https://render.com/docs)
- [Render Static Sites](https://render.com/docs/static-sites)
- [Render Web Services](https://render.com/docs/web-services)
- [Render Blueprints](https://render.com/docs/infrastructure-as-code)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Vite Documentation](https://vitejs.dev/)
- [Express Documentation](https://expressjs.com/)

---

**작성일**: 2025-10-19
**버전**: 2.0.0 (Render 전용)
**작성자**: Claude Code
**최종 수정**: 2025-10-25
