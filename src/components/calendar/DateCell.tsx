import { format, isSameMonth } from 'date-fns';
import { isToday, formatDateForStorage, hasLogData } from '@/utils/dateUtils';
import { DateLogData } from '@/types';

interface DateCellProps {
  date: Date;
  currentMonth: Date;
  dateLogData: DateLogData;
  onClick: (dateString: string) => void;
  selectedDate?: string; // Currently selected/viewed date
}

/**
 * Date Cell Component
 * Individual calendar cell with date number and indicator
 */
export const DateCell = ({
  date,
  currentMonth,
  dateLogData,
  onClick,
  selectedDate,
}: DateCellProps) => {
  const dayNumber = format(date, 'd');
  const isCurrentMonth = isSameMonth(date, currentMonth);
  const isTodayDate = isToday(date);
  const hasLog = hasLogData(date, dateLogData);
  const dateString = formatDateForStorage(date);
  const isSelected = selectedDate === dateString;

  const handleClick = () => {
    if (isCurrentMonth) {
      onClick(dateString);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={!isCurrentMonth}
      className={`
        relative aspect-square p-1 sm:p-2 rounded-md sm:rounded-lg transition-all min-h-[44px] sm:min-h-0
        ${isCurrentMonth ? 'hover:bg-gray-100 active:bg-gray-200 cursor-pointer' : 'cursor-default'}
        ${isSelected ? 'bg-primary bg-opacity-20 font-bold' : isTodayDate ? 'bg-primary-light bg-opacity-20 font-bold' : ''}
        ${!isCurrentMonth ? 'text-gray-300' : 'text-gray-800'}
      `}
      aria-label={`${format(date, 'MMMM d, yyyy')}${hasLog ? ' - has log' : ''}${isSelected ? ' - selected' : ''}`}
    >
      {/* Date Number */}
      <span className="text-xs sm:text-sm md:text-base">{dayNumber}</span>

      {/* Dot Indicator */}
      {hasLog && isCurrentMonth && (
        <div className="absolute bottom-0.5 sm:bottom-1 left-1/2 transform -translate-x-1/2">
          <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-primary"></div>
        </div>
      )}

      {/* Selected Date Ring */}
      {isSelected && isCurrentMonth && (
        <div className="absolute inset-0 border-2 border-primary rounded-md sm:rounded-lg pointer-events-none"></div>
      )}

      {/* Today Ring (only if not selected) */}
      {isTodayDate && !isSelected && isCurrentMonth && (
        <div className="absolute inset-0 border-2 border-primary-light rounded-md sm:rounded-lg pointer-events-none"></div>
      )}
    </button>
  );
};
