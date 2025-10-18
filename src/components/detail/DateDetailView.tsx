import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { FiArrowLeft, FiPlus } from 'react-icons/fi';
import { useDateLog } from '@/hooks/useDateLog';
import { formatDateForDisplay } from '@/utils/dateUtils';
import { CategoryType, PlaceFormData, Place, Restaurant } from '@/types';
import { RegionSection } from './RegionSection';
import { PlaceFormModal } from '../forms/PlaceFormModal';

interface DateDetailViewProps {
  onBackToCalendar?: () => void;
}

/**
 * Date Detail View Component
 * Displays date details with multi-region support and place management
 */
export const DateDetailView = ({ onBackToCalendar }: DateDetailViewProps) => {
  const { dateId } = useParams<{ dateId: string }>();
  const {
    getDateLog,
    addRegion,
    updateRegionName,
    deleteRegion,
    addPlace,
    updatePlace,
    deletePlace,
    toggleVisited,
    loading,
  } = useDateLog();

  const [isPlaceFormOpen, setIsPlaceFormOpen] = useState(false);
  const [currentRegionId, setCurrentRegionId] = useState<string>('');
  const [currentCategory, setCurrentCategory] = useState<CategoryType>('cafe');
  const [editingPlace, setEditingPlace] = useState<Place | Restaurant | null>(null);
  const [isAddRegionOpen, setIsAddRegionOpen] = useState(false);
  const [newRegionName, setNewRegionName] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<{
    regionId: string;
    category: CategoryType;
    placeId: string;
  } | null>(null);
  const [deleteRegionConfirm, setDeleteRegionConfirm] = useState<string | null>(null);

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

  if (!dateId) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-lg text-red-500">Invalid date</div>
      </div>
    );
  }

  const dateLog = getDateLog(dateId);

  if (!dateLog) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
        <div className="text-lg text-gray-600 mb-4">No data for this date</div>
        <button
          onClick={onBackToCalendar || (() => window.history.back())}
          className="flex items-center gap-2 px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
        >
          <FiArrowLeft />
          <span>Back to Calendar</span>
        </button>
      </div>
    );
  }

  // Place CRUD handlers
  const handleAddPlace = (regionId: string, category: CategoryType) => {
    setCurrentRegionId(regionId);
    setCurrentCategory(category);
    setEditingPlace(null);
    setIsPlaceFormOpen(true);
  };

  const handleEditPlace = (regionId: string, category: CategoryType, placeId: string) => {
    const region = dateLog.regions.find((r) => r.id === regionId);
    if (!region) return;

    const place = region.categories[category].find((p) => p.id === placeId);
    if (place) {
      setCurrentRegionId(regionId);
      setCurrentCategory(category);
      setEditingPlace(place);
      setIsPlaceFormOpen(true);
    }
  };

  const handleDeletePlace = (regionId: string, category: CategoryType, placeId: string) => {
    setDeleteConfirm({ regionId, category, placeId });
  };

  const confirmDeletePlace = () => {
    if (deleteConfirm) {
      deletePlace(dateId, deleteConfirm.regionId, deleteConfirm.category, deleteConfirm.placeId);
      setDeleteConfirm(null);
    }
  };

  const handlePlaceFormSubmit = (data: PlaceFormData) => {
    if (editingPlace) {
      // Update existing place
      updatePlace(dateId, currentRegionId, currentCategory, editingPlace.id, {
        name: data.name,
        memo: data.memo,
        image: data.image,
        link: data.link,
        ...(currentCategory === 'restaurant' && { type: data.type }),
      });
    } else {
      // Add new place
      addPlace(dateId, currentRegionId, currentCategory, {
        name: data.name,
        memo: data.memo,
        image: data.image,
        link: data.link,
        visited: false,
        ...(currentCategory === 'restaurant' && { type: data.type! }),
      });
    }
  };

  // Region management handlers
  const handleAddRegion = () => {
    if (newRegionName.trim()) {
      addRegion(dateId, newRegionName.trim());
      setNewRegionName('');
      setIsAddRegionOpen(false);
    }
  };

  const handleDeleteRegion = (regionId: string) => {
    setDeleteRegionConfirm(regionId);
  };

  const confirmDeleteRegion = () => {
    if (deleteRegionConfirm) {
      deleteRegion(dateId, deleteRegionConfirm);
      setDeleteRegionConfirm(null);
    }
  };

  // Calculate total regions and places
  const totalRegions = dateLog.regions.length;
  const totalPlaces = dateLog.regions.reduce(
    (sum, region) =>
      sum +
      region.categories.cafe.length +
      region.categories.restaurant.length +
      region.categories.spot.length,
    0
  );

  return (
    <div className="bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={onBackToCalendar || (() => window.history.back())}
              className="flex items-center gap-2 text-primary hover:text-primary-dark transition-colors"
            >
              <FiArrowLeft className="w-5 h-5" />
              <span className="font-medium">Calendar</span>
            </button>

            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-800">
                {formatDateForDisplay(dateLog.date)}
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                {totalRegions}개 지역 · {totalPlaces}개 장소
              </p>
            </div>

            <button
              onClick={() => setIsAddRegionOpen(true)}
              className="flex items-center gap-1 px-3 py-2.5 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors text-sm min-h-[44px]"
            >
              <FiPlus className="w-4 h-4" />
              <span className="hidden sm:inline">지역 추가</span>
              <span className="sm:hidden">추가</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
        {/* Regions */}
        {dateLog.regions.map((region) => (
          <RegionSection
            key={region.id}
            dateId={dateId}
            region={region}
            onUpdateRegionName={(newName) => updateRegionName(dateId, region.id, newName)}
            onDeleteRegion={() => handleDeleteRegion(region.id)}
            onAddPlace={(category) => handleAddPlace(region.id, category)}
            onToggleVisited={(category, placeId) =>
              toggleVisited(dateId, region.id, category, placeId)
            }
            onEditPlace={(category, placeId) => handleEditPlace(region.id, category, placeId)}
            onDeletePlace={(category, placeId) =>
              handleDeletePlace(region.id, category, placeId)
            }
            showDelete={totalRegions > 1}
          />
        ))}

        {/* Empty State */}
        {dateLog.regions.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg shadow-md">
            <p className="text-gray-500 mb-4">등록된 지역이 없습니다.</p>
            <button
              onClick={() => setIsAddRegionOpen(true)}
              className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
            >
              첫 번째 지역 추가하기
            </button>
          </div>
        )}
      </main>

      {/* Place Form Modal */}
      <PlaceFormModal
        isOpen={isPlaceFormOpen}
        onClose={() => {
          setIsPlaceFormOpen(false);
          setEditingPlace(null);
        }}
        onSubmit={handlePlaceFormSubmit}
        category={currentCategory}
        editingPlace={editingPlace}
      />

      {/* Add Region Modal */}
      {isAddRegionOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">지역 추가</h3>
            <input
              type="text"
              value={newRegionName}
              onChange={(e) => setNewRegionName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddRegion()}
              placeholder="예: 삼송, 연신내, 홍대"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent mb-4"
              autoFocus
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setIsAddRegionOpen(false);
                  setNewRegionName('');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleAddRegion}
                disabled={!newRegionName.trim()}
                className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                추가
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Place Confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl max-w-sm w-full p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-2">장소 삭제</h3>
            <p className="text-gray-600 mb-6">이 장소를 삭제하시겠습니까?</p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                취소
              </button>
              <button
                onClick={confirmDeletePlace}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Region Confirmation */}
      {deleteRegionConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl max-w-sm w-full p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-2">지역 삭제</h3>
            <p className="text-gray-600 mb-2">이 지역과 포함된 모든 장소를 삭제하시겠습니까?</p>
            <p className="text-sm text-red-600 mb-6">이 작업은 되돌릴 수 없습니다.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteRegionConfirm(null)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                취소
              </button>
              <button
                onClick={confirmDeleteRegion}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
