# DateLog 배포 워크플로우

**문서 생성일**: 2025-12-13
**기반 분석**: DateLog 프론트엔드/백엔드 통합 분석 보고서
**총 예상 소요 시간**: 2-3시간

---

## 워크플로우 규칙

각 Phase는 다음 4단계를 따름:

| 단계 | 설명 | 완료 기준 |
|------|------|----------|
| **1. 사전 점검** | 필요 조건 확인, 환경 검증 | 체크리스트 모두 통과 |
| **2. 개발 시작** | 실제 작업 수행 | 작업 항목 완료 |
| **3. 개발 후 점검** | 결과 검증, 테스트 | 검증 항목 모두 통과 |
| **4. 커밋** | Git 커밋 및 배포 | 커밋/배포 완료 |

---

## Phase 1: Backend Render 배포

**목표**: date-log-server를 Render에 배포하고 MongoDB Atlas 연결

### 1.1 사전 점검

- [ ] MongoDB Atlas 계정 및 클러스터 준비 확인
- [ ] MongoDB Atlas Network Access에 `0.0.0.0/0` (또는 Render IP) 허용
- [ ] Render 계정 로그인 및 GitHub 연동 확인
- [ ] `date-log-server` 저장소가 GitHub에 push 되어 있는지 확인
- [ ] 로컬 `npm run build` 성공 확인

```bash
# 로컬 빌드 테스트
cd date-log-server
npm run build
npm run lint
```

**통과 기준**: 모든 항목 체크 완료

### 1.2 개발 시작

#### 1.2.1 Render Web Service 생성

1. Render Dashboard → **New → Web Service**
2. GitHub 저장소 선택: `date-log-server`
3. 설정:
   - **Name**: `date-log-back` (⚠️ Frontend URL과 일치해야 함)
   - **Region**: Oregon (US West)
   - **Branch**: `main`
   - **Runtime**: Node
   - **Build Command**: `npm ci && npm run build`
   - **Start Command**: `npm start`
   - **Plan**: Free (테스트) 또는 Starter ($7/월)

#### 1.2.2 환경 변수 설정

Render Dashboard → Environment 탭:

| 변수명 | 값 | 비고 |
|--------|-----|------|
| `NODE_ENV` | `production` | 필수 |
| `PORT` | (Render 자동 설정) | 설정 불필요 |
| `MONGODB_URI` | `mongodb+srv://...` | MongoDB Atlas 연결 문자열 |
| `CORS_ORIGIN` | `*` | 임시, Phase 3 후 수정 |

#### 1.2.3 Health Check 설정

- **Health Check Path**: `/v1/health`
- **Health Check Interval**: 30초

### 1.3 개발 후 점검

- [ ] Render 빌드 로그에 에러 없음
- [ ] 서비스 상태: "Live"
- [ ] Health Check 테스트:

```bash
curl https://date-log-back.onrender.com/v1/health
# 예상 응답: {"status":"ok","timestamp":"..."}
```

- [ ] API 엔드포인트 테스트:

```bash
# Date Entry 조회
curl https://date-log-back.onrender.com/v1/dates

# Date Entry 생성
curl -X POST https://date-log-back.onrender.com/v1/dates \
  -H "Content-Type: application/json" \
  -d '{"date":"2025-12-13","region":"테스트"}'
```

**통과 기준**: Health Check 응답 정상 + API 테스트 성공

### 1.4 커밋

Backend 저장소에 변경사항이 있는 경우:

```bash
cd date-log-server
git add .
git commit -m "chore: Render 배포 설정 완료

- render.yaml 서비스명 수정 (date-log-back)
- 환경변수 설정 가이드 업데이트
"
git push origin main
```

**완료 체크**:
- [ ] Backend URL 확정: `https://date-log-back.onrender.com`
- [ ] Render 자동 배포 활성화 확인

---

## Phase 2: URL 동기화 및 문서 정리

**목표**: Frontend/Backend URL 일치 확인 및 문서 불일치 해결

### 2.1 사전 점검

- [ ] Phase 1 완료 확인 (Backend 배포 성공)
- [ ] Backend 실제 URL 확인: `https://date-log-back.onrender.com`
- [ ] Frontend render.yaml의 VITE_API_BASE_URL 확인

```bash
cd my-date-log
cat render.yaml | grep VITE_API_BASE_URL
```

**통과 기준**: Backend URL 확정됨

### 2.2 개발 시작

#### 2.2.1 Frontend render.yaml 확인/수정

`my-date-log/render.yaml`:

```yaml
# Production 환경 변수 확인
envVars:
  - key: VITE_API_BASE_URL
    value: https://date-log-back.onrender.com/v1  # Backend URL과 일치
```

#### 2.2.2 Backend CLAUDE.md 문서 수정

`date-log-server/CLAUDE.md` 수정:
- "PostgreSQL + Prisma" → "MongoDB + Mongoose" 로 업데이트

#### 2.2.3 NEXT_STEPS.md 업데이트

배포 완료 항목 체크 및 다음 단계 업데이트

### 2.3 개발 후 점검

- [ ] Frontend render.yaml URL이 Backend URL과 일치
- [ ] .env.production 파일 URL 확인 (있는 경우)
- [ ] CLAUDE.md 문서 정확성 확인

```bash
# URL 일치 확인
grep -r "date-log-back" my-date-log/
grep -r "datelog-backend" my-date-log/  # 이게 있으면 수정 필요
```

**통과 기준**: 모든 URL 참조가 일관됨

### 2.4 커밋

```bash
# Frontend 저장소
cd my-date-log
git add .
git commit -m "docs: Backend URL 동기화 및 문서 정리

- render.yaml URL 확인/수정
- 배포 워크플로우 문서 추가
"
git push origin main

# Backend 저장소
cd ../date-log-server
git add .
git commit -m "docs: CLAUDE.md MongoDB 기술스택으로 업데이트

- PostgreSQL + Prisma → MongoDB + Mongoose 수정
- NEXT_STEPS.md 배포 완료 항목 업데이트
"
git push origin main
```

**완료 체크**:
- [ ] 양쪽 저장소 커밋 완료
- [ ] 문서 일관성 확보

---

## Phase 3: Frontend Render 배포

**목표**: my-date-log를 Render Static Site로 배포

### 3.1 사전 점검

- [ ] Phase 1, 2 완료 확인
- [ ] Backend API 정상 작동 확인
- [ ] Kakao Maps API Key 준비
- [ ] Kakao 개발자센터 로그인 가능
- [ ] 로컬 빌드 테스트:

```bash
cd my-date-log
npm run build:production
```

**통과 기준**: 로컬 빌드 성공 + Backend API 정상

### 3.2 개발 시작

#### 3.2.1 Render Static Site 생성

1. Render Dashboard → **New → Static Site**
2. GitHub 저장소 선택: `my-date-log`
3. 설정:
   - **Name**: `datelog-frontend-production`
   - **Branch**: `main` (또는 `production`)
   - **Build Command**: `npm install && npm run build:production`
   - **Publish Directory**: `dist`

#### 3.2.2 환경 변수 설정

| 변수명 | 값 |
|--------|-----|
| `NODE_ENV` | `production` |
| `VITE_KAKAO_MAP_API_KEY` | `<Kakao API Key>` |
| `VITE_API_BASE_URL` | `https://date-log-back.onrender.com/v1` |
| `VITE_API_TIMEOUT` | `10000` |
| `VITE_ENABLE_API` | `true` |

#### 3.2.3 Rewrite 규칙 설정 (SPA)

Render Dashboard → Redirects/Rewrites:
- **Source**: `/*`
- **Destination**: `/index.html`
- **Action**: Rewrite

#### 3.2.4 Kakao 개발자센터 도메인 등록

1. https://developers.kakao.com → 내 애플리케이션
2. 앱 선택 → 플랫폼 → Web
3. 사이트 도메인 추가:
   - `https://datelog-frontend-production.onrender.com`

#### 3.2.5 Backend CORS 업데이트

Render Backend Dashboard → Environment:

```
CORS_ORIGIN=https://datelog-frontend-production.onrender.com
```

→ 저장 후 Backend 자동 재배포 대기

### 3.3 개발 후 점검

- [ ] Frontend 빌드 성공 (Render 로그 확인)
- [ ] 사이트 접속 가능: `https://datelog-frontend-production.onrender.com`
- [ ] Kakao Maps 로드 성공 (콘솔 에러 없음)
- [ ] API 연결 테스트:
  - 캘린더 페이지 로드
  - Date Entry 조회 성공
- [ ] CORS 에러 없음 (개발자 도구 Network 탭 확인)

```bash
# Frontend URL 접속 테스트
curl -I https://datelog-frontend-production.onrender.com
```

**통과 기준**: 모든 기능 정상 작동 + 에러 없음

### 3.4 커밋

변경사항이 있는 경우:

```bash
cd my-date-log
git add .
git commit -m "deploy: Frontend Render 배포 완료

- Production 환경 설정 완료
- Kakao Maps 도메인 등록
"
git push origin main
```

**완료 체크**:
- [ ] Frontend URL 확정: `https://datelog-frontend-production.onrender.com`
- [ ] CORS 설정 완료

---

## Phase 4: 통합 테스트

**목표**: 전체 시스템 E2E 테스트 및 검증

### 4.1 사전 점검

- [ ] Phase 1, 2, 3 모두 완료
- [ ] Frontend, Backend 모두 "Live" 상태
- [ ] CORS 설정 완료

**통과 기준**: 모든 서비스 정상 가동

### 4.2 개발 시작 (테스트 실행)

#### 4.2.1 기능 테스트 체크리스트

| 기능 | 테스트 항목 | 상태 |
|------|------------|------|
| **캘린더** | 월별 보기 전환 | [ ] |
| **Date Entry** | 새 날짜 추가 | [ ] |
| **Date Entry** | 날짜 삭제 | [ ] |
| **Region** | 지역 추가/수정/삭제 | [ ] |
| **Cafe** | 카페 추가/수정/삭제 | [ ] |
| **Restaurant** | 식당 추가/수정/삭제 | [ ] |
| **Spot** | 장소 추가/수정/삭제 | [ ] |
| **Visited** | 방문 토글 | [ ] |
| **Kakao Maps** | 지도 표시 | [ ] |
| **Kakao Maps** | 마커 표시 | [ ] |

#### 4.2.2 에러 처리 테스트

- [ ] 네트워크 끊김 시 에러 메시지 표시
- [ ] 잘못된 입력 시 에러 처리
- [ ] 404 페이지 동작

#### 4.2.3 성능 확인

- [ ] 초기 로드 시간 < 3초
- [ ] API 응답 시간 < 1초
- [ ] Render Free tier의 Cold Start 확인 (첫 요청 지연 있음)

### 4.3 개발 후 점검

- [ ] 모든 기능 테스트 통과
- [ ] Console 에러 없음
- [ ] Network 탭에 실패한 요청 없음
- [ ] Render 로그에 에러 없음

```bash
# Backend 로그 확인 (Render Dashboard)
# Frontend 빌드 로그 확인 (Render Dashboard)
```

**통과 기준**: 모든 테스트 항목 통과

### 4.4 커밋 (최종)

```bash
# 테스트 결과 문서화 (선택)
cd my-date-log
echo "# 배포 완료 - $(date)" >> claudedocs/DEPLOYMENT_LOG.md
git add .
git commit -m "docs: 배포 완료 및 통합 테스트 성공

- Frontend: https://datelog-frontend-production.onrender.com
- Backend: https://date-log-back.onrender.com
- 모든 CRUD 기능 검증 완료
"
git push origin main
```

**완료 체크**:
- [ ] 전체 배포 완료
- [ ] 통합 테스트 성공
- [ ] 문서화 완료

---

## 롤백 가이드

### Backend 롤백
```bash
# Render Dashboard → Manual Deploy → 이전 커밋 선택
# 또는 Git revert
git revert HEAD
git push origin main
```

### Frontend 롤백
```bash
# 동일한 방법
git revert HEAD
git push origin main
```

### CORS 문제 발생 시
1. Backend CORS_ORIGIN을 `*`로 임시 설정
2. Frontend URL 정확히 확인
3. 정확한 URL로 CORS_ORIGIN 재설정

---

## 트러블슈팅

### 문제 1: "CORS 에러"
```
Access to fetch at 'https://...' from origin 'https://...' has been blocked by CORS policy
```
**해결**: Backend CORS_ORIGIN 환경변수에 Frontend URL 정확히 입력

### 문제 2: "Kakao Maps 로드 실패"
```
InvalidKeyException 또는 referer 에러
```
**해결**: Kakao 개발자센터에 Render 도메인 등록

### 문제 3: "MongoDB 연결 실패"
```
MongoServerSelectionError
```
**해결**: MongoDB Atlas Network Access에 0.0.0.0/0 허용

### 문제 4: "Cold Start 지연"
**현상**: 첫 요청 시 15-30초 대기
**원인**: Render Free tier는 비활성 시 서버 중지
**해결**: Starter 플랜 업그레이드 또는 Health Check로 유지

---

## 체크리스트 요약

### Phase 1: Backend 배포
- [ ] 1.1 사전 점검 완료
- [ ] 1.2 Render 서비스 생성 완료
- [ ] 1.3 Health Check 통과
- [ ] 1.4 커밋 완료

### Phase 2: URL 동기화
- [ ] 2.1 사전 점검 완료
- [ ] 2.2 URL/문서 수정 완료
- [ ] 2.3 일관성 검증 완료
- [ ] 2.4 커밋 완료

### Phase 3: Frontend 배포
- [ ] 3.1 사전 점검 완료
- [ ] 3.2 Static Site 배포 완료
- [ ] 3.3 Kakao + CORS 설정 완료
- [ ] 3.4 커밋 완료

### Phase 4: 통합 테스트
- [ ] 4.1 사전 점검 완료
- [ ] 4.2 기능 테스트 완료
- [ ] 4.3 검증 완료
- [ ] 4.4 최종 커밋 완료

---

**작성자**: Claude Code
**버전**: 1.0
**다음 검토일**: 배포 완료 후
