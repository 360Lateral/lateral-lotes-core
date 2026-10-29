import { useState } from "react";
import { Link } from "react-router-dom";
import { Ruler, Sparkles, MapPin, ArrowRight, Award } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { LoteMercado } from "@/hooks/useMercadoPublico";
import { formatearCategoriaArea, formatearRangoPrecio } from "@/lib/mercado-format";
import { formatMetros } from "@/lib/format-moneda";
import { calcularScore360 } from "@/lib/calcular-score-360";
import { Score360Badge } from "@/components/lotes/Score360Badge";

interface Props {
  lote: LoteMercado;
}

const TarjetaLote = ({ lote }: Props) => {
  const score = calcularScore360(lote);
  const [failedPhoto, setFailedPhoto] = useState<string | null>(null);

  const esNuevo =
    lote.publicado_en &&
    Date.now() - new Date(lote.publicado_en).getTime() < 7 * 24 * 60 * 60 * 1000;

  return (
    <Link
      to={`/lotes/${lote.lote_id}`}
      className="group block rounded-xl border border-border bg-card overflow-hidden transition-all hover:shadow-lg hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
    >
      {/* Photo preview */}
      <div className="relative aspect-video w-full overflow-hidden market-photo-fallback">
        {lote.foto_url && failedPhoto !== lote.foto_url ? (
          <img src={lote.foto_url} alt={`Lote en ${[lote.ciudad, lote.barrio].filter(Boolean).join(" · ")}`} className="h-full w-full object-cover" loading="lazy" onError={() => setFailedPhoto(lote.foto_url ?? null)} />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <MapPin className="h-8 w-8 text-secondary-foreground" />
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-2 left-2 right-2 flex items-start justify-between gap-2 pointer-events-none">
          <Badge variant="secondary" className="rounded border-0 bg-secondary/75 px-2 py-1 text-xs font-mono text-secondary-foreground">
            {lote.codigo_anonimo}
          </Badge>
          <div className="flex flex-col items-end gap-1">
            {lote.es_ejemplo && (
              <Badge variant="outline" className="bg-background/90 backdrop-blur text-xs">
                Ejemplo
              </Badge>
            )}
            {esNuevo && (
              <Badge className="bg-primary text-primary-foreground gap-1 text-xs">
                <Sparkles className="h-3 w-3" />
                Nuevo
              </Badge>
            )}
            <Score360Badge score={score?.promedio} modulos={score?.modulos ?? 0} />
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
              {formatMetros(lote.area_m2_redondeada)}
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
