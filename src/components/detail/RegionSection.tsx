import { useState } from 'react';
import { FiEdit2, FiCheck, FiTrash2, FiChevronDown, FiChevronUp } from 'react-icons/fi';
import { CategoryType, RegionSection as RegionSectionType } from '@/types';
import { CategorySection } from './CategorySection';

interface RegionSectionProps {
  dateId: string; // Reserved for future use (e.g., map integration)
  region: RegionSectionType;
  onUpdateRegionName: (newName: string) => void;
  onDeleteRegion: () => void;
  onAddPlace: (category: CategoryType) => void;
  onToggleVisited: (category: CategoryType, placeId: string) => void;
  onEditPlace: (category: CategoryType, placeId: string) => void;
  onDeletePlace: (category: CategoryType, placeId: string) => void;
  showDelete: boolean; // Only show delete if there are multiple regions
}

/**
 * Region Section Component
 * Displays a region with its categories (collapsible)
 */
export const RegionSection = ({
  dateId: _, // Reserved for future use
  region,
  onUpdateRegionName,
  onDeleteRegion,
  onAddPlace,
  onToggleVisited,
  onEditPlace,
  onDeletePlace,
  showDelete,
}: RegionSectionProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [regionInput, setRegionInput] = useState(region.name);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleSave = () => {
    if (regionInput.trim()) {
      onUpdateRegionName(regionInput.trim());
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setRegionInput(region.name);
    setIsEditing(false);
  };

  // Count total places in this region
  const totalPlaces =
    region.categories.cafe.length +
    region.categories.restaurant.length +
    region.categories.spot.length;

  return (
    <div className="bg-gradient-to-r from-primary-light/10 to-primary/10 rounded-xl p-4 mb-6 border border-primary/20">
      {/* Region Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3 flex-1">
          {/* Collapse Button */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 hover:bg-white/50 rounded-lg transition-colors"
            aria-label={isCollapsed ? 'Expand region' : 'Collapse region'}
          >
            {isCollapsed ? (
              <FiChevronDown className="w-5 h-5 text-primary" />
            ) : (
              <FiChevronUp className="w-5 h-5 text-primary" />
            )}
          </button>

          {/* Region Name */}
          {isEditing ? (
            <>
              <input
                type="text"
                value={regionInput}
                onChange={(e) => setRegionInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSave()}
                className="px-3 py-2 border-2 border-primary rounded-lg text-gray-800 text-xl font-bold focus:ring-2 focus:ring-primary/50 focus:border-primary bg-white"
                placeholder="동네 이름"
                autoFocus
              />
              <button
                onClick={handleSave}
                className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                aria-label="Save region name"
              >
                <FiCheck className="w-5 h-5" />
              </button>
              <button
                onClick={handleCancel}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Cancel"
              >
                ✕
              </button>
            </>
          ) : (
            <>
              <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                📍 {region.name}
                <span className="text-sm font-normal text-gray-500">
                  ({totalPlaces}개 장소)
                </span>
              </h2>
              <button
                onClick={() => {
                  setRegionInput(region.name);
                  setIsEditing(true);
                }}
                className="p-1 text-gray-400 hover:text-primary hover:bg-white/50 rounded-lg transition-colors"
                aria-label="Edit region name"
              >
                <FiEdit2 className="w-4 h-4" />
              </button>
            </>
          )}
        </div>

        {/* Delete Region Button */}
        {showDelete && (
          <button
            onClick={onDeleteRegion}
            className="flex items-center gap-1 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm"
          >
            <FiTrash2 className="w-4 h-4" />
            <span>지역 삭제</span>
          </button>
        )}
      </div>

      {/* Categories */}
      {!isCollapsed && (
        <div className="space-y-4">
          <CategorySection
            category="cafe"
            places={region.categories.cafe}
            onAddPlace={() => onAddPlace('cafe')}
            onToggleVisited={(placeId) => onToggleVisited('cafe', placeId)}
            onEditPlace={(placeId) => onEditPlace('cafe', placeId)}
            onDeletePlace={(placeId) => onDeletePlace('cafe', placeId)}
          />

          <CategorySection
            category="restaurant"
            places={region.categories.restaurant}
            onAddPlace={() => onAddPlace('restaurant')}
            onToggleVisited={(placeId) => onToggleVisited('restaurant', placeId)}
            onEditPlace={(placeId) => onEditPlace('restaurant', placeId)}
            onDeletePlace={(placeId) => onDeletePlace('restaurant', placeId)}
          />

          <CategorySection
            category="spot"
            places={region.categories.spot}
            onAddPlace={() => onAddPlace('spot')}
            onToggleVisited={(placeId) => onToggleVisited('spot', placeId)}
            onEditPlace={(placeId) => onEditPlace('spot', placeId)}
            onDeletePlace={(placeId) => onDeletePlace('spot', placeId)}
          />
        </div>
      )}
    </div>
  );
};
