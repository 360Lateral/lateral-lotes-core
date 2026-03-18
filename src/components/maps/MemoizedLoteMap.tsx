import React, { useCallback } from "react";
import { GoogleMap, MarkerF } from "@react-google-maps/api";

const containerStyle = { width: "100%", height: "100%" };
const defaultCenter = { lat: 6.253, lng: -75.5736 };
const mapOptions = {
  mapTypeId: "hybrid" as const,
  mapTypeControl: false,
  streetViewControl: false,
  fullscreenControl: false,
};

interface MemoizedLoteMapProps {
  lat: string;
  lng: string;
  onMapClick: (e: google.maps.MapMouseEvent) => void;
  onMarkerDragEnd: (e: google.maps.MapMouseEvent) => void;
}

const MemoizedLoteMap = React.memo(
  ({ lat, lng, onMapClick, onMarkerDragEnd }: MemoizedLoteMapProps) => {
    const parsedLat = parseFloat(lat) || defaultCenter.lat;
    const parsedLng = parseFloat(lng) || defaultCenter.lng;
    const center = { lat: parsedLat, lng: parsedLng };
    const hasCoords = !!lat && !!lng;

    return (
      <div className="h-56 w-full rounded-lg overflow-hidden">
        <GoogleMap
          mapContainerStyle={containerStyle}
          center={center}
          zoom={13}
          options={mapOptions}
          onClick={onMapClick}
        >
          {hasCoords && (
            <MarkerF
              position={center}
              draggable
              onDragEnd={onMarkerDragEnd}
            />
          )}
        </GoogleMap>
      </div>
    );
  },
  (prev, next) =>
    prev.lat === next.lat &&
    prev.lng === next.lng &&
    prev.onMapClick === next.onMapClick &&
    prev.onMarkerDragEnd === next.onMarkerDragEnd
);

MemoizedLoteMap.displayName = "MemoizedLoteMap";

export default MemoizedLoteMap;
