import { useState } from 'react';
import { Map, MapMarker, CustomOverlayMap } from 'react-kakao-maps-sdk';
import { Place, Restaurant, CategoryType } from '@/types';
import { getMarkerColor, getCategoryLabel } from '@/utils/mapUtils';

interface PlaceWithCategory extends Place {
  category: CategoryType;
}

interface RestaurantWithCategory extends Restaurant {
  category: CategoryType;
}

type PlaceMarker = PlaceWithCategory | RestaurantWithCategory;

interface MapViewProps {
  places: PlaceMarker[];
  center?: { lat: number; lng: number };
  onMarkerClick?: (place: PlaceMarker) => void;
}

/**
 * Map View Component
 * Displays Kakao Map with categorized custom markers and info windows
 */
export const MapView = ({ places, center, onMarkerClick }: MapViewProps) => {
  const [selectedPlace, setSelectedPlace] = useState<PlaceMarker | null>(null);

  // Default center: Seoul City Hall
  const defaultCenter = { lat: 37.5665, lng: 126.978 };
  const mapCenter = center || defaultCenter;

  // Filter places with valid coordinates
  const validPlaces = places.filter(
    (place) => place.coordinates && place.coordinates.lat && place.coordinates.lng
  );

  const handleMarkerClick = (place: PlaceMarker) => {
    setSelectedPlace(place);
    onMarkerClick?.(place);
  };

  return (
    <div className="w-full h-full rounded-lg overflow-hidden shadow-md">
      <Map
        center={mapCenter}
        style={{ width: '100%', height: '100%' }}
        level={5}
        className="rounded-lg"
        onClick={() => setSelectedPlace(null)}
      >
        {validPlaces.map((place) => {
          const markerColor = getMarkerColor(place.category);
          const markerOpacity = place.visited ? 1.0 : 0.5;

          return (
            <div key={place.id}>
              {/* Custom Marker */}
              <MapMarker
                position={{
                  lat: place.coordinates!.lat,
                  lng: place.coordinates!.lng,
                }}
                onClick={() => handleMarkerClick(place)}
                image={{
                  src: `data:image/svg+xml;utf8,${encodeURIComponent(`
                    <svg width="30" height="40" viewBox="0 0 30 40" xmlns="http://www.w3.org/2000/svg">
                      <filter id="shadow">
                        <feDropShadow dx="0" dy="2" stdDeviation="2" flood-opacity="0.3"/>
                      </filter>
                      <path
                        d="M15 0C6.716 0 0 6.716 0 15c0 8.284 15 25 15 25s15-16.716 15-25C30 6.716 23.284 0 15 0z"
                        fill="${markerColor}"
                        opacity="${markerOpacity}"
                        filter="url(#shadow)"
                      />
                      <circle cx="15" cy="15" r="6" fill="white" opacity="${markerOpacity}" />
                      ${
                        !place.visited
                          ? `<circle cx="15" cy="15" r="4" fill="none" stroke="white" stroke-width="2" opacity="${markerOpacity}" />`
                          : ''
                      }
                    </svg>
                  `)}`,
                  size: { width: 30, height: 40 },
                  options: { offset: { x: 15, y: 40 } },
                }}
              />

              {/* Info Window */}
              {selectedPlace?.id === place.id && (
                <CustomOverlayMap
                  position={{
                    lat: place.coordinates!.lat,
                    lng: place.coordinates!.lng,
                  }}
                  yAnchor={1.4}
                >
                  <div className="bg-white rounded-lg shadow-lg p-3 min-w-[200px] max-w-[280px]">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="font-bold text-gray-900 text-sm leading-tight flex-1">
                        {place.name}
                      </h3>
                      <button
                        onClick={() => setSelectedPlace(null)}
                        className="text-gray-400 hover:text-gray-600 flex-shrink-0"
                      >
                        ✕
                      </button>
                    </div>

                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className="text-xs px-2 py-0.5 rounded-full text-white font-medium"
                        style={{ backgroundColor: markerColor }}
                      >
                        {getCategoryLabel(place.category)}
                      </span>
                      {place.visited && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">
                          방문완료
                        </span>
                      )}
                    </div>

                    {place.memo && (
                      <p className="text-xs text-gray-600 mb-2 line-clamp-2">{place.memo}</p>
                    )}

                    {place.link && (
                      <a
                        href={place.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary hover:text-primary-dark underline block"
                      >
                        상세 정보 →
                      </a>
                    )}
                  </div>
                </CustomOverlayMap>
              )}
            </div>
          );
        })}
      </Map>
    </div>
  );
};
