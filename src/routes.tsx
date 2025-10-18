import { createBrowserRouter, Navigate } from 'react-router-dom';
import { CalendarView } from '@/components/calendar/CalendarView';
import { DateDetailView } from '@/components/detail/DateDetailView';

/**
 * Application Routes
 */

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
    element: <Navigate to="/" replace />,
  },
]);
