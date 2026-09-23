import React, { useCallback, useEffect, useRef, useState } from "react";
import { GoogleMap, MarkerF } from "@react-google-maps/api";
import { Search, Loader2 } from "lucide-react";

const containerStyle = { width: "100%", height: "100%" };
const defaultCenter = { lat: 6.253, lng: -75.5736 };
const mapOptions = {
  mapTypeId: "hybrid" as const,
  mapTypeControl: false,
  streetViewControl: false,
  fullscreenControl: false,
};

export interface PlaceSelection {
  lat: number;
  lng: number;
  address?: string;
}

interface MemoizedLoteMapProps {
  lat: string;
  lng: string;
  onMapClick: (e: google.maps.MapMouseEvent) => void;
  onMarkerDragEnd: (e: google.maps.MapMouseEvent) => void;
  onPlaceSelect?: (p: PlaceSelection) => void;
  /** Texto a geocodificar automáticamente (dirección, barrio, municipio...) */
  geocodeQuery?: string;
  geocodeZoom?: number;
  onGeocoded?: (r: { lat: number; lng: number; ok: boolean }) => void;
}

const MemoizedLoteMap = React.memo(
  ({ lat, lng, onMapClick, onMarkerDragEnd, onPlaceSelect, geocodeQuery, geocodeZoom, onGeocoded }: MemoizedLoteMapProps) => {
    const parsedLat = parseFloat(lat) || defaultCenter.lat;
    const parsedLng = parseFloat(lng) || defaultCenter.lng;
    const center = { lat: parsedLat, lng: parsedLng };
    const hasCoords = !!lat && !!lng;

    const inputRef = useRef<HTMLInputElement>(null);
    const mapRef = useRef<google.maps.Map | null>(null);
    const [query, setQuery] = useState("");
    const [buscando, setBuscando] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const aplicar = useCallback(
      (loc: google.maps.LatLng, address?: string, viewport?: google.maps.LatLngBounds) => {
        setError(null);
        onPlaceSelect?.({ lat: loc.lat(), lng: loc.lng(), address });
        if (mapRef.current) {
          if (viewport) mapRef.current.fitBounds(viewport);
          else {
            mapRef.current.panTo(loc);
            mapRef.current.setZoom(17);
          }
        }
      },
      [onPlaceSelect],
    );

    useEffect(() => {
      if (!onPlaceSelect || !inputRef.current || !window.google?.maps?.places) return;
      const ac = new google.maps.places.Autocomplete(inputRef.current, {
        componentRestrictions: { country: "co" },
        fields: ["geometry", "formatted_address", "name"],
      });
      const l = ac.addListener("place_changed", () => {
        const p = ac.getPlace();
        if (p.geometry?.location) {
          setQuery(p.formatted_address || p.name || "");
          aplicar(p.geometry.location, p.formatted_address, p.geometry.viewport ?? undefined);
        }
      });
      return () => l.remove();
    }, [onPlaceSelect, aplicar]);

    useEffect(() => {
      const q = geocodeQuery?.trim();
      if (!q || !window.google?.maps) return;
      let cancel = false;
      new google.maps.Geocoder().geocode(
        { address: q, componentRestrictions: { country: "CO" } },
        (res, status) => {
          if (cancel) return;
          if (status === "OK" && res?.[0]) {
            const loc = res[0].geometry.location;
            onGeocoded?.({ lat: loc.lat(), lng: loc.lng(), ok: true });
            if (mapRef.current) {
              mapRef.current.panTo(loc);
              mapRef.current.setZoom(geocodeZoom ?? 15);
            }
          } else {
            onGeocoded?.({ lat: 0, lng: 0, ok: false });
          }
        },
      );
      return () => {
        cancel = true;
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [geocodeQuery]);

    const buscarTexto = () => {
      const q = query.trim();
      if (!q || !window.google?.maps) return;
      setBuscando(true);
      new google.maps.Geocoder().geocode(
        { address: q, componentRestrictions: { country: "CO" } },
        (res, status) => {
          setBuscando(false);
          if (status === "OK" && res?.[0]) {
            aplicar(res[0].geometry.location, res[0].formatted_address, res[0].geometry.viewport);
          } else {
            setError("No encontramos esa dirección. Prueba con más detalle o marca el punto en el mapa.");
          }
        },
      );
    };

    return (
      <div className="flex flex-col gap-2">
        {onPlaceSelect && (
          <div>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      buscarTexto();
                    }
                  }}
                  placeholder="¿No encuentras la dirección? Busca un sitio cercano (ej: Parque Lleras)"
                  className="h-10 w-full rounded-md border border-input bg-background pl-9 pr-3 font-body text-base focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <button
                type="button"
                onClick={buscarTexto}
                disabled={buscando}
                className="inline-flex h-10 items-center gap-1.5 rounded-md bg-secondary px-4 font-body text-sm font-semibold text-secondary-foreground disabled:opacity-60"
              >
                {buscando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                Buscar
              </button>
            </div>
            {error && <p className="mt-1 font-body text-xs text-destructive">{error}</p>}
          </div>
        )}
        <div className="h-72 w-full overflow-hidden rounded-lg">
          <GoogleMap
            mapContainerStyle={containerStyle}
            center={center}
            zoom={hasCoords ? 16 : 13}
            options={mapOptions}
            onClick={onMapClick}
            onLoad={(m) => {
              mapRef.current = m;
            }}
          >
            {hasCoords && <MarkerF position={center} draggable onDragEnd={onMarkerDragEnd} />}
          </GoogleMap>
        </div>
      </div>
    );
  },
  (prev, next) =>
    prev.lat === next.lat &&
    prev.lng === next.lng &&
    prev.onMapClick === next.onMapClick &&
    prev.onMarkerDragEnd === next.onMarkerDragEnd &&
    prev.onPlaceSelect === next.onPlaceSelect &&
    prev.geocodeQuery === next.geocodeQuery &&
    prev.onGeocoded === next.onGeocoded,
);

MemoizedLoteMap.displayName = "MemoizedLoteMap";

export default MemoizedLoteMap;
