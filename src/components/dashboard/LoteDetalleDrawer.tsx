import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Info, Briefcase, Users, Activity, BarChart3, ExternalLink, MapPin, ImageIcon, MapPinned, Plus, Loader2 } from "lucide-react";
import type { LoteUnificado } from "@/hooks/useDashboardUnificado";
import { useAnalisisUnificado } from "@/hooks/useAnalisisUnificado";
import { useEngagementActivoDelLote } from "@/hooks/useEngagementActivoDelLote";
import { FotoLote } from "@/components/lotes/FotoLote";
import MapaEstaticoLote from "@/components/lotes/MapaEstaticoLote";

interface Props {
  lote: LoteUnificado | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const Row = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="flex items-center justify-between gap-2 border-b border-border/40 py-1.5 text-xs">
    <span className="text-muted-foreground">{label}</span>
    <span className="font-medium text-foreground">{value ?? "—"}</span>
  </div>
);

export const LoteDetalleDrawer = ({ lote, open, onOpenChange }: Props) => {
  const { data: analisis } = useAnalisisUnificado(
    lote?.id,
    lote?.engagement_id ?? undefined,
  );

  if (!lote) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle className="truncate text-base">{lote.nombre_lote}</SheetTitle>
          <p className="truncate text-xs text-muted-foreground">
            {[lote.ciudad, lote.barrio].filter(Boolean).join(" · ") ||
              "Ubicación no especificada"}
          </p>
        </SheetHeader>

        <div className="my-3 flex flex-wrap gap-1.5">
          <Button asChild size="sm" variant="outline">
            <Link to={`/dashboard/lotes/${lote.id}/editar`}>
              Editar lote <ExternalLink className="ml-1 h-3 w-3" />
            </Link>
          </Button>
          {lote.engagement_id && (
            <Button asChild size="sm" variant="outline">
              <Link to={`/dashboard/engagements/${lote.engagement_id}`}>
                Ver engagement <ExternalLink className="ml-1 h-3 w-3" />
              </Link>
            </Button>
          )}
          <Button asChild size="sm" variant="outline">
            <Link to={`/dashboard/lotes/${lote.id}/analisis`}>
              Análisis 360° <ExternalLink className="ml-1 h-3 w-3" />
            </Link>
          </Button>
        </div>

        <Tabs defaultValue="info">
          <TabsList className="grid grid-cols-5">
            <TabsTrigger value="info" className="text-[10px]">
              <Info className="mr-1 h-3 w-3" /> Info
            </TabsTrigger>
            <TabsTrigger value="engagement" className="text-[10px]">
              <Briefcase className="mr-1 h-3 w-3" /> Engagement
            </TabsTrigger>
            <TabsTrigger value="leads" className="text-[10px]">
              <Users className="mr-1 h-3 w-3" /> Leads
            </TabsTrigger>
            <TabsTrigger value="analisis" className="text-[10px]">
              <BarChart3 className="mr-1 h-3 w-3" /> 360°
            </TabsTrigger>
            <TabsTrigger value="actividad" className="text-[10px]">
              <Activity className="mr-1 h-3 w-3" /> Actividad
            </TabsTrigger>
          </TabsList>

          <TabsContent value="info">
            <div className="relative mb-3 h-40 w-full overflow-hidden rounded-md bg-muted">
              {lote.foto_url ? (
                <>
                  <FotoLote url={lote.foto_url} alt={lote.nombre_lote} className="h-full w-full object-cover" />
                  <span className="absolute bottom-1.5 left-1.5 inline-flex items-center gap-0.5 rounded-full bg-background/70 px-1.5 py-0.5 text-[10px] font-medium text-foreground/80 backdrop-blur-sm">
                    <ImageIcon className="h-3 w-3" /> Foto
                  </span>
                </>
              ) : lote.lat != null && lote.lng != null ? (
                <>
                  <MapaEstaticoLote lat={lote.lat} lng={lote.lng} nombre={lote.nombre_lote} className="h-full w-full object-cover" />
                  <span className="absolute bottom-1.5 left-1.5 inline-flex items-center gap-0.5 rounded-full bg-background/70 px-1.5 py-0.5 text-[10px] font-medium text-foreground/80 backdrop-blur-sm">
                    <MapPinned className="h-3 w-3" /> Ubicación
                  </span>
                </>
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center gap-1 bg-gradient-to-br from-muted to-muted/60 text-muted-foreground">
                  <MapPin className="h-7 w-7 opacity-60" />
                  <span className="text-xs">
                    {[lote.ciudad, lote.barrio].filter(Boolean).join(" · ") || "Sin ubicación"}
                  </span>
                </div>
              )}
            </div>
            <div className="space-y-0.5">
              <Row
                label="Área"
                value={
                  lote.area_total_m2
                    ? `${lote.area_total_m2.toLocaleString("es-CO")} m²`
                    : "—"
                }
              />
              <Row label="Estado" value={lote.estado_publicacion} />
              <Row label="Score 360°" value={lote.score_360?.toFixed(1) ?? "—"} />
              <Row label="Resolutoría" value={lote.has_resolutoria ? "Sí" : "No"} />
              <Row label="Público" value={lote.es_publico ? "Sí" : "No"} />
              <Row label="En venta" value={lote.publicado_venta ? "Sí" : "No"} />
            </div>
          </TabsContent>

          <TabsContent value="engagement">
            {lote.engagement_id ? (
              <div className="space-y-0.5">
                <Row label="Estado" value={lote.engagement_estado} />
                <Row
                  label="Avance"
                  value={`${Math.round(lote.engagement_avance_pct ?? 0)}%`}
                />
                <Row label="Plan" value={lote.plan_nombre ?? "—"} />
                <Row label="Asesor" value={lote.asesor_nombre ?? "Sin asignar"} />
                <Row label="SLA" value={lote.sla_estado ?? "—"} />
                <Row label="Días para SLA" value={lote.dias_para_sla ?? "—"} />
              </div>
            ) : (
              <p className="py-6 text-center text-xs text-muted-foreground">
                Este lote no tiene engagement activo.
              </p>
            )}
          </TabsContent>

          <TabsContent value="leads">
            <p className="py-3 text-xs text-muted-foreground">
              {lote.leads_count} {lote.leads_count === 1 ? "lead" : "leads"} asociados
              {lote.leads_nuevos_count > 0 &&
                ` · ${lote.leads_nuevos_count} sin contactar`}
              .
            </p>
          </TabsContent>

          <TabsContent value="analisis">
            <div className="space-y-1.5">
              {(analisis ?? []).map((d) => (
                <div
                  key={d.tipo_codigo}
                  className="flex items-center justify-between rounded-md border border-border bg-background px-2.5 py-2 text-xs"
                >
                  <span className="font-medium text-foreground">{d.tipo_nombre}</span>
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                    <span>Score: {d.score?.toFixed(1) ?? "—"}</span>
                    <span className="rounded-full bg-muted px-1.5 py-0.5">
                      {d.tarea_estado ?? "—"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="actividad">
            <p className="py-6 text-center text-xs text-muted-foreground">
              Timeline de actividad reciente (próximamente).
            </p>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
};

export default LoteDetalleDrawer;
