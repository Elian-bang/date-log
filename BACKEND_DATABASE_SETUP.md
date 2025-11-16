# Backend 프로덕션 데이터베이스 설정 가이드

**목적**: Render에 PostgreSQL 인스턴스 생성 및 백엔드 연결
**예상 시간**: 30분
**전제 조건**: 로컬 백엔드가 정상 작동 중

---

## 현재 상황

✅ **로컬 환경**:
- 백엔드 코드 완성
- 로컬 데이터베이스 작동
- API 엔드포인트 구현 완료

❌ **프로덕션 환경 (Render)**:
- PostgreSQL 인스턴스 없음
- 백엔드 배포는 되어있지만 DB 미연결

---

## Phase 0: Render PostgreSQL 생성 (10분)

### 0.1 Render Dashboard 접속

1. https://render.com 로그인
2. **Dashboard** 클릭

### 0.2 PostgreSQL 인스턴스 생성

1. **New +** 버튼 클릭
2. **PostgreSQL** 선택

**기본 설정 입력**:
```yaml
Name: datelog-postgres-production
Database: datelog_prod
User: datelog_user
Region: Singapore (Asia 가장 가까움)
```

**Plan 선택**:
- **Free** (개발/테스트용)
  - 제한: 90일 후 삭제, 1GB 스토리지
- **Starter** ($7/month) (권장)
  - 제한: 없음, 10GB 스토리지, 자동 백업

**추천**: 프로덕션이므로 Starter 플랜

3. **Create Database** 클릭

### 0.3 Connection String 확보 (중요!)

PostgreSQL 생성 완료 후:

1. Dashboard → 생성한 PostgreSQL 클릭
2. **Connections** 섹션에서 다음 정보 확인:

```yaml
Internal Database URL:
postgresql://datelog_user:xxx@dpg-xxx.singapore-postgres.render.com/datelog_prod

External Database URL:
postgresql://datelog_user:xxx@dpg-xxx.singapore-postgres.render.com/datelog_prod?ssl=true
```

**중요**:
- **Internal URL**: Render 서비스 간 연결 (빠름, 무료)
- **External URL**: 외부에서 접속 (느림, 유료)
- 백엔드는 같은 Render에 있으므로 **Internal URL** 사용

⚠️ **이 URL을 복사해두세요!** 다음 단계에서 사용합니다.

---

## Phase 1: 백엔드 환경 변수 설정 (5분)

### 1.1 백엔드 프로젝트 위치 확인

로컬에서 백엔드 프로젝트로 이동:
```bash
# 예시 (실제 경로로 변경)
cd C:\Users\bangs\WebstormProjects\date-log-server
# 또는
cd ../date-log-server
```

### 1.2 프로덕션 환경 변수 파일 확인

백엔드 프로젝트에 `.env.prod` 또는 `.env.production` 파일이 있는지 확인:
```bash
ls .env*

# 예상 결과:
# .env (로컬)
# .env.example
# .env.prod (프로덕션)
```

**파일이 없으면 생성**:
```bash
cp .env.example .env.prod
```

### 1.3 .env.prod 수정

```env
# .env.prod

# Database (Render PostgreSQL Internal URL 사용)
DATABASE_URL=postgresql://datelog_user:xxx@dpg-xxx.singapore-postgres.render.com/datelog_prod

# Node Environment
NODE_ENV=production

# API Configuration
PORT=3001
API_VERSION=v1

# CORS (Frontend URL)
CORS_ORIGIN=https://datelog-frontend-production.onrender.com

# JWT Secret (프로덕션용 강력한 키)
JWT_SECRET=your-production-secret-key-change-this

# Logging
LOG_LEVEL=info
```

⚠️ **중요**:
- `DATABASE_URL`에 Phase 0.3에서 복사한 **Internal Database URL** 붙여넣기
- `CORS_ORIGIN`은 프론트엔드 Render URL (아직 배포 안 했으면 임시로 입력)
- `JWT_SECRET`은 강력한 랜덤 키로 변경

**JWT_SECRET 생성 방법**:
```bash
# Node.js에서 랜덤 키 생성
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# 결과 예시:
# 8f3a2e1d9c7b6a5e4f3d2c1b0a9e8d7c6b5a4e3d2c1b0a9f8e7d6c5b4a3e2d1c0b9a8f7e6d5c4b3a2e1d0c9b8a7f6e5d4c3b2a1e0d9c8b7a6f5e4d3c2b1a0
```

### 1.4 Render Dashboard에서 환경 변수 설정

1. Render Dashboard → **Web Services** → 백엔드 서비스 선택
   - 서비스 이름: `datelog-backend-production` 또는 `date-log-back`

2. **Environment** 탭 클릭

3. **Environment Variables** 섹션에서 다음 변수 추가:

```
Key: DATABASE_URL
Value: [Phase 0.3에서 복사한 Internal Database URL]

Key: NODE_ENV
Value: production

Key: CORS_ORIGIN
Value: https://datelog-frontend-production.onrender.com

Key: JWT_SECRET
Value: [생성한 랜덤 키]
```

4. **Save Changes** 클릭

⚠️ **자동 재배포 트리거**: 환경 변수 변경 시 백엔드가 자동으로 재배포됩니다 (3-5분 소요)

---

## Phase 2: 프로덕션 마이그레이션 실행 (10분)

### 2.1 마이그레이션 방법 확인

백엔드 프로젝트에서 사용하는 ORM 확인:

**Prisma 사용 시**:
```bash
# package.json 확인
cat package.json | grep prisma

# 마이그레이션 스크립트 확인
cat package.json | grep -A 5 "scripts"
```

**Sequelize 사용 시**:
```bash
cat package.json | grep sequelize
```

### 2.2 로컬에서 프로덕션 마이그레이션 실행

#### Prisma 사용 시:

```bash
# 프로덕션 환경 변수 로드
export DATABASE_URL="[Render Internal Database URL]"

# 또는 Windows PowerShell
$env:DATABASE_URL="[Render Internal Database URL]"

# 마이그레이션 실행
npx prisma migrate deploy

# 또는 package.json 스크립트가 있으면
npm run migrate:prod
```

**예상 출력**:
```
✔ Prisma Migrate applied the following migration(s):
  20231015120000_init
  20231020150000_add_coordinates
  20231025180000_add_categories

✔ All migrations have been successfully applied.
```

#### Sequelize 사용 시:

```bash
# 프로덕션 환경으로 마이그레이션
NODE_ENV=production npx sequelize-cli db:migrate

# 또는
npm run migrate:prod
```

### 2.3 마이그레이션 검증

**방법 1: Prisma Studio (Prisma 사용 시)**:
```bash
# Prisma Studio 실행 (프로덕션 DB 연결)
export DATABASE_URL="[Render Internal Database URL]"
npx prisma studio

# 브라우저에서 http://localhost:5555 접속
# 테이블 확인: date_entries, cafes, restaurants, spots
```

**방법 2: Render PostgreSQL Dashboard**:
1. Render Dashboard → PostgreSQL 인스턴스 클릭
2. **Connect** → **External Connection** 복사
3. DB 클라이언트 (DBeaver, pgAdmin 등)에서 연결
4. 테이블 목록 확인:
   ```sql
   \dt  -- 테이블 목록

   -- 예상 결과:
   -- date_entries
   -- cafes
   -- restaurants
   -- spots
   -- _prisma_migrations (Prisma 사용 시)
   ```

**방법 3: SQL 쿼리로 확인**:
```sql
-- 테이블 존재 확인
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public';

-- 테이블 구조 확인
\d date_entries
\d cafes
\d restaurants
\d spots
```

---

## Phase 3: 백엔드 재배포 및 확인 (5분)

### 3.1 백엔드 재배포 확인

Phase 1.4에서 환경 변수를 변경했으므로 백엔드가 자동으로 재배포됩니다.

**Render Dashboard에서 확인**:
1. Web Services → 백엔드 서비스
2. **Logs** 탭 클릭
3. 재배포 로그 확인:
   ```
   ==> Starting service with 'npm start'
   ==> Server listening on port 3001
   ==> Database connected successfully
   ```

**예상 재배포 시간**: 3-5분

### 3.2 Health Check 테스트

재배포 완료 후:

```bash
# Health Check
curl https://date-log-back.onrender.com/v1/health

# 예상 응답 (성공):
{
  "status": "ok",
  "database": "connected",
  "timestamp": "2025-11-16T10:30:00.000Z"
}

# 예상 응답 (실패):
{
  "status": "error",
  "message": "Database connection failed"
}
```

**실패 시 트러블슈팅**:
1. Render Dashboard → 백엔드 서비스 → **Logs**
2. 에러 메시지 확인:
   ```
   Error: connect ECONNREFUSED
   Error: password authentication failed for user "datelog_user"
   Error: database "datelog_prod" does not exist
   ```
3. DATABASE_URL이 정확한지 재확인
4. PostgreSQL 인스턴스가 정상 작동 중인지 확인

### 3.3 API 엔드포인트 테스트

```bash
# 1. 날짜 목록 조회 (빈 배열 예상)
curl https://date-log-back.onrender.com/v1/dates
# 예상: []

# 2. 새 날짜 생성 테스트
curl -X POST https://date-log-back.onrender.com/v1/dates \
  -H "Content-Type: application/json" \
  -d '{
    "date": "2025-11-20",
    "region": "삼송",
    "cafes": [],
    "restaurants": [],
    "spots": []
  }'

# 예상 응답 (성공):
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "date": "2025-11-20",
  "region": "삼송",
  "cafes": [],
  "restaurants": [],
  "spots": [],
  "createdAt": "2025-11-16T10:35:00.000Z"
}

# 3. 생성된 데이터 조회
curl https://date-log-back.onrender.com/v1/dates
# 예상: [위에서 생성한 데이터]
```

**모든 테스트 성공하면** ✅ 백엔드 프로덕션 DB 설정 완료!

---

## 성공 기준 체크리스트

- [ ] Render PostgreSQL 인스턴스 생성 완료
- [ ] Internal Database URL 확보
- [ ] 백엔드 .env.prod 파일 설정
- [ ] Render 백엔드 환경 변수 설정
- [ ] 프로덕션 마이그레이션 실행 완료
- [ ] 테이블 생성 확인 (date_entries, cafes, restaurants, spots)
- [ ] 백엔드 재배포 완료
- [ ] Health check 200 OK
- [ ] API 엔드포인트 정상 작동 (GET, POST)

---

## 트러블슈팅

### 문제 1: 마이그레이션 실패 - "relation already exists"

**증상**:
```
ERROR: relation "date_entries" already exists
```

**원인**: 이전에 수동으로 테이블을 생성한 경우

**해결**:
```bash
# 방법 1: 기존 테이블 삭제 후 재시도
# Prisma Studio 또는 SQL 클라이언트에서
DROP TABLE IF EXISTS date_entries CASCADE;
DROP TABLE IF EXISTS cafes CASCADE;
DROP TABLE IF EXISTS restaurants CASCADE;
DROP TABLE IF EXISTS spots CASCADE;

# 마이그레이션 재실행
npx prisma migrate deploy

# 방법 2: 마이그레이션 상태만 동기화 (테이블 유지)
npx prisma migrate resolve --applied [migration-name]
```

---

### 문제 2: DATABASE_URL 연결 실패

**증상**:
```
Error: connect ECONNREFUSED
Error: getaddrinfo ENOTFOUND dpg-xxx.singapore-postgres.render.com
```

**원인**: DATABASE_URL이 잘못되었거나 PostgreSQL이 아직 준비 안 됨

**해결**:
```bash
# 1. Render PostgreSQL Dashboard 확인
# Status: Available (녹색) 확인

# 2. Connection String 재확인
# Internal Database URL 복사 (External 아님!)

# 3. 백엔드 환경 변수 재설정
# Render Dashboard → Environment → DATABASE_URL 수정

# 4. 백엔드 수동 재배포
# Render Dashboard → Manual Deploy
```

---

### 문제 3: CORS 에러 (프론트엔드 연결 시)

**증상**:
```
Access to fetch at 'https://date-log-back.onrender.com/v1/dates'
from origin 'https://datelog-frontend-production.onrender.com'
has been blocked by CORS policy
```

**원인**: CORS_ORIGIN 환경 변수가 프론트엔드 URL과 불일치

**해결**:
```bash
# 백엔드 환경 변수 확인 및 수정
# Render Dashboard → Environment

CORS_ORIGIN=https://datelog-frontend-production.onrender.com

# 주의: trailing slash 없이!
# ✅ https://datelog-frontend-production.onrender.com
# ❌ https://datelog-frontend-production.onrender.com/
```

---

### 문제 4: 백엔드 재배포가 안 됨

**증상**: 환경 변수 변경했지만 재배포 안 됨

**해결**:
```bash
# Render Dashboard → 백엔드 서비스
# Manual Deploy 버튼 클릭

# 또는 Git push로 트리거
cd [백엔드-프로젝트]
git commit --allow-empty -m "trigger: Redeploy for DB connection"
git push origin main
```

---

## 다음 단계

✅ **백엔드 프로덕션 DB 설정 완료 후**:

1. **프론트엔드 배포 진행**:
   - `DEPLOYMENT_WORKFLOW.md` Phase 0부터 시작
   - Phase 2.2에서 백엔드 health check 성공 확인

2. **통합 테스트**:
   - 프론트엔드에서 API 호출
   - CRUD 기능 전체 테스트
   - 데이터 마이그레이션 (localStorage → Backend)

---

## 예상 비용 (Render)

### PostgreSQL 비용:
- **Free Tier**: $0 (90일 제한, 1GB)
- **Starter**: $7/month (권장, 10GB, 백업)
- **Standard**: $20/month (100GB, 고성능)

### 백엔드 Web Service 비용:
- **Free**: $0 (15분 비활성 시 sleep, Cold Start)
- **Starter**: $7/month (권장, Always On)

### 프론트엔드 Static Site 비용:
- **Free**: $0 (100GB bandwidth/month)

**총 예상 비용** (권장 구성):
- PostgreSQL Starter: $7/month
- Backend Starter: $7/month
- Frontend Free: $0/month
- **합계**: $14/month

---

**마지막 업데이트**: 2025-11-16
**작성자**: DevOps Team (SuperClaude Framework)

**백엔드 DB 설정 성공을 기원합니다! 🚀**
