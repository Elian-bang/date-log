import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { formatMonthYear } from '@/utils/dateUtils';

interface CalendarHeaderProps {
  currentMonth: Date;
  onPreviousMonth: () => void;
  onNextMonth: () => void;
}

/**
 * Calendar Header Component
 * Displays current month/year with navigation buttons
 */
export const CalendarHeader = ({
  currentMonth,
  onPreviousMonth,
  onNextMonth,
}: CalendarHeaderProps) => {
  return (
    <div className="flex items-center justify-between mb-6 px-2">
      {/* Previous Month Button */}
      <button
        onClick={onPreviousMonth}
        className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        aria-label="Previous month"
      >
        <FiChevronLeft className="w-6 h-6 text-gray-600" />
      </button>

      {/* Current Month Display */}
      <h2 className="text-xl font-bold text-gray-800">
        {formatMonthYear(currentMonth)}
      </h2>

      {/* Next Month Button */}
      <button
        onClick={onNextMonth}
        className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        aria-label="Next month"
      >
        <FiChevronRight className="w-6 h-6 text-gray-600" />
      </button>
    </div>
  );
};
