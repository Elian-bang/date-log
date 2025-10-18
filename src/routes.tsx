import { createBrowserRouter, Navigate } from 'react-router-dom';
import { MainView } from '@/components/MainView';

/**
 * Application Routes
 * Uses unified MainView with smooth scroll transitions
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
