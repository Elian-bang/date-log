import { useParams, useNavigate } from 'react-router-dom';
import { useDateLog } from '@/hooks/useDateLog';
import { formatDateForDisplay } from '@/utils/dateUtils';

/**
 * Date Detail View Component
 * Displays date details with place management
 * Phase 3 implementation - currently a placeholder
 */

export const DateDetailView = () => {
  const { dateId } = useParams<{ dateId: string }>();
  const navigate = useNavigate();
  const { getDateLog, loading } = useDateLog();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!dateId) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-red-500">Invalid date</div>
      </div>
    );
  }

  const dateLog = getDateLog(dateId);

  if (!dateLog) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="text-lg text-gray-600 mb-4">No data for this date</div>
        <button
          onClick={() => navigate('/')}
          className="bg-primary text-white py-2 px-6 rounded-lg hover:bg-primary-dark transition-colors"
        >
          Back to Calendar
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate('/')}
            className="text-primary hover:text-primary-dark"
          >
            ← Back
          </button>
          <h1 className="text-2xl font-bold">
            {formatDateForDisplay(dateLog.date)}
          </h1>
          <div className="text-lg text-gray-600">{dateLog.region}</div>
        </div>

        {/* Placeholder content */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <p className="text-gray-600 text-center">
            Date detail view will be implemented in Phase 3
          </p>

          <div className="mt-6 space-y-2 text-sm text-gray-500">
            <p>Cafes: {dateLog.categories.cafe.length}</p>
            <p>Restaurants: {dateLog.categories.restaurant.length}</p>
            <p>Spots: {dateLog.categories.spot.length}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
