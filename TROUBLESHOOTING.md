# Kakao Maps 지도 로드 실패 문제 해결 가이드

## 🔍 문제 진단

### 1. 브라우저 콘솔 확인
1. 브라우저에서 `F12` 키를 눌러 개발자 도구 열기
2. **Console** 탭에서 다음 로그 확인:
   ```
   [Kakao Maps SDK] API Key: ff76d41c3d...
   [Kakao Maps SDK] Loading: true/false
   [Kakao Maps SDK] Error: ...
   ```

### 2. 일반적인 오류 유형

#### 오류 A: API Key 관련
**증상**: "API 키 설정 필요" 화면 표시
**원인**:
- `.env` 파일이 없음
- `VITE_KAKAO_MAP_API_KEY` 변수가 비어있음
- 개발 서버 재시작 필요

**해결 방법**:
```bash
# 1. .env 파일 확인
cat .env

# 2. 내용이 다음과 같은지 확인:
VITE_KAKAO_MAP_API_KEY=ff76d41c3df3ea33d5547a24db77743c

# 3. 개발 서버 재시작
npm run dev
```

#### 오류 B: CORS / 플랫폼 도메인 미등록
**증상**: "지도 로드 실패" + 콘솔에 CORS 오류
**원인**: Kakao 개발자 콘솔에 도메인이 등록되지 않음

**해결 방법**:
1. [Kakao 개발자 콘솔](https://developers.kakao.com/console/app) 접속
2. 앱 선택 → **플랫폼** 메뉴
3. **Web 플랫폼 추가**
4. 다음 도메인 등록:
   - `http://localhost:5173` (개발)
   - `http://127.0.0.1:5173` (개발)
   - `http://localhost:3000` (프리뷰)
   - 배포 도메인 (예: `https://date-log.onrender.com`)

#### 오류 C: 네트워크 오류
**증상**: "지도 로드 실패" + 네트워크 타임아웃
**원인**:
- 인터넷 연결 문제
- 방화벽/프록시 차단
- Kakao API 서버 문제

**해결 방법**:
```bash
# Kakao API 서버 테스트
curl https://dapi.kakao.com/v2/maps/sdk.js?appkey=ff76d41c3df3ea33d5547a24db77743c
```

#### 오류 D: 브라우저 캐시
**증상**: API 키 변경 후에도 이전 오류 발생
**원인**: 브라우저가 이전 상태를 캐싱

**해결 방법**:
1. `Ctrl + Shift + Delete` → 캐시 삭제
2. 또는 시크릿 모드에서 테스트
3. 또는 `Ctrl + F5` 강제 새로고침

#### 오류 E: react-kakao-maps-sdk 버전 문제
**증상**: TypeScript 오류 또는 SDK 초기화 실패
**원인**: 패키지 버전 호환성 문제

**해결 방법**:
```bash
# 패키지 재설치
npm install react-kakao-maps-sdk@latest

# 또는 특정 버전
npm install react-kakao-maps-sdk@1.2.0
```

---

## 🛠️ 개발 환경 설정

### 올바른 .env 파일 구조

```bash
# .env (개발 환경)
VITE_KAKAO_MAP_API_KEY=your_api_key_here
```

```bash
# .env.production (프로덕션 환경)
VITE_KAKAO_MAP_API_KEY=your_production_api_key_here
VITE_API_BASE_URL=https://date-log-back.onrender.com/v1
```

### 주의사항
- ⚠️ 변수명은 반드시 `VITE_` 접두사로 시작
- ⚠️ `=` 앞뒤에 공백 없이 작성
- ⚠️ `.env` 파일 변경 후 **반드시** 개발 서버 재시작
- ⚠️ `.env` 파일은 `.gitignore`에 포함되어야 함

---

## 🚀 빠른 시작 가이드

### Windows
```bash
# 간편 시작 스크립트 사용
.\start-dev.bat
```

### macOS/Linux
```bash
# 환경 확인
node check-env.js

# 개발 서버 시작
npm run dev
```

---

## 🔧 디버깅 도구

### 1. 환경 변수 진단
```bash
node check-env.js
```

### 2. API 직접 테스트
브라우저에서 `test-env.html` 파일 열기

### 3. 콘솔 로그 확인
App.tsx에 추가된 디버그 로그 확인:
```
[Kakao Maps SDK] API Key: ff76d41c3d...
[Kakao Maps SDK] Loading: true
[Kakao Maps SDK] Error: null
```

---

## 📞 추가 지원

### Kakao Developers 문서
- [JavaScript API 가이드](https://apis.map.kakao.com/web/guide/)
- [플랫폼 등록 가이드](https://developers.kakao.com/docs/latest/ko/getting-started/app)

### 프로젝트 Issues
문제가 계속되면 다음 정보와 함께 이슈 등록:
1. 브라우저 콘솔 전체 로그
2. `check-env.js` 실행 결과
3. 네트워크 탭 스크린샷
4. 발생 환경 (OS, 브라우저, Node.js 버전)

---

## ✅ 체크리스트

문제 해결 전 다음을 확인하세요:

- [ ] `.env` 파일이 프로젝트 루트에 존재
- [ ] `VITE_KAKAO_MAP_API_KEY`가 올바르게 설정됨
- [ ] 개발 서버를 재시작함
- [ ] 브라우저 콘솔에서 로그 확인
- [ ] Kakao 개발자 콘솔에서 도메인 등록 확인
- [ ] 네트워크 연결 정상
- [ ] 브라우저 캐시 삭제 시도
- [ ] 다른 브라우저에서 테스트

---

**마지막 업데이트**: 2025-10-25
**버전**: 1.0.0
