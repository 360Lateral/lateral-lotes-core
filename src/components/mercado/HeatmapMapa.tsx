import { useMemo } from "react";
import { GoogleMap, HeatmapLayer } from "@react-google-maps/api";
import GoogleMapsGate from "@/components/maps/GoogleMapsGate";
import type { LoteMercado } from "@/hooks/useMercadoPublico";
import { Loader2 } from "lucide-react";

interface Props {
  lotes: LoteMercado[];
}

const containerStyle = { width: "100%", height: "100%" };
const DEFAULT_CENTER = { lat: 6.2442, lng: -75.5812 }; // Medellín

const MapaInterno = ({ lotes }: Props) => {
  const puntos = useMemo(
    () =>
      lotes
        .filter((l) => l.latitud_zona != null && l.longitud_zona != null)
        .map((l) => new google.maps.LatLng(Number(l.latitud_zona), Number(l.longitud_zona))),
    [lotes],
  );

  const center = useMemo(() => {
    if (puntos.length === 0) return DEFAULT_CENTER;
    const lat = puntos.reduce((s, p) => s + p.lat(), 0) / puntos.length;
    const lng = puntos.reduce((s, p) => s + p.lng(), 0) / puntos.length;
    return { lat, lng };
  }, [puntos]);

  return (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={center}
      zoom={12}
      options={{
        fullscreenControl: false,
        streetViewControl: false,
        mapTypeControl: false,
      }}
    >
      {puntos.length > 0 && (
        <HeatmapLayer
          data={puntos}
          options={{ radius: 32, opacity: 0.7 }}
        />
      )}
    </GoogleMap>
  );
};

const HeatmapMapa = ({ lotes }: Props) => {
  return (
    <div className="relative w-full h-[50vh] min-h-[320px] rounded-xl overflow-hidden border border-border bg-muted">
      <GoogleMapsGate
        fallback={
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        }
      >
        <MapaInterno lotes={lotes} />
      </GoogleMapsGate>
      {lotes.length === 0 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-background/90 backdrop-blur px-3 py-1.5 rounded-md text-xs text-muted-foreground border border-border">
          No hay activos disponibles con los filtros actuales.
        </div>
      )}
    </div>
  );
};

export default HeatmapMapa;
