import { useNavigate } from 'react-router-dom';
import { useDateLog } from '@/hooks/useDateLog';

/**
 * Calendar View Component
 * Displays monthly calendar with date indicators
 * Phase 2 implementation - currently a placeholder
 */

export const CalendarView = () => {
  const navigate = useNavigate();
  const { data, loading } = useDateLog();
  // TODO: Phase 2 - Implement month navigation
  // const [currentMonth, setCurrentMonth] = useState(new Date());

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8 text-primary">
          DateLog Calendar
        </h1>

        <div className="bg-white rounded-lg shadow-md p-6">
          <p className="text-gray-600 text-center">
            Calendar component will be implemented in Phase 2
          </p>
          <p className="text-gray-500 text-center mt-2 text-sm">
            Total dates logged: {Object.keys(data).length}
          </p>

          <button
            onClick={() => navigate('/date/2025-10-18')}
            className="mt-6 w-full bg-primary text-white py-3 px-4 rounded-lg hover:bg-primary-dark transition-colors"
          >
            View Sample Date (2025-10-18)
          </button>
        </div>
      </div>
    </div>
  );
};
