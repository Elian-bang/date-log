# DateLog - 데이트 코스 기록 서비스

A frontend-only web application for logging and managing date course records with calendar view, place management, and map integration.

## Features

- 📅 Monthly calendar view with date indicators
- 📝 Date-based place logging (cafes, restaurants, tourist spots)
- 🗺️ Map integration with location markers
- 💾 localStorage-based data persistence
- 📱 Mobile-responsive design
- 🎨 Modern UI with TailwindCSS

## Tech Stack

- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: TailwindCSS
- **Routing**: React Router v6
- **Date Utilities**: date-fns
- **Icons**: React Icons

## Project Structure

```
my-date-log/
├── public/
│   └── data/
│       └── courses.json          # Initial seed data
├── src/
│   ├── components/
│   │   ├── calendar/             # Calendar view components
│   │   ├── detail/               # Date detail view components
│   │   └── common/               # Shared components
│   ├── hooks/
│   │   ├── useLocalStorage.ts    # localStorage hook
│   │   └── useDateLog.ts         # Main data management hook
│   ├── types/
│   │   └── index.ts              # TypeScript interfaces
│   ├── utils/
│   │   ├── constants.ts          # App constants
│   │   ├── dataSync.ts           # Data sync utilities
│   │   └── dateUtils.ts          # Date formatting utilities
│   ├── App.tsx
│   ├── main.tsx
│   └── routes.tsx
├── package.json
├── tsconfig.json
├── vite.config.ts
└── tailwind.config.js
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start development server:
```bash
npm run dev
```

3. Build for production:
```bash
npm run build
```

4. Preview production build:
```bash
npm run preview
```

## Development Phases

### ✅ Phase 1: Foundation (Complete)
- Project setup and configuration
- TypeScript interfaces and data structures
- Data layer and localStorage sync
- Custom hooks (useLocalStorage, useDateLog)
- Routing setup with placeholders

### ✅ Phase 2: Calendar View (Complete)
- Calendar component implementation
- Month navigation
- Date cell with indicators
- Add new date functionality

### ✅ Phase 3: Detail View (Complete)
- Date detail layout
- Place management (CRUD operations)
- Category sections with horizontal scroll
- Add/Edit/Delete forms
- Multi-region support

### 🔄 Phase 4: Map Integration (In Progress)
- Kakao Maps SDK integration
- Basic map component (MapView)
- Marker display for places
- Location visualization

### 🚀 Phase 5: Polish & Deploy (Next)
- Performance optimization
- Accessibility improvements
- Production deployment
- Testing and bug fixes

## Data Structure

The application uses localStorage to persist data. Data structure follows this format:

```typescript
{
  "2025-10-18": {
    "date": "2025-10-18",
    "region": "삼송",
    "categories": {
      "cafe": [{ id, name, memo, image, link, visited, coordinates }],
      "restaurant": [{ id, name, type, memo, image, link, visited, coordinates }],
      "spot": [{ id, name, memo, image, link, visited, coordinates }]
    }
  }
}
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Browser Support

- Chrome/Edge: Last 2 versions
- Safari: Last 2 versions
- Firefox: Last 2 versions
- Mobile Safari: iOS 13+
- Chrome Android: Last 2 versions

## License

Private project

## Development Timeline

- **Week 1 (Phase 1)**: Foundation - ✅ Complete
- **Week 2 (Phase 2)**: Calendar View
- **Week 3 (Phase 3)**: Detail View
- **Week 4 (Phase 4)**: Map Integration
- **Week 5 (Phase 5)**: Polish & Deploy

---

Built with ❤️ using React + TypeScript + Vite
