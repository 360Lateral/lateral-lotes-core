// NOTA: ya no usa HeatmapLayer (deprecated por Google en v3.65).
// Renderiza Markers individuales con coords rasterizadas (~1km) desde vw_mercado_publico.
import { useMemo } from "react";
import { GoogleMap, Marker } from "@react-google-maps/api";
import GoogleMapsGate from "@/components/maps/GoogleMapsGate";
import type { LoteMercado } from "@/hooks/useMercadoPublico";
import { Loader2 } from "lucide-react";

interface Props {
  lotes: LoteMercado[];
}

const containerStyle = { width: "100%", height: "100%" };
const DEFAULT_CENTER = { lat: 6.2442, lng: -75.5812 }; // Medellín

const MapaInterno = ({ lotes }: Props) => {
  const lotesConCoords = useMemo(
    () => lotes.filter((l) => l.latitud_zona != null && l.longitud_zona != null),
    [lotes],
  );

  const center = useMemo(() => {
    if (lotesConCoords.length === 0) return DEFAULT_CENTER;
    const lat =
      lotesConCoords.reduce((s, l) => s + Number(l.latitud_zona), 0) / lotesConCoords.length;
    const lng =
      lotesConCoords.reduce((s, l) => s + Number(l.longitud_zona), 0) / lotesConCoords.length;
    return { lat, lng };
  }, [lotesConCoords]);

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
      {lotesConCoords.map((l) => (
        <Marker
          key={l.lote_id}
          position={{
            lat: Number(l.latitud_zona),
            lng: Number(l.longitud_zona),
          }}
          title={l.codigo_anonimo}
        />
      ))}
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
