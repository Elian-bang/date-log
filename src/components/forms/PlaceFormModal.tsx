import { useState, useEffect } from 'react';
import { FiX, FiMapPin } from 'react-icons/fi';
import { CategoryType, Place, Restaurant, RestaurantType, PlaceFormData, Coordinates } from '@/types';
import { CATEGORY_CONFIG, RESTAURANT_TYPES } from '@/utils/constants';
import { extractCoordinatesFromUrl, validateCoordinates } from '@/utils/coordinateParser';

interface PlaceFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: PlaceFormData) => void;
  category: CategoryType;
  editingPlace?: Place | Restaurant | null;
}

/**
 * Place Form Modal Component
 * Modal for adding or editing a place
 */
export const PlaceFormModal = ({
  isOpen,
  onClose,
  onSubmit,
  category,
  editingPlace,
}: PlaceFormModalProps) => {
  const config = CATEGORY_CONFIG[category];
  const isEditing = !!editingPlace;

  const [formData, setFormData] = useState<PlaceFormData>({
    name: '',
    boyfriendMemo: '',
    girlfriendMemo: '',
    image: '',
    link: '',
    coordinates: undefined,
    type: '한식',
  });
  const [error, setError] = useState('');
  const [coordinateInfo, setCoordinateInfo] = useState<{
    status: 'none' | 'extracting' | 'success' | 'failed';
    coordinates?: Coordinates;
  }>({ status: 'none' });

  // Populate form when editing
  useEffect(() => {
    if (editingPlace) {
      const coords = editingPlace.coordinates;
      setFormData({
        name: editingPlace.name,
        boyfriendMemo: editingPlace.boyfriendMemo || '',
        girlfriendMemo: editingPlace.girlfriendMemo || '',
        image: editingPlace.image || '',
        link: editingPlace.link,
        coordinates: coords,
        type: (editingPlace as Restaurant).type || '한식',
      });
      if (coords && validateCoordinates(coords)) {
        setCoordinateInfo({ status: 'success', coordinates: coords });
      }
    } else {
      setFormData({
        name: '',
        boyfriendMemo: '',
        girlfriendMemo: '',
        image: '',
        link: '',
        coordinates: undefined,
        type: '한식',
      });
      setCoordinateInfo({ status: 'none' });
    }
  }, [editingPlace]);

  // Extract coordinates when link changes
  useEffect(() => {
    if (!formData.link || !formData.link.trim()) {
      setCoordinateInfo({ status: 'none' });
      return;
    }

    setCoordinateInfo({ status: 'extracting' });

    // Debounce coordinate extraction
    const timer = setTimeout(() => {
      const coords = extractCoordinatesFromUrl(formData.link);
      if (coords && validateCoordinates(coords)) {
        setFormData((prev) => ({ ...prev, coordinates: coords }));
        setCoordinateInfo({ status: 'success', coordinates: coords });
      } else {
        setFormData((prev) => ({ ...prev, coordinates: undefined }));
        setCoordinateInfo({ status: 'failed' });
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [formData.link]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.name.trim()) {
      setError('상호명을 입력해주세요.');
      return;
    }

    if (!formData.link.trim()) {
      setError('지도 링크를 입력해주세요.');
      return;
    }

    // Submit
    onSubmit(formData);

    // Reset and close
    setFormData({
      name: '',
      boyfriendMemo: '',
      girlfriendMemo: '',
      image: '',
      link: '',
      coordinates: undefined,
      type: '한식',
    });
    setError('');
    setCoordinateInfo({ status: 'none' });
    onClose();
  };

  const handleClose = () => {
    setFormData({
      name: '',
      boyfriendMemo: '',
      girlfriendMemo: '',
      image: '',
      link: '',
      coordinates: undefined,
      type: '한식',
    });
    setError('');
    setCoordinateInfo({ status: 'none' });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full my-8">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <span>{config.icon}</span>
            <span>
              {isEditing ? `${config.label} 수정` : `${config.label} 추가`}
            </span>
          </h3>
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
          {/* Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              상호명 *
            </label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="예: 나무사이로 카페"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              required
            />
          </div>

          {/* Restaurant Type */}
          {category === 'restaurant' && (
            <div>
              <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
                음식 종류 *
              </label>
              <select
                id="type"
                value={formData.type}
                onChange={(e) =>
                  setFormData({ ...formData, type: e.target.value as RestaurantType })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                {RESTAURANT_TYPES.filter((t) => t !== '전체').map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Boyfriend Memo */}
          <div>
            <label htmlFor="boyfriendMemo" className="block text-sm font-medium text-gray-700 mb-1">
              💙 남자친구 메모
            </label>
            <textarea
              id="boyfriendMemo"
              value={formData.boyfriendMemo}
              onChange={(e) => setFormData({ ...formData, boyfriendMemo: e.target.value })}
              placeholder="예: 음식이 맛있어요"
              rows={2}
              maxLength={200}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
            />
          </div>

          {/* Girlfriend Memo */}
          <div>
            <label htmlFor="girlfriendMemo" className="block text-sm font-medium text-gray-700 mb-1">
              💗 여자친구 메모
            </label>
            <textarea
              id="girlfriendMemo"
              value={formData.girlfriendMemo}
              onChange={(e) => setFormData({ ...formData, girlfriendMemo: e.target.value })}
              placeholder="예: 분위기 좋은 창가 자리 있음"
              rows={2}
              maxLength={200}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
            />
          </div>

          {/* Image URL */}
          <div>
            <label htmlFor="image" className="block text-sm font-medium text-gray-700 mb-1">
              이미지 URL
            </label>
            <input
              type="text"
              id="image"
              value={formData.image}
              onChange={(e) => setFormData({ ...formData, image: e.target.value })}
              placeholder="예: /images/cafe1.jpg 또는 https://..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">
              선택사항: 이미지 URL을 입력하세요
            </p>
          </div>

          {/* Map Link */}
          <div>
            <label htmlFor="link" className="block text-sm font-medium text-gray-700 mb-1">
              지도 링크 *
            </label>
            <input
              type="url"
              id="link"
              value={formData.link}
              onChange={(e) => setFormData({ ...formData, link: e.target.value })}
              placeholder="https://map.naver.com/ 또는 https://place.map.kakao.com/"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              required
            />

            {/* Coordinate Status */}
            {coordinateInfo.status !== 'none' && (
              <div className="mt-2 flex items-center gap-2 text-xs">
                {coordinateInfo.status === 'extracting' && (
                  <>
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary"></div>
                    <span className="text-gray-600">좌표 추출 중...</span>
                  </>
                )}
                {coordinateInfo.status === 'success' && coordinateInfo.coordinates && (
                  <>
                    <FiMapPin className="w-3 h-3 text-green-600" />
                    <span className="text-green-600">
                      좌표 확인됨 ({coordinateInfo.coordinates.lat.toFixed(4)}, {coordinateInfo.coordinates.lng.toFixed(4)})
                    </span>
                  </>
                )}
                {coordinateInfo.status === 'failed' && (
                  <>
                    <FiMapPin className="w-3 h-3 text-orange-600" />
                    <span className="text-orange-600">
                      좌표를 추출할 수 없습니다. 지도에 마커가 표시되지 않을 수 있습니다.
                    </span>
                  </>
                )}
              </div>
            )}

            <p className="text-xs text-gray-500 mt-1">
              네이버 지도 또는 카카오맵 링크를 입력하면 자동으로 좌표가 추출됩니다
            </p>
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
              {isEditing ? '수정' : '추가'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
