import { useEffect, useMemo } from "react";
import { CircleMarker, MapContainer, Popup, TileLayer, useMap } from "react-leaflet";
import type { LatLngBoundsExpression } from "leaflet";
import "leaflet/dist/leaflet.css";
import { Button } from "@/components/ui/button";

interface LoteEjemploMapa {
  id: string;
  nombre_lote: string;
  barrio: string | null;
  ciudad: string | null;
  lat: number | null;
  lng: number | null;
}

interface Props {
  lotes: LoteEjemploMapa[];
  seleccionado: LoteEjemploMapa | null;
  onSeleccionar: (lote: LoteEjemploMapa) => void;
  onVerFicha: (id: string) => void;
}

const AjustarVista = ({ lotes, seleccionado }: Pick<Props, "lotes" | "seleccionado">) => {
  const map = useMap();

  useEffect(() => {
    if (seleccionado?.lat != null && seleccionado.lng != null) {
      map.flyTo([seleccionado.lat, seleccionado.lng], 16, { duration: 0.7 });
      return;
    }

    const puntos = lotes
      .filter((lote) => lote.lat != null && lote.lng != null)
      .map((lote) => [lote.lat as number, lote.lng as number] as [number, number]);

    if (puntos.length > 0) map.fitBounds(puntos as LatLngBoundsExpression, { padding: [48, 48], maxZoom: 12 });
  }, [lotes, map, seleccionado]);

  return null;
};

const MapaLotesEjemplo = ({ lotes, seleccionado, onSeleccionar, onVerFicha }: Props) => {
  const lotesConUbicacion = useMemo(
    () => lotes.filter((lote) => lote.lat != null && lote.lng != null),
    [lotes],
  );

  return (
    <MapContainer
      center={[6.253, -75.5736]}
      zoom={11}
      className="h-full w-full"
      zoomControl
      scrollWheelZoom
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <AjustarVista lotes={lotesConUbicacion} seleccionado={seleccionado} />
      {lotesConUbicacion.map((lote) => {
        const activo = seleccionado?.id === lote.id;
        const lat = lote.lat;
        const lng = lote.lng;
        if (lat == null || lng == null) return null;

        return (
          <CircleMarker
            key={lote.id}
            center={[lat, lng]}
            radius={activo ? 13 : 10}
            pathOptions={{
              color: "hsl(var(--secondary))",
              fillColor: "hsl(var(--primary))",
              fillOpacity: 1,
              weight: activo ? 4 : 3,
            }}
            eventHandlers={{ click: () => onSeleccionar(lote) }}
          >
            <Popup>
              <div className="min-w-44 font-body">
                <p className="mb-1 text-sm font-bold text-foreground">{lote.nombre_lote}</p>
                <p className="mb-3 text-xs text-muted-foreground">
                  {[lote.barrio, lote.ciudad].filter(Boolean).join(", ")}
                </p>
                <Button size="sm" className="w-full" onClick={() => onVerFicha(lote.id)}>
                  Ver ficha
                </Button>
              </div>
            </Popup>
          </CircleMarker>
        );
      })}
    </MapContainer>
  );
};

export default MapaLotesEjemplo;