# Services Module

API client and data transformation services for backend integration.

## 📁 Structure

```
services/
├── api/
│   ├── client.ts          # HTTP client for backend API
│   ├── adapter.ts         # Data transformation adapter
│   ├── types.ts           # API type definitions
│   ├── index.ts           # Barrel exports
│   └── __tests__/
│       └── adapter.test.ts
└── config/
    └── api.config.ts      # API configuration
```

## 🚀 Quick Start

### Import API Client
```typescript
import { apiClient } from './services/api';

// Fetch all date entries
const entries = await apiClient.getDateEntries();

// Create a new date entry
const newEntry = await apiClient.createDateEntry({
  date: '2025-10-18',
  region: '삼송',
});
```

### Import Adapter
```typescript
import { DateLogAdapter } from './services/api';

// Transform backend data to frontend format
const frontendData = DateLogAdapter.toFrontendModel(backendEntries);

// Transform frontend data for backend creation
const requests = DateLogAdapter.toBackendCreateRequests(dateLog);
```

## 📖 API Client

### Configuration
Environment variables (`.env.development` or `.env.production`):
```env
VITE_API_BASE_URL=http://localhost:3001/v1
VITE_API_TIMEOUT=10000
VITE_ENABLE_API=false
```

### Features
- ✅ Automatic timeout handling (10 seconds default)
- ✅ Retry logic with exponential backoff (3 attempts)
- ✅ Korean error messages
- ✅ Type-safe API methods
- ✅ Request/response interceptors ready

### Error Handling
```typescript
import { ApiClientError } from './services/api';

try {
  const data = await apiClient.getDateByDate('2025-10-18');
} catch (error) {
  if (error instanceof ApiClientError) {
    console.error(error.message); // Korean error message
    console.error(error.code);    // Error code
  }
}
```

## 🔄 Data Adapter

### Backend → Frontend Transformation
```typescript
// Backend: Array of single-region DateEntries
const backendEntries: DateEntryResponse[] = [
  { date: '2025-10-18', region: '삼송', cafes: [...], ... },
  { date: '2025-10-18', region: '은평', cafes: [...], ... },
];

// Frontend: Multi-region structure grouped by date
const frontendData = DateLogAdapter.toFrontendModel(backendEntries);
// Result: { '2025-10-18': { date: '2025-10-18', regions: [삼송, 은평] } }
```

### Frontend → Backend Transformation
```typescript
// Frontend: Multi-region DateLog
const dateLog = {
  date: '2025-10-18',
  regions: [
    { name: '삼송', categories: {...} },
    { name: '은평', categories: {...} },
  ],
};

// Backend: Array of single-region creation requests
const requests = DateLogAdapter.toBackendCreateRequests(dateLog);
// Result: [{ date: '2025-10-18', region: '삼송' }, { date: '2025-10-18', region: '은평' }]
```

### Coordinate Transformation
```typescript
// Backend: latitude/longitude
{ latitude: 37.6790, longitude: 126.9125 }

// Frontend: lat/lng
{ coordinates: { lat: 37.6790, lng: 126.9125 } }
```

### Utility Methods
```typescript
// Get all unique regions
const regions = DateLogAdapter.getUniqueRegions(dateLogData);
// ['삼송', '은평', '강남']

// Find DateEntry ID
const id = DateLogAdapter.findDateEntryId(data, '2025-10-18', '삼송');

// Merge data
const merged = DateLogAdapter.mergeDateLogData(existing, newEntries);
```

## 🧪 Testing

### Run Tests
```bash
npm test              # Run all tests
npm run test:watch    # Watch mode
npm run test:coverage # Coverage report
```

### Coverage
- Adapter: 94.73% statements, 90.47% functions
- Types: 100% coverage
- 17 test cases, all passing

## 📚 Type Definitions

### API Response Types
```typescript
interface ApiResponse<T> {
  data: T;
  meta?: PaginationMeta;
  links?: { self?, next?, prev? };
}

interface ApiError {
  code: string;
  message: string;
  details?: string | Record<string, unknown>;
  timestamp: string;
}
```

### Date Entry Types
```typescript
interface DateEntryResponse {
  id: string;
  date: string;
  region: string;
  cafes: CafeResponse[];
  restaurants: RestaurantResponse[];
  spots: SpotResponse[];
  createdAt: string;
  updatedAt: string;
}
```

## 🔧 Development

### Adding New API Endpoints

1. **Add types in `api/types.ts`**
```typescript
export interface NewFeatureRequest {
  // fields
}

export interface NewFeatureResponse {
  // fields
}
```

2. **Add method in `api/client.ts`**
```typescript
async getNewFeature(id: string): Promise<NewFeatureResponse> {
  return this.get<NewFeatureResponse>(`/new-feature/${id}`);
}
```

3. **Export in `api/index.ts`**
```typescript
export type { NewFeatureRequest, NewFeatureResponse } from './types';
```

### Adding Transformation Logic

Add methods in `api/adapter.ts`:
```typescript
static toFrontendNewFeature(response: NewFeatureResponse): FrontendType {
  // transformation logic
}
```

## ⚠️ Important Notes

1. **API Currently Disabled**
   - `VITE_ENABLE_API=false` in development
   - Will be enabled in Phase 2

2. **Restaurant Type Mapping**
   - Frontend '양식' → Backend '전체'
   - Backend doesn't have '양식' type

3. **Error Messages**
   - All user-facing errors in Korean
   - Technical details in error.details

## 📖 Related Documentation

- [Phase 1 Implementation Summary](../../PHASE1_IMPLEMENTATION_SUMMARY.md)
- [Implementation Workflow](../../IMPLEMENTATION_WORKFLOW.md)
- [Backend API Specification](../../date-log-server/docs/FRONTEND_INTEGRATION.md)
