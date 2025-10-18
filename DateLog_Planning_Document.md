
# 💕 DateLog – 데이트 코스 기록 서비스 기획서 (프론트엔드 전용 버전)

## 1️⃣ 서비스 개요
**서비스명:** DateLog (데이트로그)  
**타입:** 프론트엔드 전용 SPA (Single Page Application)  
**저장 구조:** 로컬 또는 JSON 파일 기반  
**목적:**  
- 날짜별로 데이트 코스를 기록하고,  
- 동네별로 장소(카페/음식점/관광지)를 정리하며,  
- 지도 위에서 다녀온 장소를 표시할 수 있는 개인화 앱  

---

## 2️⃣ 기술적 방향 요약

| 항목 | 내용 |
|------|------|
| 서버 구성 | 백엔드 없음 |
| 데이터 저장 | JSON 파일 + `localStorage` (브라우저 내부 저장) |
| 데이터 로드 | 초기 JSON 파일(`/data/courses.json`)에서 불러오기 |
| 데이터 변경 | 사용자의 변경 사항은 `localStorage`에 자동 반영 |
| 동기화 전략 | 초기 로드 시 JSON → 이후 localStorage 우선 사용 |
| 배포 | 정적 호스팅 (Vercel / GitHub Pages / Netlify) |

---

## 3️⃣ 화면 구조 요약

### 🗓️ 달력(Calendar) 화면
- 월별 달력 표시  
- 날짜별로 기록 존재 여부 점(●) 표시  
- 날짜 클릭 시 상세 페이지로 이동  
- 새 날짜 추가 버튼 (+) 지원  

---

### 📅 상세(Date Detail) 화면
**구성:**
- 날짜 (`2025.10.18`)
- 동네 (`삼송`) ✏️ 수정 가능  
- 카테고리별 섹션 (카페 / 음식점 / 관광지)  
- 각 카테고리별 카드 리스트
- 지도 표시 (현재 동네 내 등록된 모든 장소 표시)

#### ☕ 카페
- 가로 스크롤 카드 리스트
- 카드 내용:
  - 이미지 썸네일
  - 상호명 + 메모
  - [지도 보기] 버튼 (외부 링크)
  - [다녀옴✅] 토글 버튼  
- ➕ 버튼으로 새 카드 추가  

#### 🍽️ 음식점
- 상단 탭: `전체 | 한식 | 일식 | 중식 | 고기집`
- 카드 구조 동일
- 하위 분류 선택 시 필터링

#### 🏞️ 관광지
- 썸네일 + 이름 + 메모 + 방문 여부

#### 🗺️ 지도 뷰
- 해당 동네 기준 지도 (카카오맵 or 네이버맵 SDK)
- 등록된 장소에 핀 표시
- 다녀온 곳은 반투명 처리 또는 체크 표시

---

## 4️⃣ 데이터 관리 구조

### 📁 `/data/courses.json` (기본 JSON 데이터)
```json
{
  "2025-10-18": {
    "region": "삼송",
    "categories": {
      "cafe": [
        {
          "name": "나무사이로",
          "memo": "분위기 좋은 창가 자리 있음",
          "image": "/images/cafe1.jpg",
          "link": "https://map.naver.com",
          "visited": true
        }
      ],
      "restaurant": [
        {
          "name": "이이요",
          "type": "한식",
          "memo": "고등어정식 맛있음",
          "image": "/images/food1.jpg",
          "link": "https://map.naver.com",
          "visited": true
        }
      ],
      "spot": [
        {
          "name": "북한산 둘레길",
          "memo": "산책로 좋음",
          "image": "/images/spot1.jpg",
          "link": "https://map.naver.com",
          "visited": false
        }
      ]
    }
  }
}
```

---

### 💾 LocalStorage 동작 방식
| 상황 | 처리 방식 |
|------|-------------|
| 최초 접속 | `/data/courses.json` 불러와 메모리 캐싱 |
| 사용자가 수정 시 | `localStorage`에 동일 구조로 JSON 저장 |
| 새로고침 시 | `localStorage`에 데이터가 있으면 그걸 우선 로드 |
| “초기화” 버튼 클릭 시 | `localStorage` 삭제 후 `/data/courses.json` 재로드 |
