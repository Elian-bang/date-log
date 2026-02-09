import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiPlus, FiArrowUp } from 'react-icons/fi';
import { useDateLogHybrid } from '@/hooks';
import { getPreviousMonth, getNextMonth } from '@/utils/dateUtils';
import { throttle } from '@/utils/performance';
import { CalendarHeader } from './calendar/CalendarHeader';
import { CalendarGrid } from './calendar/CalendarGrid';
import { AddDateModal } from './calendar/AddDateModal';
import { DateDetailView } from './detail/DateDetailView';

/**
 * Main View Component
 * Unified view with smooth scroll transitions between calendar and detail sections
 */
const MainView = () => {
  const { dateId } = useParams<{ dateId?: string }>();
  const navigate = useNavigate();
  const { data, loading, addDate, loadMonthData } = useDateLogHybrid();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedDateForModal, setSelectedDateForModal] = useState<string | undefined>(undefined);
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Refs for scroll sections
  const calendarSectionRef = useRef<HTMLDivElement>(null);
  const detailSectionRef = useRef<HTMLDivElement>(null);

  // Scroll to detail section when dateId changes
  useEffect(() => {
    if (dateId && detailSectionRef.current) {
      detailSectionRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    } else if (!dateId && calendarSectionRef.current) {
      calendarSectionRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  }, [dateId]);

  // Handle scroll to show/hide scroll-to-top button (throttled for performance)
  useEffect(() => {
    const handleScroll = throttle(() => {
      setShowScrollTop(window.scrollY > 400);
    }, 100); // Throttle to 100ms (10 times per second max)

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Load month data when currentMonth changes
  useEffect(() => {
    if (loadMonthData) {
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth() + 1; // 0-indexed, so add 1
      loadMonthData(year, month);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentMonth]); // Only depend on currentMonth to prevent infinite loop

  // Month navigation handlers
  const handlePreviousMonth = useCallback(() => {
    setCurrentMonth(prev => getPreviousMonth(prev));
  }, []);

  const handleNextMonth = useCallback(() => {
    setCurrentMonth(prev => getNextMonth(prev));
  }, []);

  // Date click handler
  const handleDateClick = useCallback((dateString: string) => {
    if (data[dateString]) {
      navigate(`/date/${dateString}`);
    } else {
      setSelectedDateForModal(dateString);
      setIsAddModalOpen(true);
    }
  }, [data, navigate]);

  // Add new date handler
  const handleAddDate = useCallback((date: string, region: string) => {
    addDate(date, region);
    // Wait for state update to complete before navigating
    setTimeout(() => {
      navigate(`/date/${date}`);
    }, 0);
  }, [addDate, navigate]);

  // Scroll to calendar section
  const scrollToCalendar = useCallback(() => {
    navigate('/');
  }, [navigate]);

  // Scroll to top
  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Calendar Section */}
      <section ref={calendarSectionRef}>
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-20">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <h1 className="text-2xl font-bold text-primary text-center">
              DateLog
            </h1>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-4xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
          {/* Stats */}
          <div className="mb-4 sm:mb-6 text-center">
            <p className="text-sm sm:text-base text-gray-600">
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
            selectedDate={dateId}
          />

          {/* Add Date Button */}
          <button
            onClick={() => {
              setSelectedDateForModal(undefined);
              setIsAddModalOpen(true);
            }}
            className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 bg-primary text-white p-3 sm:p-4 rounded-full shadow-lg hover:bg-primary-dark transition-all hover:scale-110 active:scale-95 flex items-center justify-center z-30 min-w-[56px] min-h-[56px]"
            aria-label="Add new date"
          >
            <FiPlus className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </main>
      </section>

      {/* Detail Section */}
      {dateId && (
        <section ref={detailSectionRef}>
          <DateDetailView onBackToCalendar={scrollToCalendar} />
        </section>
      )}

      {/* Scroll to Top Button */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-4 left-4 sm:bottom-6 sm:left-6 bg-gray-800 text-white p-3 rounded-full shadow-lg hover:bg-gray-700 transition-all hover:scale-110 active:scale-95 flex items-center justify-center z-30 min-w-[56px] min-h-[56px]"
          aria-label="Scroll to top"
        >
          <FiArrowUp className="w-5 h-5" />
        </button>
      )}

      {/* Add Date Modal */}
      <AddDateModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setSelectedDateForModal(undefined);
        }}
        onAddDate={handleAddDate}
        existingDates={Object.keys(data)}
        initialDate={selectedDateForModal}
      />
    </div>
  );
};

export default MainView;
