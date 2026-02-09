import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { formatMonthYear } from '@/utils/dateUtils';

interface CalendarHeaderProps {
  currentMonth: Date;
  onPreviousMonth: () => void;
  onNextMonth: () => void;
  loading?: boolean;
}

/**
 * Calendar Header Component
 * Displays current month/year with navigation buttons
 */
export const CalendarHeader = ({
  currentMonth,
  onPreviousMonth,
  onNextMonth,
  loading = false,
}: CalendarHeaderProps) => {
  return (
    <div className="flex items-center justify-between mb-6 px-2">
      {/* Previous Month Button */}
      <button
        onClick={onPreviousMonth}
        className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        aria-label="Previous month"
        disabled={loading}
      >
        <FiChevronLeft className="w-6 h-6 text-gray-600" />
      </button>

      {/* Current Month Display with Loading Indicator */}
      <div className="flex items-center gap-2">
        <h2 className="text-xl font-bold text-gray-800">
          {formatMonthYear(currentMonth)}
        </h2>
        {loading && (
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent" />
        )}
      </div>

      {/* Next Month Button */}
      <button
        onClick={onNextMonth}
        className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        aria-label="Next month"
        disabled={loading}
      >
        <FiChevronRight className="w-6 h-6 text-gray-600" />
      </button>
    </div>
  );
};
