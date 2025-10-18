import { Map, MapMarker } from 'react-kakao-maps-sdk';
import { Place, Restaurant } from '@/types';

interface MapViewProps {
  places: (Place | Restaurant)[];
  center?: { lat: number; lng: number };
  onMarkerClick?: (place: Place | Restaurant) => void;
}

/**
 * Map View Component
 * Displays Kakao Map with place markers
 */
export const MapView = ({ places, center, onMarkerClick }: MapViewProps) => {
  // Default center: Seoul City Hall
  const defaultCenter = { lat: 37.5665, lng: 126.978 };
  const mapCenter = center || defaultCenter;

  // Filter places with valid coordinates
  const validPlaces = places.filter(
    (place) => place.coordinates && place.coordinates.lat && place.coordinates.lng
  );

  return (
    <div className="w-full h-full rounded-lg overflow-hidden shadow-md">
      <Map
        center={mapCenter}
        style={{ width: '100%', height: '100%' }}
        level={5}
        className="rounded-lg"
      >
        {validPlaces.map((place) => (
          <MapMarker
            key={place.id}
            position={{
              lat: place.coordinates!.lat,
              lng: place.coordinates!.lng,
            }}
            onClick={() => onMarkerClick?.(place)}
            title={place.name}
          />
        ))}
      </Map>
    </div>
  );
};
