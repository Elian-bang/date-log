import { useState, useEffect } from 'react';
import { FiX } from 'react-icons/fi';
import { getTodayStorageFormat } from '@/utils/dateUtils';

interface AddDateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddDate: (date: string, region: string) => void;
  existingDates: string[];
  initialDate?: string; // Optional: pre-select a specific date
}

/**
 * Add Date Modal Component
 * Modal for adding a new date log entry
 */
export const AddDateModal = ({
  isOpen,
  onClose,
  onAddDate,
  existingDates,
  initialDate,
}: AddDateModalProps) => {
  const [selectedDate, setSelectedDate] = useState(initialDate || getTodayStorageFormat());
  const [region, setRegion] = useState('');
  const [error, setError] = useState('');

  // Update selected date when initialDate changes or modal opens
  useEffect(() => {
    if (isOpen && initialDate) {
      setSelectedDate(initialDate);
    }
  }, [isOpen, initialDate]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!selectedDate) {
      setError('날짜를 선택해주세요.');
      return;
    }

    if (!region.trim()) {
      setError('동네 이름을 입력해주세요.');
      return;
    }

    if (existingDates.includes(selectedDate)) {
      setError('이미 등록된 날짜입니다.');
      return;
    }

    // Submit
    onAddDate(selectedDate, region.trim());

    // Reset and close
    setSelectedDate(getTodayStorageFormat());
    setRegion('');
    setError('');
    onClose();
  };

  const handleClose = () => {
    setSelectedDate(getTodayStorageFormat());
    setRegion('');
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-bold text-gray-800">새 날짜 추가</h3>
          <button
            onClick={handleClose}
            className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Close modal"
          >
            <FiX className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Date Input */}
          <div>
            <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
              날짜
            </label>
            <input
              type="date"
              id="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              required
            />
          </div>

          {/* Region Input */}
          <div>
            <label htmlFor="region" className="block text-sm font-medium text-gray-700 mb-1">
              동네
            </label>
            <input
              type="text"
              id="region"
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              placeholder="예: 홍대, 강남, 삼송"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              required
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
            >
              추가
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
