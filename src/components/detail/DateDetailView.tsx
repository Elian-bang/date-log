import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiEdit2, FiCheck } from 'react-icons/fi';
import { useDateLog } from '@/hooks/useDateLog';
import { formatDateForDisplay } from '@/utils/dateUtils';
import { CategoryType, PlaceFormData, Place, Restaurant } from '@/types';
import { CategorySection } from './CategorySection';
import { PlaceFormModal } from '../forms/PlaceFormModal';

/**
 * Date Detail View Component
 * Displays date details with place management
 */
export const DateDetailView = () => {
  const { dateId } = useParams<{ dateId: string }>();
  const navigate = useNavigate();
  const {
    getDateLog,
    updateRegion,
    addPlace,
    updatePlace,
    deletePlace,
    toggleVisited,
    loading,
  } = useDateLog();

  const [isEditingRegion, setIsEditingRegion] = useState(false);
  const [regionInput, setRegionInput] = useState('');
  const [isPlaceFormOpen, setIsPlaceFormOpen] = useState(false);
  const [currentCategory, setCurrentCategory] = useState<CategoryType>('cafe');
  const [editingPlace, setEditingPlace] = useState<Place | Restaurant | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    category: CategoryType;
    placeId: string;
  } | null>(null);

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
          onClick={() => navigate('/')}
          className="flex items-center gap-2 px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
        >
          <FiArrowLeft />
          <span>Back to Calendar</span>
        </button>
      </div>
    );
  }

  // Region edit handlers
  const handleStartEditRegion = () => {
    setRegionInput(dateLog.region);
    setIsEditingRegion(true);
  };

  const handleSaveRegion = () => {
    if (regionInput.trim()) {
      updateRegion(dateId, regionInput.trim());
      setIsEditingRegion(false);
    }
  };

  const handleCancelEditRegion = () => {
    setIsEditingRegion(false);
    setRegionInput('');
  };

  // Place CRUD handlers
  const handleAddPlace = (category: CategoryType) => {
    setCurrentCategory(category);
    setEditingPlace(null);
    setIsPlaceFormOpen(true);
  };

  const handleEditPlace = (category: CategoryType, placeId: string) => {
    const place = dateLog.categories[category].find((p) => p.id === placeId);
    if (place) {
      setCurrentCategory(category);
      setEditingPlace(place);
      setIsPlaceFormOpen(true);
    }
  };

  const handleDeletePlace = (category: CategoryType, placeId: string) => {
    setDeleteConfirm({ category, placeId });
  };

  const confirmDelete = () => {
    if (deleteConfirm) {
      deletePlace(dateId, deleteConfirm.category, deleteConfirm.placeId);
      setDeleteConfirm(null);
    }
  };

  const handlePlaceFormSubmit = (data: PlaceFormData) => {
    if (editingPlace) {
      // Update existing place
      updatePlace(dateId, currentCategory, editingPlace.id, {
        name: data.name,
        memo: data.memo,
        image: data.image,
        link: data.link,
        ...(currentCategory === 'restaurant' && { type: data.type }),
      });
    } else {
      // Add new place
      addPlace(dateId, currentCategory, {
        name: data.name,
        memo: data.memo,
        image: data.image,
        link: data.link,
        visited: false,
        ...(currentCategory === 'restaurant' && { type: data.type! }),
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 text-primary hover:text-primary-dark transition-colors"
            >
              <FiArrowLeft className="w-5 h-5" />
              <span className="font-medium">Calendar</span>
            </button>

            <div className="flex items-center gap-4">
              <h1 className="text-xl font-bold text-gray-800">
                {formatDateForDisplay(dateLog.date)}
              </h1>

              {/* Region Editor */}
              <div className="flex items-center gap-2">
                {isEditingRegion ? (
                  <>
                    <input
                      type="text"
                      value={regionInput}
                      onChange={(e) => setRegionInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSaveRegion()}
                      className="px-3 py-1 border border-primary rounded-lg text-gray-700 focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="동네"
                      autoFocus
                    />
                    <button
                      onClick={handleSaveRegion}
                      className="p-1 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                      aria-label="Save region"
                    >
                      <FiCheck className="w-5 h-5" />
                    </button>
                    <button
                      onClick={handleCancelEditRegion}
                      className="p-1 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                      aria-label="Cancel"
                    >
                      ✕
                    </button>
                  </>
                ) : (
                  <>
                    <span className="text-lg text-gray-600">{dateLog.region}</span>
                    <button
                      onClick={handleStartEditRegion}
                      className="p-1 text-gray-400 hover:text-primary hover:bg-gray-100 rounded-lg transition-colors"
                      aria-label="Edit region"
                    >
                      <FiEdit2 className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className="w-20" /> {/* Spacer for alignment */}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Cafe Section */}
        <CategorySection
          category="cafe"
          places={dateLog.categories.cafe}
          onAddPlace={() => handleAddPlace('cafe')}
          onToggleVisited={(placeId) => toggleVisited(dateId, 'cafe', placeId)}
          onEditPlace={(placeId) => handleEditPlace('cafe', placeId)}
          onDeletePlace={(placeId) => handleDeletePlace('cafe', placeId)}
        />

        {/* Restaurant Section */}
        <CategorySection
          category="restaurant"
          places={dateLog.categories.restaurant}
          onAddPlace={() => handleAddPlace('restaurant')}
          onToggleVisited={(placeId) => toggleVisited(dateId, 'restaurant', placeId)}
          onEditPlace={(placeId) => handleEditPlace('restaurant', placeId)}
          onDeletePlace={(placeId) => handleDeletePlace('restaurant', placeId)}
        />

        {/* Spot Section */}
        <CategorySection
          category="spot"
          places={dateLog.categories.spot}
          onAddPlace={() => handleAddPlace('spot')}
          onToggleVisited={(placeId) => toggleVisited(dateId, 'spot', placeId)}
          onEditPlace={(placeId) => handleEditPlace('spot', placeId)}
          onDeletePlace={(placeId) => handleDeletePlace('spot', placeId)}
        />
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

      {/* Delete Confirmation Modal */}
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
                onClick={confirmDelete}
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
