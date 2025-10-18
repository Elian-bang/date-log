import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns';
import { DateCell } from './DateCell';
import { DateLogData } from '@/types';

interface CalendarGridProps {
  currentMonth: Date;
  dateLogData: DateLogData;
  onDateClick: (dateString: string) => void;
  selectedDate?: string; // Currently selected/viewed date
}

/**
 * Calendar Grid Component
 * Displays calendar grid with weekday headers and date cells
 */
export const CalendarGrid = ({
  currentMonth,
  dateLogData,
  onDateClick,
  selectedDate,
}: CalendarGridProps) => {
  // Get first and last day of the month
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);

  // Get calendar start and end (including days from previous/next month)
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);

  // Get all days to display
  const calendarDays = eachDayOfInterval({
    start: calendarStart,
    end: calendarEnd,
  });

  // Weekday headers
  const weekdays = ['일', '월', '화', '수', '목', '금', '토'];

  return (
    <div className="bg-white rounded-lg shadow-md p-2 sm:p-4">
      {/* Weekday Headers */}
      <div className="grid grid-cols-7 gap-0.5 sm:gap-1 mb-1 sm:mb-2">
        {weekdays.map((day, index) => (
          <div
            key={day}
            className={`text-center text-xs sm:text-sm font-semibold py-1 sm:py-2 ${
              index === 0 ? 'text-red-500' : index === 6 ? 'text-blue-500' : 'text-gray-600'
            }`}
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-0.5 sm:gap-1">
        {calendarDays.map((day, index) => (
          <DateCell
            key={index}
            date={day}
            currentMonth={currentMonth}
            dateLogData={dateLogData}
            onClick={onDateClick}
            selectedDate={selectedDate}
          />
        ))}
      </div>
    </div>
  );
};
