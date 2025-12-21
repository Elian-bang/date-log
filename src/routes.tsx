import { createBrowserRouter, Navigate } from 'react-router-dom';
import MainView from '@/components/MainView';

/**
 * Application Routes
 * Direct import of MainView (React.lazy removed to fix React Error #310)
 *
 * Note: Code splitting removed to ensure stable hook call order
 * between useKakaoLoader (App.tsx) and component rendering.
 * MainView has its own loading state, so external fallback is unnecessary.
 */

export const router = createBrowserRouter([
  {
    path: '/',
    element: <MainView />,
  },
  {
    path: '/date/:dateId',
    element: <MainView />,
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);
