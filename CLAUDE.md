# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

DateLog is a React + TypeScript web application for logging and managing date course records with calendar views, place management, and Kakao Maps integration. The application supports **hybrid data storage** - it can operate with localStorage only (Phase 1) or integrate with a backend API (Phase 2+) via a toggle flag.

**Key Architecture Principle**: The app seamlessly switches between localStorage and backend API based on `VITE_ENABLE_API` environment variable, using a unified hook interface (`useDateLogHybrid`).

## Commands

### Development
```bash
npm run dev                 # Start dev server (port 5173)
npm run preview            # Preview production build (port 3000)
npm run lint               # Run ESLint
```

### Building
```bash
npm run build              # TypeScript check + production build
npm run build:staging      # Build for staging environment
npm run build:production   # Build for production environment
```

### Testing
```bash
npm test                   # Run all Jest tests
npm test:watch            # Run tests in watch mode
npm test:coverage         # Generate coverage report (80% threshold)
```

### Data Migration
```bash
npm run migrate           # Dry-run: Preview localStorage → backend migration
npm run migrate:execute   # Execute actual data migration
```

## Environment Configuration

The application requires environment variables for **three distinct environments**:

### `.env.development` (Local Development)
- `VITE_API_BASE_URL=http://localhost:3001/v1`
- `VITE_ENABLE_API=false` (uses localStorage)
- `VITE_KAKAO_MAP_API_KEY=<your-key>`

### `.env.staging` (Staging Environment)
- `VITE_API_BASE_URL=https://datelog-backend-staging.onrender.com/v1`
- `VITE_ENABLE_API=true` (uses backend)
- `VITE_KAKAO_MAP_API_KEY=<production-key>`

### `.env.production` (Production Environment)
- `VITE_API_BASE_URL=https://date-log-back.onrender.com/v1`
- `VITE_ENABLE_API=true` (uses backend)
- `VITE_KAKAO_MAP_API_KEY=<production-key>`

**Important**: Copy `.env.example` to create environment files. Never commit actual `.env` files.

## Architecture

### Hybrid Data Layer Pattern

The application uses a **strategy pattern** to switch between localStorage and API implementations:

```
Component
    ↓
useDateLogHybrid (Router)
    ↓
    ├─→ useDateLog (localStorage)      [VITE_ENABLE_API=false]
    └─→ useDateLogAPI (Backend API)    [VITE_ENABLE_API=true]
```

**Key Files**:
- `src/hooks/useDateLogHybrid.ts` - Main routing hook (use this in components)
- `src/hooks/useDateLog.ts` - LocalStorage implementation
- `src/hooks/useDateLogAPI.ts` - Backend API implementation
- `src/services/api/adapter.ts` - Bidirectional data transformation (frontend ↔ backend models)

### Data Model Transformation

The frontend and backend use **different data structures**:

**Frontend Model** (Multi-region per date):
```typescript
DateLog {
  date: "2025-10-18",
  regions: [
    { id, name: "삼송", categories: { cafe[], restaurant[], spot[] } },
    { id, name: "연신내", categories: { cafe[], restaurant[], spot[] } }
  ]
}
```

**Backend Model** (Single region per entry):
```typescript
DateEntry {
  id: UUID,
  date: "2025-10-18",
  region: "삼송",
  cafes: [...],
  restaurants: [...],
  spots: [...]
}
```

The `DateLogAdapter` class (`src/services/api/adapter.ts`) handles all transformations:
- `toFrontendModel()` - Groups multiple DateEntry → single DateLog with multiple regions
- `toBackendCreateRequests()` - Splits DateLog → multiple DateEntry creation requests
- Handles coordinate mapping (lat/lng ↔ latitude/longitude)
- Maps restaurant type enums between Korean strings

### Component Structure

```
src/components/
├── calendar/          # Monthly calendar with date indicators
├── detail/            # Date detail view with place management
├── forms/             # Place add/edit forms
├── map/              # Kakao Maps integration (MapView component)
└── common/           # Shared components (ErrorBoundary, etc.)
```

### Kakao Maps Integration

The app uses `react-kakao-maps-sdk` with initialization in `App.tsx`:

1. **API Key Validation**: App checks for `VITE_KAKAO_MAP_API_KEY` on startup
2. **SDK Loading**: `useKakaoLoader` initializes the SDK with libraries `['services', 'clusterer']`
3. **Error Handling**: Shows user-friendly error screens for missing keys or load failures
4. **Coordinate Parsing**: `utils/coordinateParser.ts` extracts coordinates from Kakao/Naver map URLs

### Path Aliases

TypeScript uses `@/*` alias for `src/*`:
```typescript
import { useDateLogHybrid } from '@/hooks';
import { DateLogAdapter } from '@/services/api/adapter';
```

## Testing Strategy

- **Location**: `src/services/api/__tests__/`
- **Pattern**: `*.test.ts` files in `__tests__` directories
- **Coverage**: 80% threshold for branches, functions, lines, statements
- **Environment**: jsdom (for React component testing)

## Deployment

Deployment is configured for **Render** (not Vercel) with two environments:

### Staging
- **Service**: `datelog-frontend-staging`
- **Build**: `npm run build:staging`
- **Backend**: `datelog-backend-staging.onrender.com`

### Production
- **Service**: `datelog-frontend-production`
- **Branch**: `production`
- **Build**: `npm run build:production`
- **Backend**: `date-log-back.onrender.com`

**Important Configuration**:
- SPA routing requires rewrite: `/* → /index.html`
- Asset caching: `Cache-Control: public, max-age=31536000, immutable`
- CORS: Frontend domain must be whitelisted in backend's `CORS_ORIGIN`
- Kakao Maps: Render domain must be registered at developers.kakao.com

See `render.yaml` for full Blueprint configuration.

## Common Workflows

### Switching Between LocalStorage and API

1. Update `.env.development`:
   ```bash
   VITE_ENABLE_API=false  # Use localStorage
   VITE_ENABLE_API=true   # Use backend API
   ```
2. Restart dev server: `npm run dev`
3. Components using `useDateLogHybrid` automatically switch implementations

### Adding a New Place Category

1. Update type in `src/types/index.ts`:
   ```typescript
   export interface Categories {
     cafe: Cafe[];
     restaurant: Restaurant[];
     spot: Spot[];
     newCategory: NewCategory[];  // Add here
   }
   ```

2. Update backend API types in `src/services/api/types.ts`

3. Add transformation logic in `src/services/api/adapter.ts`:
   - `toFrontendModel()` - backend → frontend
   - `toBackendCreateRequests()` - frontend → backend

### Coordinate Extraction from Map URLs

The app automatically extracts coordinates from Kakao/Naver map links:

```typescript
import { parseMapUrl } from '@/utils/coordinateParser';

const coords = parseMapUrl('https://map.kakao.com/?urlX=495873&urlY=1132273');
// Returns: { lat: 37.123, lng: 127.456 } or undefined
```

Supports:
- Kakao Maps: `urlX`, `urlY`, `q=lat,lng`
- Naver Maps: `lat`, `lng`, `pinType=site`

## Backend Integration

When `VITE_ENABLE_API=true`, the app communicates with a REST API:

### API Endpoints
- `GET /dates` - Fetch all date entries
- `POST /dates` - Create new date entry
- `GET /dates/:id` - Fetch single date entry
- `PUT /dates/:id` - Update date entry
- `DELETE /dates/:id` - Delete date entry

### API Client Features
- Automatic retry (3 attempts with exponential backoff)
- 10-second timeout (configurable via `VITE_API_TIMEOUT`)
- Korean error messages (`src/services/config/api.config.ts`)
- Request/response logging in development

### Data Migration

To migrate existing localStorage data to backend:

```bash
npm run migrate          # Preview migration (dry-run)
npm run migrate:execute  # Execute migration
```

Migration script: `src/scripts/migrate-data.ts`

## Project Status

- ✅ **Phase 1**: Foundation (localStorage, hooks, routing)
- ✅ **Phase 2**: Calendar View
- ✅ **Phase 3**: Detail View with multi-region support
- ✅ **Phase 4**: Kakao Maps integration + Backend API
- 🔄 **Phase 5**: Deployment to Render (configuration complete, awaiting execution)

## Important Notes

- **Korean Language**: UI text, error messages, and region names are in Korean
- **Date Format**: Always use `YYYY-MM-DD` format for date keys
- **Restaurant Types**: Korean categories ('한식', '일식', '중식', '고기집', '양식', '기타', '전체')
- **Mobile-First**: TailwindCSS responsive design with horizontal scrolling for categories
- **No Authentication**: Current version has no user authentication (single-user application)


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