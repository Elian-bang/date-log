import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiPlus } from 'react-icons/fi';
import { useDateLogHybrid } from '@/hooks';
import { LoadingSpinner, ErrorMessage } from '@/components/common';
import { getPreviousMonth, getNextMonth } from '@/utils/dateUtils';
import { CalendarHeader } from './CalendarHeader';
import { CalendarGrid } from './CalendarGrid';
import { AddDateModal } from './AddDateModal';

/**
 * Calendar View Component
 * Main calendar interface with month navigation and date selection
 */
export const CalendarView = () => {
  const navigate = useNavigate();
  const { data, loading, error, addDate, refreshData, clearError } = useDateLogHybrid();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Month navigation handlers
  const handlePreviousMonth = () => {
    setCurrentMonth(getPreviousMonth(currentMonth));
  };

  const handleNextMonth = () => {
    setCurrentMonth(getNextMonth(currentMonth));
  };

  // Date click handler
  const handleDateClick = (dateString: string) => {
    // If date has log, navigate to detail view
    if (data[dateString]) {
      navigate(`/date/${dateString}`);
    } else {
      // If no log, open add modal with this date pre-selected
      setIsAddModalOpen(true);
    }
  };

  // Add new date handler
  const handleAddDate = async (date: string, region: string) => {
    try {
      await addDate(date, region);
      // Navigate to the newly created date
      navigate(`/date/${date}`);
    } catch (err) {
      // Error is handled by the hook, but we can add additional logic here if needed
      console.error('Failed to add date:', err);
    }
  };

  // Loading state
  if (loading) {
    return <LoadingSpinner message="데이트 기록을 불러오는 중..." fullScreen />;
  }

  // Error state
  if (error) {
    return (
      <ErrorMessage
        message={error}
        onRetry={refreshData}
        onDismiss={clearError}
        variant="error"
        fullScreen
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-primary text-center">
            DateLog
          </h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Stats */}
        <div className="mb-6 text-center">
          <p className="text-gray-600">
            총 <span className="font-bold text-primary">{Object.keys(data).length}</span>개의 데이트 기록
          </p>
        </div>

        {/* Calendar Header */}
        <CalendarHeader
          currentMonth={currentMonth}
          onPreviousMonth={handlePreviousMonth}
          onNextMonth={handleNextMonth}
        />

        {/* Calendar Grid */}
        <CalendarGrid
          currentMonth={currentMonth}
          dateLogData={data}
          onDateClick={handleDateClick}
        />

        {/* Add Date Button */}
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="fixed bottom-6 right-6 bg-primary text-white p-4 rounded-full shadow-lg hover:bg-primary-dark transition-all hover:scale-110 flex items-center justify-center"
          aria-label="Add new date"
        >
          <FiPlus className="w-6 h-6" />
        </button>
      </main>

      {/* Add Date Modal */}
      <AddDateModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddDate={handleAddDate}
        existingDates={Object.keys(data)}
      />
    </div>
  );
};
