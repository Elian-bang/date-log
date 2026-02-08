import { useState, useEffect } from 'react';
import { FiX, FiMapPin, FiUpload, FiImage } from 'react-icons/fi';
import { CategoryType, Place, Restaurant, RestaurantType, PlaceFormData, Coordinates } from '@/types';
import { CATEGORY_CONFIG, RESTAURANT_TYPES } from '@/utils/constants';
import { extractCoordinatesFromUrl, validateCoordinates } from '@/utils/coordinateParser';
import {
  uploadImageToCloudinary,
  validateImageFile,
  generatePreviewUrl,
  UploadProgress,
} from '@/utils/cloudinaryUpload';

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
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploadingImage, setUploadingImage] = useState<boolean>(false);

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

  // Handle image file selection
  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    const validation = validateImageFile(file);
    if (!validation.valid) {
      setError(validation.error || '');
      return;
    }

    setImageFile(file);
    setError('');

    // Generate preview
    try {
      const previewUrl = await generatePreviewUrl(file);
      setImagePreview(previewUrl);
    } catch (error) {
      console.error('Failed to generate preview:', error);
    }
  };

  // Upload image to Cloudinary
  const handleImageUpload = async () => {
    if (!imageFile) return;

    setUploadingImage(true);
    setUploadProgress(0);
    setError('');

    try {
      const result = await uploadImageToCloudinary(imageFile, (progress: UploadProgress) => {
        setUploadProgress(progress.percentage);
      });

      setFormData({ ...formData, image: result.url });
      setUploadingImage(false);
      setImageFile(null);
      setImagePreview('');
      setUploadProgress(0);
    } catch (error) {
      setUploadingImage(false);
      setError(error instanceof Error ? error.message : '이미지 업로드 실패');
    }
  };

  // Remove selected image
  const handleRemoveImage = () => {
    setFormData({ ...formData, image: '' });
    setImageFile(null);
    setImagePreview('');
  };

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

          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              이미지 (선택사항)
            </label>

            {/* Current Image or Preview */}
            {(formData.image || imagePreview) && (
              <div className="mb-3 relative">
                <img
                  src={imagePreview || formData.image}
                  alt="Preview"
                  className="w-full h-40 object-cover rounded-lg border border-gray-300"
                />
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                  aria-label="Remove image"
                >
                  <FiX className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Upload Options */}
            {!formData.image && !imagePreview && (
              <div className="space-y-2">
                {/* File Upload */}
                <div>
                  <label
                    htmlFor="image-file"
                    className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary hover:bg-primary/5 transition-colors cursor-pointer"
                  >
                    <FiImage className="w-5 h-5 text-gray-600" />
                    <span className="text-sm text-gray-700">
                      로컬 이미지 선택 (최대 10MB)
                    </span>
                  </label>
                  <input
                    type="file"
                    id="image-file"
                    accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                    onChange={handleImageFileChange}
                    className="hidden"
                  />
                </div>

                {/* URL Input */}
                <div className="relative">
                  <input
                    type="text"
                    id="image-url"
                    value={formData.image}
                    onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                    placeholder="또는 이미지 URL 입력"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
              </div>
            )}

            {/* Selected File Info */}
            {imageFile && !uploadingImage && (
              <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FiImage className="w-4 h-4 text-blue-600" />
                    <span className="text-sm text-blue-900">{imageFile.name}</span>
                    <span className="text-xs text-blue-600">
                      ({(imageFile.size / 1024).toFixed(1)} KB)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleImageUpload}
                    className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                  >
                    <FiUpload className="w-3 h-3" />
                    업로드
                  </button>
                </div>
              </div>
            )}

            {/* Upload Progress */}
            {uploadingImage && (
              <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  <span className="text-sm text-blue-900">업로드 중...</span>
                  <span className="text-sm text-blue-600 font-medium">{uploadProgress}%</span>
                </div>
                <div className="w-full bg-blue-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            <p className="text-xs text-gray-500 mt-1">
              JPG, PNG, GIF, WebP 형식 지원
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
                      ✅ 좌표 확인됨 ({coordinateInfo.coordinates.lat.toFixed(4)}, {coordinateInfo.coordinates.lng.toFixed(4)})
                    </span>
                  </>
                )}
                {coordinateInfo.status === 'failed' && (
                  <>
                    <FiMapPin className="w-3 h-3 text-orange-600" />
                    <span className="text-orange-600">
                      ⚠️ 좌표를 추출할 수 없습니다. 백엔드에서 자동 추출을 시도하거나, 지도에 마커가 표시되지 않을 수 있습니다.
                    </span>
                  </>
                )}
              </div>
            )}

            <div className="mt-1 space-y-1">
              <p className="text-xs text-gray-600 font-medium">
                💡 좌표가 포함된 링크를 입력하세요:
              </p>
              <ul className="text-xs text-gray-500 space-y-0.5 ml-4 list-disc">
                <li>카카오맵: 장소 검색 → 공유 버튼 → "지도 URL 복사"</li>
                <li>네이버 지도: 장소 검색 → 공유 → "링크 복사"</li>
                <li className="text-orange-600">
                  ⚠️ "place.map.kakao.com/[숫자]" 형식은 백엔드에서 자동 변환됩니다
                </li>
              </ul>
            </div>
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
