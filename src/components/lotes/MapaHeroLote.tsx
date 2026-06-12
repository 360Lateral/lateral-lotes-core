import { GoogleMap, Marker } from "@react-google-maps/api";
import GoogleMapsGate from "@/components/maps/GoogleMapsGate";
import { Eye, MapPin } from "lucide-react";

interface Props {
  lat?: number | null;
  lng?: number | null;
  ofuscado: boolean;
}

const containerStyle = { width: "100%", height: "240px", borderRadius: "8px" };

const Fallback = ({ msg }: { msg: string }) => (
  <div className="w-full h-[240px] rounded-lg bg-muted flex items-center justify-center text-sm text-muted-foreground border">
    <MapPin className="h-4 w-4 mr-1.5 opacity-60" />
    {msg}
  </div>
);

export const MapaHeroLote = ({ lat, lng, ofuscado }: Props) => {
  if (lat == null || lng == null) {
    return <Fallback msg="Ubicación no disponible" />;
  }

  const center = { lat: Number(lat), lng: Number(lng) };

  return (
    <div className="relative">
      <GoogleMapsGate fallback={<Fallback msg="Cargando mapa…" />}>
        <GoogleMap
          mapContainerStyle={containerStyle}
          center={center}
          zoom={ofuscado ? 14 : 16}
          options={{
            disableDefaultUI: true,
            zoomControl: true,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: false,
            gestureHandling: "cooperative",
          }}
        >
          {ofuscado ? (
            <Marker
              position={center}
              icon={{
                path: google.maps.SymbolPath.CIRCLE,
                scale: 36,
                fillColor: "#F49D15",
                fillOpacity: 0.25,
                strokeColor: "#F49D15",
                strokeWeight: 2,
              }}
            />
          ) : (
            <Marker position={center} />
          )}
        </GoogleMap>
      </GoogleMapsGate>
      {ofuscado && (
        <div className="absolute top-2 left-2 bg-background/95 border rounded-md px-2.5 py-1 flex items-center gap-1.5 text-xs font-medium shadow-sm">
          <Eye className="h-3.5 w-3.5 text-primary" />
          Zona aproximada
        </div>
      )}
    </div>
  );
};

export default MapaHeroLote;
