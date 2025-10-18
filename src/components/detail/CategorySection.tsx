import { FiPlus } from 'react-icons/fi';
import { CategoryType, Place, Restaurant, RestaurantType } from '@/types';
import { CATEGORY_CONFIG, RESTAURANT_TYPES } from '@/utils/constants';
import { PlaceCard } from './PlaceCard';
import { useState } from 'react';

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
 */
export const CategorySection = ({
  category,
  places,
  onAddPlace,
  onToggleVisited,
  onEditPlace,
  onDeletePlace,
}: CategorySectionProps) => {
  const [selectedType, setSelectedType] = useState<RestaurantType>('전체');
  const config = CATEGORY_CONFIG[category];

  // Filter restaurants by type
  const filteredPlaces =
    category === 'restaurant'
      ? selectedType === '전체'
        ? places
        : (places as Restaurant[]).filter((p) => p.type === selectedType)
      : places;

  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <span className="text-2xl">{config.icon}</span>
          <span>{config.label}</span>
          <span className="text-sm text-gray-500 font-normal">
            ({filteredPlaces.length})
          </span>
        </h2>

        <button
          onClick={onAddPlace}
          className="flex items-center gap-1 px-3 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors text-sm"
        >
          <FiPlus className="w-4 h-4" />
          <span>추가</span>
        </button>
      </div>

      {/* Restaurant Type Tabs */}
      {category === 'restaurant' && (
        <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
          {RESTAURANT_TYPES.map((type) => (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className={`px-4 py-2 rounded-lg text-sm whitespace-nowrap transition-colors ${
                selectedType === type
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      )}

      {/* Place Cards */}
      {filteredPlaces.length > 0 ? (
        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin">
          {filteredPlaces.map((place) => (
            <PlaceCard
              key={place.id}
              place={place}
              category={category}
              onToggleVisited={() => onToggleVisited(place.id)}
              onEdit={() => onEditPlace(place.id)}
              onDelete={() => onDeletePlace(place.id)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-400">
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
};
