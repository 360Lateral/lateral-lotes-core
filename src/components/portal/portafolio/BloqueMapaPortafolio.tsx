import { useMemo } from "react";
import { Link } from "react-router-dom";
import { GoogleMap, Marker } from "@react-google-maps/api";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import GoogleMapsGate from "@/components/maps/GoogleMapsGate";
import MapErrorBoundary from "@/components/maps/MapErrorBoundary";
import { MapPin } from "lucide-react";
import type { LotePortafolio } from "@/hooks/portal/usePortafolioPropietario";

interface Props {
  lotes: LotePortafolio[];
}

const colorPorScore = (score: number | null): string => {
  if (score == null) return "#9ca3af";
  if (score >= 7) return "#10b981";
  if (score >= 4) return "#f59e0b";
  return "#ef4444";
};

const FallbackMapa = ({ lotes }: { lotes: LotePortafolio[] }) => (
  <div className="flex h-full w-full flex-col items-center justify-center bg-muted p-6 text-center">
    <MapPin className="h-8 w-8 text-muted-foreground mb-3" />
    <p className="text-sm font-semibold">Mapa no disponible</p>
    <p className="mt-1 text-xs text-muted-foreground max-w-xs">
      Tus {lotes.length} lote(s) siguen disponibles en la tabla y ficha técnica.
    </p>
  </div>
);

const MapaInterno = ({ lotes }: { lotes: LotePortafolio[] }) => {
  const conCoords = useMemo(
    () => lotes.filter((l) => l.lat != null && l.lng != null),
    [lotes],
  );
  const centro = useMemo(() => {
    if (conCoords.length === 0) return { lat: 6.2476, lng: -75.5658 };
    const lat = conCoords.reduce((s, l) => s + (l.lat ?? 0), 0) / conCoords.length;
    const lng = conCoords.reduce((s, l) => s + (l.lng ?? 0), 0) / conCoords.length;
    return { lat, lng };
  }, [conCoords]);

  return (
    <GoogleMap
      mapContainerStyle={{ width: "100%", height: 350, borderRadius: 6 }}
      center={centro}
      zoom={conCoords.length > 1 ? 10 : 14}
      options={{
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
      }}
    >
      {conCoords.map((lote) => (
        <Marker
          key={lote.id}
          position={{ lat: lote.lat!, lng: lote.lng! }}
          title={lote.nombre_lote}
          icon={{
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 9,
            fillColor: colorPorScore(lote.score_promedio),
            fillOpacity: 0.95,
            strokeColor: "#ffffff",
            strokeWeight: 2,
          }}
          onClick={() => window.open(`/lotes/${lote.id}`, "_blank")}
        />
      ))}
    </GoogleMap>
  );
};

export const BloqueMapaPortafolio = ({ lotes }: Props) => {
  const sinCoords = lotes.filter((l) => !l.lat || !l.lng).length;

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary" />
            Distribución geográfica
          </h3>
          <Badge variant="secondary">{lotes.length} ubicaciones</Badge>
        </div>

        <div className="overflow-hidden rounded-md border">
          <MapErrorBoundary fallback={<FallbackMapa lotes={lotes} />}>
            <GoogleMapsGate fallback={<FallbackMapa lotes={lotes} />}>
              <MapaInterno lotes={lotes} />
            </GoogleMapsGate>
          </MapErrorBoundary>
        </div>

        {sinCoords > 0 && (
          <p className="text-xs text-muted-foreground">
            {sinCoords} lote(s) sin coordenadas no aparecen en el mapa.{" "}
            <Link to="/dashboard/lotes" className="text-primary hover:underline">
              Agregar coordenadas →
            </Link>
          </p>
        )}
      </CardContent>
    </Card>
  );
};
