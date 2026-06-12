import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { GoogleMap, MarkerF } from "@react-google-maps/api";
import { Ruler, Sparkles, MapPin, ArrowRight, Image as ImageIcon, Award, Star } from "lucide-react";
import GoogleMapsGate from "@/components/maps/GoogleMapsGate";
import { Badge } from "@/components/ui/badge";
import type { LoteMercado } from "@/hooks/useMercadoPublico";
import { formatearCategoriaArea, formatearRangoPrecio } from "@/lib/mercado-format";

interface Props {
  lote: LoteMercado;
}

const containerStyle = { width: "100%", height: "100%" };
const mapOptions: google.maps.MapOptions = {
  disableDefaultUI: true,
  gestureHandling: "none",
  keyboardShortcuts: false,
  clickableIcons: false,
  zoomControl: false,
};

const MapaMini = ({ lat, lng }: { lat: number; lng: number }) => (
  <GoogleMap
    mapContainerStyle={containerStyle}
    center={{ lat, lng }}
    zoom={13}
    options={mapOptions}
  >
    <MarkerF position={{ lat, lng }} />
  </GoogleMap>
);

const TarjetaLote = ({ lote }: Props) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const [enViewport, setEnViewport] = useState(false);

  useEffect(() => {
    if (!ref.current || enViewport) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setEnViewport(true);
          obs.disconnect();
        }
      },
      { rootMargin: "200px" },
    );
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, [enViewport]);

  const lat = lote.latitud_zona != null ? Number(lote.latitud_zona) : null;
  const lng = lote.longitud_zona != null ? Number(lote.longitud_zona) : null;
  const tieneCoords = lat != null && lng != null && !Number.isNaN(lat) && !Number.isNaN(lng);

  const esNuevo =
    lote.publicado_en &&
    Date.now() - new Date(lote.publicado_en).getTime() < 7 * 24 * 60 * 60 * 1000;

  return (
    <Link
      to={`/lotes/${lote.lote_id}`}
      className="group block rounded-xl border border-border bg-card overflow-hidden transition-all hover:shadow-lg hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
    >
      {/* Map preview */}
      <div ref={ref} className="relative w-full h-40 bg-muted">
        {enViewport && tieneCoords ? (
          <GoogleMapsGate
            fallback={
              <div className="absolute inset-0 flex items-center justify-center bg-muted">
                <ImageIcon className="h-8 w-8 text-muted-foreground/40" />
              </div>
            }
          >
            <MapaMini lat={lat as number} lng={lng as number} />
          </GoogleMapsGate>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <MapPin className="h-8 w-8 text-muted-foreground/40" />
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-2 left-2 right-2 flex items-start justify-between gap-2 pointer-events-none">
          <Badge variant="secondary" className="bg-background/90 backdrop-blur text-xs font-mono">
            {lote.codigo_anonimo}
          </Badge>
          <div className="flex flex-col items-end gap-1">
            {esNuevo && (
              <Badge className="bg-primary text-primary-foreground gap-1 text-xs">
                <Sparkles className="h-3 w-3" />
                Nuevo
              </Badge>
            )}
            {lote.score_360 != null && (
              <Badge className="bg-emerald-600 text-white gap-1 text-xs">
                <Star className="h-3 w-3" />
                Score {Number(lote.score_360).toFixed(1)}
              </Badge>
            )}
            {lote.has_resolutoria && (
              <Badge className="bg-secondary text-secondary-foreground gap-1 text-xs">
                <Award className="h-3 w-3" />
                Resolutoría
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="p-4 space-y-3">
        <div>
          <p className="text-sm text-muted-foreground flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" />
            {[lote.ciudad, lote.barrio].filter(Boolean).join(" · ") || "Sin ubicación"}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          {lote.area_m2_redondeada > 0 && (
            <span className="inline-flex items-center gap-1">
              <Ruler className="h-3.5 w-3.5" />
              {lote.area_m2_redondeada.toLocaleString("es-CO")} m²
            </span>
          )}
          <Badge variant="outline" className="text-xs">
            {formatearCategoriaArea(lote.categoria_area)}
          </Badge>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-border">
          <span className="font-heading font-semibold text-secondary text-sm">
            {formatearRangoPrecio(lote.rango_precio)}
          </span>
          <span className="text-sm text-primary font-medium inline-flex items-center gap-1 group-hover:gap-2 transition-all">
            Ver detalle
            <ArrowRight className="h-3.5 w-3.5" />
          </span>
        </div>
      </div>
    </Link>
  );
};

export default TarjetaLote;
