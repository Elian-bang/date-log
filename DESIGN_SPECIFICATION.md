# DateLog - Technical Design Specification

## 1. System Architecture Overview

### Architecture Type
**Frontend-Only SPA (Single Page Application)**
- No backend server
- JSON file-based data structure
- localStorage for persistence
- Static hosting compatible

### Technology Stack Recommendation
```yaml
Core:
  - Framework: React 18+ (with Hooks)
  - Language: TypeScript
  - Build Tool: Vite
  - Routing: React Router v6

UI/UX:
  - Styling: TailwindCSS or CSS Modules
  - Calendar: react-calendar or date-fns
  - Map: Kakao Maps SDK or Naver Maps SDK
  - Icons: React Icons or Heroicons

State Management:
  - Local State: useState, useReducer
  - Data Persistence: Custom localStorage hook
  - No global state library needed (simple app)

Deployment:
  - Vercel / Netlify / GitHub Pages
  - Build output: Static files
```

---

## 2. Application Structure

### Directory Structure
```
my-date-log/
├── public/
│   ├── data/
│   │   └── courses.json          # Initial seed data
│   └── images/                    # Uploaded images
├── src/
│   ├── components/
│   │   ├── calendar/
│   │   │   ├── CalendarView.tsx  # Monthly calendar
│   │   │   └── DateCell.tsx      # Individual date cell
│   │   ├── detail/
│   │   │   ├── DateDetailView.tsx
│   │   │   ├── CategorySection.tsx
│   │   │   ├── PlaceCard.tsx
│   │   │   └── MapView.tsx
│   │   ├── common/
│   │   │   ├── Header.tsx
│   │   │   ├── Button.tsx
│   │   │   └── Modal.tsx
│   │   └── forms/
│   │       ├── AddPlaceForm.tsx
│   │       └── EditRegionForm.tsx
│   ├── hooks/
│   │   ├── useLocalStorage.ts    # localStorage persistence
│   │   ├── useDateLog.ts         # Data management hook
│   │   └── useMapSDK.ts          # Map integration
│   ├── types/
│   │   └── index.ts              # TypeScript interfaces
│   ├── utils/
│   │   ├── dateUtils.ts
│   │   ├── dataSync.ts           # JSON ↔ localStorage
│   │   └── constants.ts
│   ├── App.tsx
│   ├── main.tsx
│   └── routes.tsx
├── package.json
├── tsconfig.json
├── vite.config.ts
└── tailwind.config.js
```

---

## 3. Data Model & TypeScript Interfaces

### Core Data Structures

```typescript
// src/types/index.ts

export interface Place {
  id: string;                    // UUID
  name: string;                  // 상호명
  memo?: string;                 // 메모
  image?: string;                // 이미지 경로
  link: string;                  // 지도 링크
  visited: boolean;              // 방문 여부
  coordinates?: {                // 지도 좌표 (optional)
    lat: number;
    lng: number;
  };
}

export interface Cafe extends Place {}

export interface Restaurant extends Place {
  type: '전체' | '한식' | '일식' | '중식' | '고기집' | '양식' | '기타';
}

export interface Spot extends Place {}

export interface Categories {
  cafe: Cafe[];
  restaurant: Restaurant[];
  spot: Spot[];
}

export interface DateLog {
  date: string;                  // YYYY-MM-DD format
  region: string;                // 동네명
  categories: Categories;
}

export interface DateLogData {
  [date: string]: DateLog;       // Key: YYYY-MM-DD
}

export type CategoryType = 'cafe' | 'restaurant' | 'spot';
export type RestaurantType = '전체' | '한식' | '일식' | '중식' | '고기집' | '양식' | '기타';
```

### Sample Data Structure
```json
{
  "2025-10-18": {
    "date": "2025-10-18",
    "region": "삼송",
    "categories": {
      "cafe": [
        {
          "id": "cafe-001",
          "name": "나무사이로",
          "memo": "분위기 좋은 창가 자리 있음",
          "image": "/images/cafe1.jpg",
          "link": "https://map.naver.com/...",
          "visited": true,
          "coordinates": {
            "lat": 37.6586,
            "lng": 126.8923
          }
        }
      ],
      "restaurant": [
        {
          "id": "rest-001",
          "name": "이이요",
          "type": "한식",
          "memo": "고등어정식 맛있음",
          "image": "/images/food1.jpg",
          "link": "https://map.naver.com/...",
          "visited": true
        }
      ],
      "spot": [
        {
          "id": "spot-001",
          "name": "북한산 둘레길",
          "memo": "산책로 좋음",
          "image": "/images/spot1.jpg",
          "link": "https://map.naver.com/...",
          "visited": false
        }
      ]
    }
  }
}
```

---

## 4. Component Architecture

### Component Hierarchy

```
App
├── Header
└── Router
    ├── CalendarView (/)
    │   ├── CalendarHeader (월 선택)
    │   └── CalendarGrid
    │       └── DateCell[] (각 날짜)
    │           └── DotIndicator (기록 존재 표시)
    │
    └── DateDetailView (/date/:dateId)
        ├── DetailHeader
        │   ├── DateDisplay
        │   └── RegionEditor (동네 수정)
        ├── CategorySection (cafe)
        │   ├── SectionHeader
        │   ├── HorizontalCardList
        │   │   └── PlaceCard[]
        │   └── AddPlaceButton
        ├── CategorySection (restaurant)
        │   ├── TabFilter (한식/일식/...)
        │   ├── HorizontalCardList
        │   │   └── PlaceCard[]
        │   └── AddPlaceButton
        ├── CategorySection (spot)
        │   ├── HorizontalCardList
        │   │   └── PlaceCard[]
        │   └── AddPlaceButton
        └── MapView
            └── MapMarker[] (모든 장소)
```

### Key Component Specifications

#### 1. **CalendarView Component**
```typescript
// src/components/calendar/CalendarView.tsx

interface CalendarViewProps {
  currentMonth: Date;
  onDateSelect: (date: string) => void;
  onMonthChange: (month: Date) => void;
}

// Features:
// - Monthly calendar grid display
// - Dot indicator for dates with logs
// - Navigate to detail on date click
// - Month navigation (prev/next)
// - "Add New Date" button
```

#### 2. **DateDetailView Component**
```typescript
// src/components/detail/DateDetailView.tsx

interface DateDetailViewProps {
  dateId: string;  // YYYY-MM-DD
}

// Features:
// - Display date and region
// - Edit region inline
// - Render category sections
// - Show map with all places
// - Back to calendar navigation
```

#### 3. **PlaceCard Component**
```typescript
// src/components/detail/PlaceCard.tsx

interface PlaceCardProps {
  place: Place | Restaurant | Cafe | Spot;
  category: CategoryType;
  onToggleVisited: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

// Features:
// - Image thumbnail display
// - Name and memo display
// - "View on Map" external link
// - "Visited" toggle button
// - Edit/Delete actions
```

#### 4. **MapView Component**
```typescript
// src/components/detail/MapView.tsx

interface MapViewProps {
  region: string;
  places: (Cafe | Restaurant | Spot)[];
}

// Features:
// - Integrate Kakao/Naver Map SDK
// - Center on region
// - Display markers for all places
// - Different marker styles for visited/unvisited
// - Click marker to show place name
```

---

## 5. Data Flow & State Management

### Data Synchronization Strategy

```typescript
// src/utils/dataSync.ts

/**
 * Data Flow:
 *
 * 1. Initial Load:
 *    - Check localStorage for 'dateLogData'
 *    - If exists: Use localStorage data
 *    - If not: Fetch /data/courses.json → Save to localStorage
 *
 * 2. User Modifications:
 *    - Update in-memory state
 *    - Immediately sync to localStorage
 *
 * 3. Reset Function:
 *    - Clear localStorage
 *    - Re-fetch /data/courses.json
 *    - Update state
 */

export const loadInitialData = async (): Promise<DateLogData> => {
  const stored = localStorage.getItem('dateLogData');

  if (stored) {
    return JSON.parse(stored);
  }

  const response = await fetch('/data/courses.json');
  const data = await response.json();
  localStorage.setItem('dateLogData', JSON.stringify(data));

  return data;
};

export const saveData = (data: DateLogData): void => {
  localStorage.setItem('dateLogData', JSON.stringify(data));
};

export const resetData = async (): Promise<DateLogData> => {
  localStorage.removeItem('dateLogData');
  return loadInitialData();
};
```

### Custom Hook: useDateLog

```typescript
// src/hooks/useDateLog.ts

interface UseDateLogReturn {
  data: DateLogData;
  loading: boolean;

  // Date operations
  addDate: (date: string, region: string) => void;
  updateRegion: (date: string, region: string) => void;
  deleteDate: (date: string) => void;

  // Place operations
  addPlace: (date: string, category: CategoryType, place: Place) => void;
  updatePlace: (date: string, category: CategoryType, placeId: string, updates: Partial<Place>) => void;
  deletePlace: (date: string, category: CategoryType, placeId: string) => void;
  toggleVisited: (date: string, category: CategoryType, placeId: string) => void;

  // Utility
  resetToDefault: () => void;
}

export const useDateLog = (): UseDateLogReturn => {
  // Implementation with useState + useEffect
  // All modifications trigger localStorage sync
};
```

---

## 6. Routing Structure

```typescript
// src/routes.tsx

import { createBrowserRouter } from 'react-router-dom';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <CalendarView />,
  },
  {
    path: '/date/:dateId',
    element: <DateDetailView />,
  },
  {
    path: '*',
    element: <Navigate to="/" />,
  },
]);
```

---

## 7. Map Integration Specification

### Kakao Maps SDK Integration

```typescript
// src/hooks/useMapSDK.ts

interface MapConfig {
  region: string;
  places: Place[];
}

export const useKakaoMap = (config: MapConfig) => {
  useEffect(() => {
    // Load Kakao Maps SDK
    const script = document.createElement('script');
    script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=YOUR_APP_KEY&autoload=false`;
    document.head.appendChild(script);

    script.onload = () => {
      window.kakao.maps.load(() => {
        initMap(config);
      });
    };
  }, [config]);
};

const initMap = (config: MapConfig) => {
  // 1. Create map centered on region
  // 2. Add markers for each place
  // 3. Style markers based on visited status
  // 4. Add click events for marker info
};
```

### Alternative: Naver Maps SDK
- Similar integration pattern
- Use Naver Maps API key
- Adjust marker and map initialization code

---

## 8. UI/UX Design Guidelines

### Design Principles
1. **Mobile-First**: Responsive design optimized for mobile devices
2. **Intuitive Navigation**: Clear back navigation and action buttons
3. **Visual Feedback**: Immediate visual feedback for all interactions
4. **Accessibility**: WCAG AA compliance for all UI elements

### Screen Layouts

#### Calendar Screen
```
┌─────────────────────────────────────┐
│ ☰ DateLog              [2025년 10월] │
├─────────────────────────────────────┤
│  일  월  화  수  목  금  토          │
│        1   2   3   4   5   6        │
│   7   8   9  10  11  12  13        │
│  14  15  16  17 ●18  19  20        │  ● = has log
│  21  22  23  24  25  26  27        │
│  28  29  30  31                     │
├─────────────────────────────────────┤
│          [+ 새 날짜 추가]            │
└─────────────────────────────────────┘
```

#### Date Detail Screen
```
┌─────────────────────────────────────┐
│ ← 2025.10.18          삼송 ✏️       │
├─────────────────────────────────────┤
│ ☕ 카페                       [+]   │
│ ┌─────┐ ┌─────┐ ┌─────┐           │  (horizontal scroll)
│ │img  │ │img  │ │img  │  →        │
│ │name │ │name │ │name │           │
│ │✅   │ │☐    │ │✅   │           │
│ └─────┘ └─────┘ └─────┘           │
├─────────────────────────────────────┤
│ 🍽️ 음식점                    [+]   │
│ [전체][한식][일식][중식][고기집]    │
│ ┌─────┐ ┌─────┐                   │
│ │img  │ │img  │  →                │
│ │name │ │name │                   │
│ └─────┘ └─────┘                   │
├─────────────────────────────────────┤
│ 🏞️ 관광지                    [+]   │
│ ┌─────┐                            │
│ │img  │  →                        │
│ │name │                            │
│ └─────┘                            │
├─────────────────────────────────────┤
│ 🗺️ 지도                            │
│ ┌─────────────────────────────┐   │
│ │   📍  📍      📍            │   │
│ │         📍                   │   │
│ │                              │   │
│ └─────────────────────────────┘   │
└─────────────────────────────────────┘
```

### Color Scheme Recommendation
```css
:root {
  /* Primary Colors */
  --primary: #FF6B9D;        /* Pink accent */
  --primary-light: #FFB3D1;
  --primary-dark: #CC5580;

  /* Neutral Colors */
  --bg-primary: #FFFFFF;
  --bg-secondary: #F8F9FA;
  --text-primary: #212529;
  --text-secondary: #6C757D;

  /* Status Colors */
  --success: #28A745;        /* Visited */
  --info: #17A2B8;
  --warning: #FFC107;
  --danger: #DC3545;

  /* Borders & Shadows */
  --border: #DEE2E6;
  --shadow: rgba(0, 0, 0, 0.1);
}
```

---

## 9. Build & Deployment Configuration

### Vite Configuration
```typescript
// vite.config.ts

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['react', 'react-dom', 'react-router-dom'],
        },
      },
    },
  },
});
```

### Deployment Targets
1. **Vercel** (Recommended)
   - Zero config deployment
   - Automatic HTTPS
   - Global CDN

2. **Netlify**
   - Drag & drop deployment
   - Form handling (if needed later)

3. **GitHub Pages**
   - Free hosting
   - Custom domain support
   - Requires build action

---

## 10. Development Phases

### Phase 1: Core Setup (Week 1)
- [ ] Initialize React + TypeScript + Vite project
- [ ] Setup TailwindCSS
- [ ] Create basic routing structure
- [ ] Implement data types and interfaces
- [ ] Create initial JSON data file
- [ ] Implement localStorage hook

### Phase 2: Calendar View (Week 2)
- [ ] Build CalendarView component
- [ ] Implement month navigation
- [ ] Add date cell with dot indicator
- [ ] Connect to data source
- [ ] Add "New Date" functionality

### Phase 3: Detail View (Week 3)
- [ ] Build DateDetailView layout
- [ ] Implement region editor
- [ ] Create PlaceCard component
- [ ] Build CategorySection with tabs
- [ ] Add horizontal scroll cards
- [ ] Implement add/edit/delete for places
- [ ] Add visited toggle functionality

### Phase 4: Map Integration (Week 4)
- [ ] Choose map SDK (Kakao or Naver)
- [ ] Integrate map SDK
- [ ] Display markers for places
- [ ] Style visited/unvisited markers
- [ ] Add marker click events

### Phase 5: Polish & Deploy (Week 5)
- [ ] Mobile responsiveness
- [ ] Image upload functionality
- [ ] Error handling
- [ ] Loading states
- [ ] Deployment to Vercel/Netlify
- [ ] User testing

---

## 11. Future Enhancements (Optional)

### Phase 2 Features (Post-MVP)
- Export data as JSON download
- Import data from JSON file
- Share date logs (generate shareable link)
- Dark mode support
- Multiple image uploads per place
- Search functionality across all dates
- Filter by region
- Statistics dashboard (most visited region, etc.)

### Potential Backend Integration (Future)
- User authentication
- Cloud storage for images
- Multi-device sync
- Collaborative logs (sharing with partner)

---

## 12. Performance Targets

### Performance Budget
- **Initial Load**: < 2s on 3G
- **Time to Interactive**: < 3s
- **Bundle Size**: < 500KB (gzipped)
- **Lighthouse Score**: > 90

### Optimization Strategies
- Code splitting by route
- Lazy load images
- Optimize image sizes
- Cache map SDK
- Use React.memo for expensive components
- Debounce user inputs

---

## 13. Browser Support

### Target Browsers
- Chrome/Edge: Last 2 versions
- Safari: Last 2 versions
- Firefox: Last 2 versions
- Mobile Safari: iOS 13+
- Chrome Android: Last 2 versions

### Polyfills Required
- None (modern browser features only)

---

## Summary

This design specification provides a complete blueprint for building DateLog as a simple, frontend-only web application. The architecture prioritizes:

1. **Simplicity**: No backend complexity, localStorage-based persistence
2. **User Experience**: Intuitive calendar navigation and visual place management
3. **Maintainability**: Clean component structure with TypeScript type safety
4. **Scalability**: Extensible design for future enhancements
5. **Performance**: Optimized bundle size and loading performance

**Next Steps**: Begin Phase 1 implementation with project initialization and core setup.
