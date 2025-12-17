import { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';

/**
 * Application Routes
 * Uses unified MainView with smooth scroll transitions
 * Implements code splitting with React.lazy for performance optimization
 */

// Lazy load MainView for code splitting
const MainView = lazy(() => import('@/components/MainView'));

// Loading fallback component
const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen bg-gray-50">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
      <p className="text-gray-600">페이지를 불러오는 중...</p>
    </div>
  </div>
);

export const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <Suspense fallback={<LoadingFallback />}>
        <MainView />
      </Suspense>
    ),
  },
  {
    path: '/date/:dateId',
    element: (
      <Suspense fallback={<LoadingFallback />}>
        <MainView />
      </Suspense>
    ),
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);
