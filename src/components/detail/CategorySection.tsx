import { FiPlus } from 'react-icons/fi';
import { CategoryType, Place, Restaurant, RestaurantType } from '@/types';
import { CATEGORY_CONFIG, RESTAURANT_TYPES } from '@/utils/constants';
import { PlaceCard } from './PlaceCard';
import { useState, memo } from 'react';

interface CategorySectionProps {
  category: CategoryType;
  places: Place[] | Restaurant[];
  onAddPlace: () => void;
  onToggleVisited: (placeId: string) => void;
  onEditPlace: (placeId: string) => void;
  onDeletePlace: (placeId: string) => void;
}

/**
 * Category Section Component
 * Displays category header and horizontal scrolling place cards
 * Optimized with React.memo to prevent unnecessary re-renders
 */
export const CategorySection = memo(({
  category,
  places,
  onAddPlace,
  onToggleVisited,
  onEditPlace,
  onDeletePlace,
}: CategorySectionProps) => {
  const [selectedType, setSelectedType] = useState<RestaurantType>('전체');
  const config = CATEGORY_CONFIG[category];

  // Get available restaurant types (types that have at least one restaurant)
  const availableTypes: RestaurantType[] =
    category === 'restaurant'
      ? [
          '전체',
          ...RESTAURANT_TYPES.filter((type) => {
            if (type === '전체') return false;
            return (places as Restaurant[]).some((p) => p.type === type);
          }),
        ]
      : [];

  // Filter restaurants by type
  const filteredPlaces =
    category === 'restaurant'
      ? selectedType === '전체'
        ? places
        : (places as Restaurant[]).filter((p) => p.type === selectedType)
      : places;

  return (
    <div className="bg-white rounded-lg shadow-md p-3 sm:p-4 mb-4 sm:mb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <h2 className="text-base sm:text-lg font-bold text-gray-800 flex items-center gap-2">
          <span className="text-xl sm:text-2xl">{config.icon}</span>
          <span>{config.label}</span>
          <span className="text-xs sm:text-sm text-gray-500 font-normal">
            ({filteredPlaces.length})
          </span>
        </h2>

        <button
          onClick={onAddPlace}
          className="flex items-center gap-1 px-3 py-2.5 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors text-sm min-h-[44px]"
        >
          <FiPlus className="w-4 h-4" />
          <span>추가</span>
        </button>
      </div>

      {/* Restaurant Type Tabs */}
      {category === 'restaurant' && availableTypes.length > 0 && (
        <div className="flex gap-2 mb-3 sm:mb-4 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-thin">
          {availableTypes.map((type) => (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className={`px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg text-sm whitespace-nowrap transition-colors min-h-[44px] ${
                selectedType === type
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 active:bg-gray-300'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      )}

      {/* Place Cards */}
      {filteredPlaces.length > 0 ? (
        <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-thin snap-x snap-mandatory">
          {filteredPlaces.map((place) => (
            <div key={place.id} className="snap-start">
              <PlaceCard
                place={place}
                category={category}
                onToggleVisited={() => onToggleVisited(place.id)}
                onEdit={() => onEditPlace(place.id)}
                onDelete={() => onDeletePlace(place.id)}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-6 sm:py-8 text-gray-400">
          <p className="text-sm">
            {category === 'restaurant' && selectedType !== '전체'
              ? `${selectedType} 음식점이 없습니다.`
              : `등록된 ${config.label}이(가) 없습니다.`}
          </p>
          <p className="text-xs mt-1">추가 버튼을 눌러 장소를 등록하세요.</p>
        </div>
      )}
    </div>
  );
});

CategorySection.displayName = 'CategorySection';
