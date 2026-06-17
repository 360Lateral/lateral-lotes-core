import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronDown, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";

import { Card } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import ExcelAnalisisExporter from "@/components/ExcelAnalisisExporter";
import ExcelAnalisisImporter from "@/components/ExcelAnalisisImporter";
import MapGISConsulta from "@/components/MapGISConsulta";
import AnalisisCardUnificada from "@/components/portafolio/AnalisisCardUnificada";
import AnalisisEditorSheet from "@/components/analisis/editor/AnalisisEditorSheet";
import { useAnalisisUnificadoEngagement } from "@/hooks/useAnalisisUnificadoEngagement";
import { usePdfExtractAnalisis } from "@/hooks/analisis/usePdfExtractAnalisis";
import { aplicarPotANormativa } from "@/lib/aplicarPotANormativa";

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
  const qc = useQueryClient();
  const [mapOpen, setMapOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [areaActiva, setAreaActiva] = useState<{ codigo: string; nombre: string } | null>(null);

  const { data: lote } = useQuery({
    queryKey: ["analisis-lote-mini", loteId],
    enabled: !!loteId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lotes")
        .select("nombre_lote, ciudad, area_total_m2, lat, lng")
        .eq("id", loteId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const pdfBase = usePdfExtractAnalisis(lote);

  const {
    items,
    valoracionEstimada,
    scorePromedio,
    totalAnalisis,
    completados,
    isLoading,
  } = useAnalisisUnificadoEngagement(engagementId, loteId);

  const invalidarTodo = () => {
    qc.invalidateQueries({ queryKey: ["analisis-unificado", loteId, engagementId] });
    qc.invalidateQueries({ queryKey: ["analisis-normativa", loteId] });
    qc.invalidateQueries({ queryKey: ["analisis-juridico", loteId] });
    qc.invalidateQueries({ queryKey: ["analisis-ambiental", loteId] });
    qc.invalidateQueries({ queryKey: ["analisis-sspp", loteId] });
    qc.invalidateQueries({ queryKey: ["analisis-geotecnico", loteId] });
    qc.invalidateQueries({ queryKey: ["analisis-mercado", loteId] });
    qc.invalidateQueries({ queryKey: ["analisis-arquitectonico", loteId] });
    qc.invalidateQueries({ queryKey: ["analisis-financiero", loteId] });
    qc.invalidateQueries({ queryKey: ["analisis-lote-mini", loteId] });
  };

  const abrirEditor = (codigo: string, nombre: string) => {
    setAreaActiva({ codigo, nombre });
    setSheetOpen(true);
  };

  const handleMapgisApply = async (datos: any) => {
    try {
      const n = await aplicarPotANormativa(loteId, datos);
      if (n > 0) {
        toast.success(`Datos POT aplicados a Normativa (${n} campos)`);
        invalidarTodo();
      } else {
        toast.info("MapGIS no devolvió campos aplicables");
      }
    } catch (err: any) {
      toast.error("Error al aplicar POT", { description: err.message });
    }
  };

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
            <p className="font-body text-xs text-muted-foreground">Valoración estimada</p>
            <p className="font-display text-lg font-bold text-foreground">
              {fmtCOP(valoracionEstimada)}
            </p>
          </div>
          <div>
            <p className="font-body text-xs text-muted-foreground">Score promedio</p>
            <p className="font-display text-lg font-bold text-foreground">
              {scorePromedio != null ? scorePromedio.toFixed(1) : "—"}
              <span className="ml-1 text-xs text-muted-foreground">/ 10</span>
            </p>
          </div>
          <div>
            <p className="font-body text-xs text-muted-foreground">Completados</p>
            <p className="font-display text-lg font-bold text-foreground">
              {completados}{" "}
              <span className="text-xs text-muted-foreground">de {totalAnalisis}</span>
            </p>
          </div>
        </div>
        {puedeGestionar && (
          <div className="flex flex-wrap items-center gap-2">
            <ExcelAnalisisImporter loteId={loteId} loteName={lote?.nombre_lote} />
            <ExcelAnalisisExporter loteId={loteId} />
          </div>
        )}

      </Card>

      {/* MapGIS con apply real */}
      {puedeGestionar && (
        <Collapsible open={mapOpen} onOpenChange={setMapOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="outline" size="sm" className="w-full justify-between">
              <span className="inline-flex items-center gap-2">
                <MapPin className="h-3.5 w-3.5" />
                Consultar MapGIS
              </span>
              <ChevronDown
                className={`h-3.5 w-3.5 transition-transform ${mapOpen ? "rotate-180" : ""}`}
              />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-3">
            <div className="rounded-lg border border-border bg-muted/20 p-4">
              <MapGISConsulta loteId={loteId} onApply={handleMapgisApply} />
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}

      {/* Grid */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <AnalisisCardUnificada
            key={item.tipo_codigo}
            item={item}
            engagementId={engagementId}
            loteId={loteId}
            puedeGestionar={puedeGestionar}
            onEditar={puedeGestionar ? abrirEditor : undefined}
          />
        ))}
      </div>

      {/* Sheet editor */}
      {areaActiva && (
        <AnalisisEditorSheet
          open={sheetOpen}
          onOpenChange={(o) => {
            setSheetOpen(o);
            if (!o) invalidarTodo();
          }}
          loteId={loteId}
          lat={lote?.lat ?? null}
          lng={lote?.lng ?? null}
          pdfBase={pdfBase}
          codigoArea={areaActiva.codigo}
          nombreArea={areaActiva.nombre}
          onSaved={invalidarTodo}
        />
      )}
    </div>
  );
};

export default Analisis360Grid;
