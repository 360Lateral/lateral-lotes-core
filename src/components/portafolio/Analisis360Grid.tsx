import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, ChevronDown, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import ExcelAnalisisExporter from "@/components/ExcelAnalisisExporter";
import ExcelAnalisisImporter from "@/components/ExcelAnalisisImporter";
import MapGISConsulta from "@/components/MapGISConsulta";
import AnalisisCardUnificada from "@/components/portafolio/AnalisisCardUnificada";
import { useAnalisisUnificadoEngagement } from "@/hooks/useAnalisisUnificadoEngagement";

interface Props {
  engagementId: string;
  loteId: string;
  puedeGestionar: boolean;
}

const fmtCOP = (n: number | null) => {
  if (n == null) return "—";
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(n);
};

const Analisis360Grid = ({ engagementId, loteId, puedeGestionar }: Props) => {
  const navigate = useNavigate();
  const [mapOpen, setMapOpen] = useState(false);
  const {
    items,
    valoracionEstimada,
    scorePromedio,
    totalAnalisis,
    completados,
    isLoading,
  } = useAnalisisUnificadoEngagement(engagementId, loteId);

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-32 w-full" />
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Resumen */}
      <Card className="flex flex-col gap-4 p-4 md:flex-row md:items-center md:justify-between">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="font-body text-xs text-muted-foreground">
              Valoración estimada
            </p>
            <p className="font-display text-lg font-bold text-foreground">
              {fmtCOP(valoracionEstimada)}
            </p>
          </div>
          <div>
            <p className="font-body text-xs text-muted-foreground">
              Score promedio
            </p>
            <p className="font-display text-lg font-bold text-foreground">
              {scorePromedio != null ? scorePromedio.toFixed(1) : "—"}
              <span className="ml-1 text-xs text-muted-foreground">/ 10</span>
            </p>
          </div>
          <div>
            <p className="font-body text-xs text-muted-foreground">
              Completados
            </p>
            <p className="font-display text-lg font-bold text-foreground">
              {completados} <span className="text-xs text-muted-foreground">de {totalAnalisis}</span>
            </p>
          </div>
        </div>
        {puedeGestionar && (
          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              onClick={() => navigate(`/dashboard/lotes/${loteId}/analisis`)}
            >
              Editor completo
              <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Button>
            <ExcelAnalisisImporter loteId={loteId} />
            <ExcelAnalisisExporter loteId={loteId} />
          </div>
        )}
      </Card>

      {/* MapGIS — solo consulta */}
      {puedeGestionar && (
        <Collapsible open={mapOpen} onOpenChange={setMapOpen}>
          <CollapsibleTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-between"
            >
              <span className="inline-flex items-center gap-2">
                <MapPin className="h-3.5 w-3.5" />
                Consultar MapGIS (solo consulta)
              </span>
              <ChevronDown
                className={`h-3.5 w-3.5 transition-transform ${mapOpen ? "rotate-180" : ""}`}
              />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-3">
            <MapGISConsulta
              loteId={loteId}
              onApply={() =>
                toast.info(
                  "Para aplicar resultados al lote, abre el editor completo.",
                )
              }
            />
          </CollapsibleContent>
        </Collapsible>
      )}

      {/* Grid de análisis */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <AnalisisCardUnificada
            key={item.tipo_codigo}
            item={item}
            engagementId={engagementId}
            loteId={loteId}
            puedeGestionar={puedeGestionar}
          />
        ))}
      </div>
    </div>
  );
};

export default Analisis360Grid;
