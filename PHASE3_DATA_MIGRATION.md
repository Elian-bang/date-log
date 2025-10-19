# Phase 3: 데이터 마이그레이션 (Data Migration)

## 📋 개요 (Overview)

LocalStorage에 저장된 DateLog 데이터를 백엔드 PostgreSQL 데이터베이스로 마이그레이션하는 단계입니다.

**마이그레이션 도구**는 `local-storage.json` 파일의 데이터를 읽어 백엔드 API를 통해 데이터베이스에 저장합니다.

---

## 🎯 목표 (Goals)

1. ✅ LocalStorage 데이터를 JSON 파일로 추출
2. ✅ 마이그레이션 스크립트 작성
3. ✅ 데이터 변환 (Frontend DateLog → Backend DateEntry)
4. ✅ 백엔드 API를 통한 데이터 생성
5. ✅ 마이그레이션 검증 및 롤백 계획

---

## 📂 마이그레이션 파일 구조

```
my-date-log/
├── local-storage.json              # LocalStorage 데이터 (마이그레이션 소스)
├── src/
│   └── scripts/
│       └── migrate-data.ts         # 마이그레이션 스크립트
├── package.json                    # 마이그레이션 명령어 추가
└── PHASE3_DATA_MIGRATION.md       # 마이그레이션 문서 (이 파일)
```

---

## 🔧 마이그레이션 도구 (Migration Tool)

### 주요 기능

1. **데이터 분석**
   - 날짜별 통계 계산
   - 지역, 카페, 레스토랑, 관광지 개수 집계

2. **데이터 변환**
   - `DateLogAdapter.toBackendCreateRequests()` 사용
   - Frontend 다중 지역 → Backend 단일 지역 변환

3. **마이그레이션 모드**
   - **Dry Run**: 실제 마이그레이션 없이 미리보기
   - **Execute**: 실제 데이터 마이그레이션 실행

4. **진행 상황 표시**
   - 실시간 마이그레이션 상태 출력
   - 성공/실패 통계
   - 에러 로그 및 상세 정보

---

## 📊 데이터 구조 변환

### Frontend Model (Multi-Region DateLog)

```typescript
interface DateLog {
  date: string;              // "2025-10-18"
  regions: Region[];         // 여러 지역 가능
}

interface Region {
  id: string;
  name: string;              // "삼송", "서오릉"
  categories: {
    cafe: Cafe[];
    restaurant: Restaurant[];
    spot: Spot[];
  };
}
```

### Backend Model (Single-Region DateEntry)

```typescript
interface DateEntry {
  id: string;
  date: string;              // "2025-10-18"
  region: string;            // "삼송" (단일 지역)
  cafes: Cafe[];
  restaurants: Restaurant[];
  spots: Spot[];
}
```

### 변환 로직 (Conversion Logic)

**1개의 Frontend DateLog (다중 지역) → N개의 Backend DateEntry (단일 지역)**

```typescript
// 예시: 2025-10-18 (삼송, 서오릉 2개 지역)
{
  "2025-10-18": {
    date: "2025-10-18",
    regions: [
      { name: "삼송", categories: {...} },    // → DateEntry 1
      { name: "서오릉", categories: {...} }   // → DateEntry 2
    ]
  }
}
```

`DateLogAdapter.toBackendCreateRequests()` 호출 시:
- 2개의 `CreateDateEntryRequest` 생성
- 각 요청은 하나의 지역만 포함

---

## 🚀 사용 방법 (Usage)

### 1. 사전 준비

#### (1) 백엔드 서버 실행

```bash
cd date-log-server
npm run dev
# Server running at http://localhost:3001
```

#### (2) 환경 변수 설정

`.env` 파일:
```env
VITE_API_BASE_URL=http://localhost:3001/v1
VITE_API_TIMEOUT=10000
VITE_ENABLE_API=true
```

#### (3) LocalStorage 데이터 확인

`local-storage.json` 파일이 프로젝트 루트에 있는지 확인:
```bash
ls -l local-storage.json
```

---

### 2. 마이그레이션 실행

#### (1) Dry Run (미리보기 모드)

**실제 마이그레이션 없이 무엇이 마이그레이션될지 확인**

```bash
npm run migrate
```

**출력 예시:**
```
=== DateLog Data Migration Tool ===

📂 Loading local-storage.json...
✓ Loaded data successfully

=== Migration Summary ===
Mode: 🔍 DRY RUN

Data Overview:
  📅 Total Dates: 10
  📍 Total Regions: 12
  ☕ Total Cafes: 8
  🍽️  Total Restaurants: 10
  🎯 Total Spots: 4
  📊 Total Places: 22

⚠️  DRY RUN MODE - No data will be actually migrated
   Use --execute flag to perform actual migration

Starting migration...

📅 2025-09-19 (1 regions, 1 places)
  → Creating 1 date entries...
    1. Region: 삼송 (☕0 🍽️1 🎯0)
  ✓ Would create these entries

📅 2025-09-20 (1 regions, 0 places)
  → Creating 1 date entries...
    1. Region: 연신내 (☕0 🍽️0 🎯0)
  ✓ Would create these entries

... (생략)

=== Migration Results ===
✅ Successful: 10 dates

Final Statistics:
  Success Rate: 100.0%

💡 To actually migrate the data, run: npm run migrate --execute
```

#### (2) Execute (실제 마이그레이션)

**실제로 데이터를 백엔드로 마이그레이션**

```bash
npm run migrate:execute
# 또는
npm run migrate --execute
```

**출력 예시:**
```
=== DateLog Data Migration Tool ===

📂 Loading local-storage.json...
✓ Loaded data successfully

=== Migration Summary ===
Mode: ✅ EXECUTE

Data Overview:
  📅 Total Dates: 10
  📍 Total Regions: 12
  ☕ Total Cafes: 8
  🍽️  Total Restaurants: 10
  🎯 Total Spots: 4
  📊 Total Places: 22

⚠️  EXECUTE MODE - Data will be migrated to backend
   Press Ctrl+C to cancel

Starting migration...

📅 2025-09-19 (1 regions, 1 places)
  → Creating 1 date entries...
    Creating region: 삼송 (☕0 🍽️1 🎯0)...
      ✓ Created (ID: uuid-1234...)
  ✅ Successfully created 1 entries

📅 2025-09-20 (1 regions, 0 places)
  → Creating 1 date entries...
    Creating region: 연신내 (☕0 🍽️0 🎯0)...
      ✓ Created (ID: uuid-5678...)
  ✅ Successfully created 1 entries

... (생략)

=== Migration Results ===
✅ Successful: 10 dates

Final Statistics:
  Success Rate: 100.0%

🎉 Migration completed!
```

---

## 🔍 마이그레이션 검증 (Verification)

### 1. 백엔드 API 확인

```bash
# 모든 날짜 조회
curl http://localhost:3001/v1/date-entries

# 특정 날짜 조회
curl http://localhost:3001/v1/date-entries?date=2025-10-18

# 특정 지역 조회
curl http://localhost:3001/v1/date-entries?region=삼송
```

### 2. 데이터베이스 직접 확인

```bash
cd date-log-server

# Prisma Studio 실행 (GUI)
npx prisma studio
# http://localhost:5555 에서 데이터 확인

# 또는 PostgreSQL CLI
docker exec -it datelog-postgres psql -U postgres -d datelog_dev
```

```sql
-- 날짜별 엔트리 수 확인
SELECT date, region,
       (SELECT COUNT(*) FROM cafes WHERE date_entry_id = date_entries.id) as cafe_count,
       (SELECT COUNT(*) FROM restaurants WHERE date_entry_id = date_entries.id) as restaurant_count,
       (SELECT COUNT(*) FROM spots WHERE date_entry_id = date_entries.id) as spot_count
FROM date_entries
ORDER BY date DESC;

-- 총 데이터 수 확인
SELECT
  (SELECT COUNT(*) FROM date_entries) as total_entries,
  (SELECT COUNT(*) FROM cafes) as total_cafes,
  (SELECT COUNT(*) FROM restaurants) as total_restaurants,
  (SELECT COUNT(*) FROM spots) as total_spots;
```

### 3. 프론트엔드에서 확인

```bash
# API 모드로 앱 실행
cd my-date-log
VITE_ENABLE_API=true npm run dev
```

브라우저에서 `http://localhost:5173` 접속 후:
- Calendar View에서 날짜별 데이터 확인
- DateDetail View에서 지역별 장소 확인
- 데이터 수정/삭제 테스트

---

## ⚠️ 주의사항 (Warnings)

### 1. 중복 데이터 방지

**마이그레이션 전 데이터베이스 확인:**
```bash
cd date-log-server
npx prisma studio
```

**이미 데이터가 있다면 삭제 후 마이그레이션:**
```bash
# 데이터베이스 초기화
npx prisma migrate reset

# 또는 수동 삭제
docker exec -it datelog-postgres psql -U postgres -d datelog_dev -c "
  TRUNCATE TABLE cafes, restaurants, spots, date_entries RESTART IDENTITY CASCADE;
"
```

### 2. 백엔드 서버 실행 필수

마이그레이션 전에 **반드시** 백엔드 서버가 실행 중이어야 합니다:
```bash
cd date-log-server
npm run dev
# ✓ Server running at http://localhost:3001
```

### 3. 네트워크 타임아웃

- 기본 타임아웃: 10초
- 대량 데이터 마이그레이션 시 타임아웃 증가 필요:
  ```env
  VITE_API_TIMEOUT=30000  # 30초
  ```

### 4. 데이터 백업

마이그레이션 전 **반드시 백업**:
```bash
# LocalStorage 데이터 백업
cp local-storage.json local-storage.backup.json

# PostgreSQL 백업
cd date-log-server
docker exec datelog-postgres pg_dump -U postgres datelog_dev > backup.sql
```

---

## 🐛 트러블슈팅 (Troubleshooting)

### 문제 1: "File not found: local-storage.json"

**원인:** `local-storage.json` 파일이 프로젝트 루트에 없음

**해결:**
```bash
# 파일 위치 확인
ls -l local-storage.json

# 올바른 위치로 이동
mv path/to/local-storage.json ./
```

### 문제 2: "Connection refused" 또는 네트워크 에러

**원인:** 백엔드 서버가 실행되지 않았거나 포트가 다름

**해결:**
```bash
# 백엔드 서버 실행
cd date-log-server
npm run dev

# 포트 확인
curl http://localhost:3001/v1/health
```

### 문제 3: "Timeout" 에러

**원인:** API 요청 시간 초과

**해결:**
```env
# .env 파일에서 타임아웃 증가
VITE_API_TIMEOUT=30000
```

### 문제 4: 일부 날짜만 마이그레이션 실패

**원인:** 특정 날짜의 데이터 형식 문제

**확인:**
```bash
# 실패한 날짜 확인
npm run migrate  # Dry run으로 확인

# local-storage.json에서 해당 날짜 데이터 검토
cat local-storage.json | jq '.["2025-10-18"]'
```

**해결:**
1. `local-storage.json`에서 문제 데이터 수정
2. 필수 필드 확인: `name`, `date`, `region`
3. 데이터 타입 확인: `visited` (boolean), `coordinates` (object)

### 문제 5: "Unique constraint violation" 에러

**원인:** 이미 같은 날짜/지역 데이터가 존재

**해결:**
```bash
# 1. 기존 데이터 확인
curl http://localhost:3001/v1/date-entries?date=2025-10-18

# 2. 데이터베이스 초기화 후 재시도
cd date-log-server
npx prisma migrate reset

# 3. 마이그레이션 재실행
cd my-date-log
npm run migrate:execute
```

---

## 📈 마이그레이션 통계 (Migration Statistics)

### 샘플 데이터 분석 (local-storage.json)

```
총 날짜: 10개
- 2025-09-19 (1 지역, 1 장소)
- 2025-09-20 (1 지역, 0 장소)
- 2025-10-02 (1 지역, 0 장소)
- 2025-10-09 (1 지역, 3 장소)
- 2025-10-10 (1 지역, 2 장소)
- 2025-10-15 (1 지역, 3 장소)
- 2025-10-16 (1 지역, 0 장소)
- 2025-10-17 (1 지역, 1 장소)
- 2025-10-18 (2 지역, 6 장소) ← 다중 지역 예시
- 2025-10-23 (1 지역, 0 장소)

총 지역: 12개
총 장소: 22개
  ☕ 카페: 8개
  🍽️  레스토랑: 10개
  🎯 관광지: 4개

변환 결과:
  Frontend DateLog: 10개 (날짜별)
  Backend DateEntry: 12개 (날짜 × 지역별)
```

**변환 예시:**
```
Frontend (Multi-Region):
{
  "2025-10-18": {
    regions: ["삼송", "서오릉"]  // 1개 DateLog
  }
}

Backend (Single-Region):
[
  { date: "2025-10-18", region: "삼송" },   // DateEntry 1
  { date: "2025-10-18", region: "서오릉" }  // DateEntry 2
]
```

---

## 🔄 롤백 계획 (Rollback Plan)

### 마이그레이션 실패 시

#### 1. 데이터베이스 복구

```bash
# 백업에서 복구
cd date-log-server
docker exec -i datelog-postgres psql -U postgres datelog_dev < backup.sql

# 또는 데이터베이스 초기화
npx prisma migrate reset
```

#### 2. LocalStorage로 되돌리기

```bash
# .env에서 API 비활성화
VITE_ENABLE_API=false

# 앱 재시작
cd my-date-log
npm run dev
```

#### 3. 부분 마이그레이션 복구

특정 날짜만 실패한 경우:
```bash
# 1. 실패한 날짜 삭제
curl -X DELETE http://localhost:3001/v1/date-entries/{entry-id}

# 2. local-storage.json에서 해당 날짜 데이터 수정

# 3. 해당 날짜만 다시 마이그레이션
# (마이그레이션 스크립트 수정하여 특정 날짜만 처리)
```

---

## ✅ 마이그레이션 체크리스트

### 마이그레이션 전

- [ ] 백엔드 서버 실행 확인 (`http://localhost:3001/v1/health`)
- [ ] `local-storage.json` 파일 존재 확인
- [ ] `.env` 파일 설정 확인 (`VITE_API_BASE_URL`, `VITE_ENABLE_API`)
- [ ] 데이터베이스 백업 완료
- [ ] `local-storage.json` 백업 완료
- [ ] Dry Run 실행 및 결과 확인

### 마이그레이션 실행

- [ ] `npm run migrate` (Dry Run) 성공 확인
- [ ] `npm run migrate:execute` (실제 마이그레이션) 실행
- [ ] 마이그레이션 완료 메시지 확인
- [ ] 성공률 100% 확인

### 마이그레이션 후

- [ ] 백엔드 API로 데이터 조회 성공
- [ ] 데이터베이스에서 데이터 확인
- [ ] 프론트엔드에서 API 모드로 앱 실행
- [ ] Calendar View 정상 동작 확인
- [ ] DateDetail View 정상 동작 확인
- [ ] CRUD 기능 테스트 (생성, 수정, 삭제)

---

## 📚 관련 문서

- [Phase 1: API Client 설정](./PHASE1_API_CLIENT_COMPLETION.md)
- [Phase 2: 백엔드 통합](./PHASE2_BACKEND_INTEGRATION.md)
- [Backend API 명세](../date-log-server/backend/docs/api-specification.md)
- [Prisma Schema](../date-log-server/prisma/schema.prisma)

---

## 🎉 다음 단계 (Next Steps)

마이그레이션 완료 후:

1. **LocalStorage 비활성화**
   ```env
   VITE_ENABLE_API=true  # API 모드로 전환
   ```

2. **프로덕션 배포**
   - 백엔드 서버 배포 (Heroku, Railway, Render 등)
   - 프론트엔드 배포 (Vercel, Netlify 등)
   - 환경 변수 설정 업데이트

3. **모니터링 설정**
   - 에러 로깅 (Sentry, LogRocket)
   - 성능 모니터링 (Google Analytics, Hotjar)
   - 백엔드 헬스체크 설정

4. **추가 기능 개발**
   - 사용자 인증 (Phase 4)
   - 이미지 업로드 (Phase 5)
   - 공유 기능 (Phase 6)

---

## 📝 마이그레이션 스크립트 코드

### 핵심 로직

```typescript
// src/scripts/migrate-data.ts

class DataMigrator {
  /**
   * 단일 날짜 마이그레이션
   */
  private async migrateDateEntry(date: string, dateLog: DateLog): Promise<void> {
    // 1. Frontend DateLog → Backend CreateDateEntryRequest[] 변환
    const createRequests = DateLogAdapter.toBackendCreateRequests(dateLog);

    if (this.dryRun) {
      // Dry Run: 출력만
      console.log(`Would create ${createRequests.length} entries`);
    } else {
      // Execute: 실제 API 호출
      for (const request of createRequests) {
        const entry = await apiClient.createDateEntry(request);
        console.log(`✓ Created (ID: ${entry.id})`);
      }
    }
  }
}
```

### 데이터 변환 (DateLogAdapter)

```typescript
// src/services/api/adapter.ts

export class DateLogAdapter {
  /**
   * Frontend DateLog → Backend CreateDateEntryRequest[]
   *
   * 1개의 다중 지역 DateLog → N개의 단일 지역 DateEntry
   */
  static toBackendCreateRequests(dateLog: DateLog): CreateDateEntryRequest[] {
    return dateLog.regions.map((region) => ({
      date: dateLog.date,
      region: region.name,
      cafes: region.categories.cafe.map(this.toBackendCafe),
      restaurants: region.categories.restaurant.map(this.toBackendRestaurant),
      spots: region.categories.spot.map(this.toBackendSpot),
    }));
  }
}
```

---

## 🔧 스크립트 커스터마이징

### 특정 날짜만 마이그레이션

```typescript
// src/scripts/migrate-data.ts 수정

async migrate(): Promise<void> {
  // ... (생략)

  // 특정 날짜만 필터링
  const targetDates = ['2025-10-18', '2025-10-15'];
  const dates = Object.keys(data).filter(date => targetDates.includes(date));

  for (const date of dates) {
    await this.migrateDateEntry(date, data[date]);
  }
}
```

### 진행률 표시 추가

```typescript
// 진행률 바 추가
import cliProgress from 'cli-progress';

async migrate(): Promise<void> {
  const progressBar = new cliProgress.SingleBar({});
  progressBar.start(this.stats.totalDates, 0);

  for (let i = 0; i < dates.length; i++) {
    await this.migrateDateEntry(dates[i], data[dates[i]]);
    progressBar.update(i + 1);
  }

  progressBar.stop();
}
```

---

## 💡 베스트 프랙티스

1. **항상 Dry Run 먼저 실행**
   ```bash
   npm run migrate  # 먼저 확인
   npm run migrate:execute  # 확인 후 실행
   ```

2. **백업은 필수**
   ```bash
   # 마이그레이션 전 백업
   cp local-storage.json local-storage.backup.json
   ```

3. **작은 단위로 테스트**
   - 1-2개 날짜 데이터로 먼저 테스트
   - 성공 확인 후 전체 마이그레이션

4. **로그 저장**
   ```bash
   npm run migrate:execute > migration.log 2>&1
   ```

5. **마이그레이션 후 검증**
   - API로 데이터 조회
   - 프론트엔드에서 직접 확인
   - 데이터베이스 직접 확인

---

**마이그레이션 성공을 기원합니다! 🎉**
