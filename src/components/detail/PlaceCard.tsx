import { FiMapPin, FiEdit2, FiTrash2, FiExternalLink } from 'react-icons/fi';
import { Place, CategoryType } from '@/types';

interface PlaceCardProps {
  place: Place;
  category: CategoryType;
  onToggleVisited: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

/**
 * Place Card Component
 * Displays place information with actions
 */
export const PlaceCard = ({
  place,
  // category is reserved for future use (e.g., category-specific styling)
  onToggleVisited,
  onEdit,
  onDelete,
}: PlaceCardProps) => {
  return (
    <div className="flex-shrink-0 w-64 bg-white rounded-lg shadow-md overflow-hidden">
      {/* Image */}
      <div className="relative h-40 bg-gray-200">
        {place.image ? (
          <img
            src={place.image}
            alt={place.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23f3f4f6" width="100" height="100"/%3E%3Ctext fill="%239ca3af" font-family="sans-serif" font-size="14" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3ENo Image%3C/text%3E%3C/svg%3E';
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <span className="text-sm">No Image</span>
          </div>
        )}

        {/* Visited Badge */}
        {place.visited && (
          <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
            ✓ 다녀옴
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Name */}
        <h3 className="font-bold text-gray-800 text-lg truncate">{place.name}</h3>

        {/* Memo */}
        {place.memo && (
          <p className="text-sm text-gray-600 line-clamp-2">{place.memo}</p>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          {/* Map Link */}
          {place.link && (
            <a
              href={place.link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <FiMapPin className="w-4 h-4" />
              <span>지도</span>
              <FiExternalLink className="w-3 h-3" />
            </a>
          )}

          {/* Visited Toggle */}
          <button
            onClick={onToggleVisited}
            className={`flex-1 px-3 py-2 text-sm rounded-lg transition-colors ${
              place.visited
                ? 'bg-green-50 text-green-600 hover:bg-green-100'
                : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
            }`}
          >
            {place.visited ? '✓ 다녀옴' : '방문 예정'}
          </button>
        </div>

        {/* Edit/Delete */}
        <div className="flex gap-2 pt-1 border-t border-gray-100">
          <button
            onClick={onEdit}
            className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <FiEdit2 className="w-4 h-4" />
            <span>수정</span>
          </button>
          <button
            onClick={onDelete}
            className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <FiTrash2 className="w-4 h-4" />
            <span>삭제</span>
          </button>
        </div>
      </div>
    </div>
  );
};
