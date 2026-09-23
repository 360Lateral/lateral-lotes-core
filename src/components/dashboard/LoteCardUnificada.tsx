import { Briefcase, Users, MapPin, User, Award, AlertCircle, Check, Send, ImageIcon, MapPinned, Plus, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { FotoLote } from "@/components/lotes/FotoLote";
import MapaEstaticoLote from "@/components/lotes/MapaEstaticoLote";
import { BadgeSla } from "@/components/portafolio/BadgeSla";
import { useEngagementActivoDelLote } from "@/hooks/useEngagementActivoDelLote";
import type { LoteUnificado } from "@/hooks/useDashboardUnificado";
import type { SlaEstado } from "@/lib/sla-helpers";
import { formatMetros, formatCOPCompact } from "@/lib/format-moneda";

interface Props {
  lote: LoteUnificado;
  onClick: () => void;
  selected?: boolean;
  onToggleSelect?: () => void;
}

const colorBordeIzq = (l: LoteUnificado): string => {
  if (l.sla_estado === "atrasado" && !l.sla_cumplido) return "border-l-destructive";
  if (l.sla_cumplido) return "border-l-green-600";
  if (l.sla_estado === "riesgo_fecha" || l.sla_estado === "riesgo_ritmo")
    return "border-l-primary";
  if (l.estado_publicacion === "pendiente_validacion") return "border-l-amber-500";
  return "border-l-transparent";
};

const labelEstadoEngagement = (estado: string | null): string => {
  if (!estado) return "Sin engagement";
  return (
    {
      prospecto: "Prospecto",
      activo: "En progreso",
      en_revision: "En revisión",
      entregado: "Entregado",
      cerrado: "Cerrado",
      cancelado: "Cancelado",
    } as Record<string, string>
  )[estado] ?? estado;
};

export const LoteCardUnificada = ({ lote, onClick, selected, onToggleSelect }: Props) => {
  const tieneEngagement = !!lote.engagement_id;
  const tieneLeads = lote.leads_count > 0;
  const porValidar = lote.estado_publicacion === "pendiente_validacion";
  const { data: engagementActivoId, isLoading: loadingEngagement } =
    useEngagementActivoDelLote(lote.id);

  const ubicacion = [lote.ciudad, lote.barrio].filter(Boolean).join(" · ");
  const estadoPill = porValidar
    ? { label: "Por validar", cls: "bg-warning text-white" }
    : lote.publicado_venta && lote.estado_publicacion === "aprobado"
      ? { label: "En venta", cls: "bg-card/95 text-secondary" }
      : lote.estado_publicacion === "rechazado"
        ? { label: "Rechazado", cls: "bg-destructive text-destructive-foreground" }
        : { label: "Privado", cls: "bg-secondary text-secondary-foreground" };
  const avance = lote.engagement_avance_pct;

  return (
    <article
      onClick={onClick}
      className={`group relative cursor-pointer overflow-hidden rounded-3xl border border-border border-l-4 bg-card shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-xl ${colorBordeIzq(
        lote,
      )} ${selected ? "ring-2 ring-primary" : ""}`}
    >
      {onToggleSelect && (
        <button
          type="button"
          aria-label={selected ? "Quitar selección" : "Seleccionar"}
          onClick={(e) => {
            e.stopPropagation();
            onToggleSelect();
          }}
          className="absolute right-3 top-3 z-10 flex h-6 w-6 items-center justify-center rounded-md border border-border bg-card/95 shadow-sm"
        >
          {selected && <Check className="h-3.5 w-3.5 text-primary" />}
        </button>
      )}

      <div className="relative h-44 w-full overflow-hidden bg-muted">
        {lote.foto_url ? (
          <FotoLote url={lote.foto_url} alt={lote.nombre_lote} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
        ) : lote.lat != null && lote.lng != null ? (
          <MapaEstaticoLote lat={lote.lat} lng={lote.lng} nombre={lote.nombre_lote} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-1 bg-gradient-to-br from-muted to-muted/60 px-3 text-center text-muted-foreground">
            <MapPin className="h-7 w-7 opacity-50" />
            <span className="line-clamp-2 text-[11px]">{ubicacion || "Sin ubicación"}</span>
          </div>
        )}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-foreground/40 via-transparent to-transparent" />

        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          <span className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-bold uppercase tracking-wide shadow-sm ${estadoPill.cls}`}>
            {porValidar && <AlertCircle className="h-3 w-3" />}
            {estadoPill.label}
          </span>
          {lote.has_resolutoria && (
            <span className="inline-flex items-center gap-1 rounded-md bg-primary px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-primary-foreground shadow-sm">
              <Award className="h-3 w-3" /> Resolutoría
            </span>
          )}
        </div>

        <div className="absolute bottom-3 left-3">
          <span className="inline-flex items-center gap-1 rounded-full bg-card/80 px-2 py-0.5 text-[10px] font-medium text-foreground/80 backdrop-blur-sm">
            {lote.foto_url ? <ImageIcon className="h-3 w-3" /> : <MapPinned className="h-3 w-3" />}
            {lote.foto_url ? "Foto" : "Ubicación"}
          </span>
        </div>

        <div className="absolute bottom-3 right-3 flex flex-col items-end gap-1.5">
          {tieneEngagement && lote.sla_estado && (
            <BadgeSla estado={lote.sla_estado as SlaEstado} diasParaSla={lote.dias_para_sla} size="xs" />
          )}
          {lote.score_360 != null && (
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-card/95 px-2.5 py-1 text-xs font-bold text-secondary shadow-sm">
              <span className="h-2 w-2 rounded-full bg-primary" />
              Score 360: {lote.score_360.toFixed(1)}
            </span>
          )}
        </div>
      </div>

      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate text-lg font-bold leading-tight text-foreground">{lote.nombre_lote}</h3>
            <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-muted-foreground">
              <MapPin className="h-3 w-3 shrink-0" />
              {ubicacion || "—"}
            </p>
          </div>
          {lote.precio_venta_estimado != null && (
            <div className="shrink-0 text-right">
              <p className="text-lg font-bold text-primary">{formatCOPCompact(lote.precio_venta_estimado)}</p>
              <p className="text-[10px] text-muted-foreground">COP</p>
            </div>
          )}
        </div>

        <div className="my-4 grid grid-cols-3 gap-2 border-y border-border/60 py-3">
          <div className="text-center">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Área</p>
            <p className="text-sm font-semibold text-foreground">
              {lote.area_total_m2 ? formatMetros(lote.area_total_m2) : "—"}
            </p>
          </div>
          <div className="text-center">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Leads</p>
            <p className="text-sm font-semibold text-foreground">
              {lote.leads_count}
              {lote.leads_nuevos_count > 0 && (
                <span className="ml-1 rounded-full bg-primary px-1.5 text-[9px] font-bold text-primary-foreground">
                  +{lote.leads_nuevos_count}
                </span>
              )}
            </p>
          </div>
          <div className="text-center">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Avance</p>
            <p className="text-sm font-semibold text-foreground">
              {avance != null ? `${Math.round(avance)}%` : "—"}
            </p>
          </div>
        </div>

        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted">
              <User className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
            <span className="truncate text-xs text-muted-foreground">
              {lote.asesor_nombre ?? (tieneEngagement ? "Sin asesor" : labelEstadoEngagement(null))}
            </span>
          </div>
          <div className="flex flex-wrap gap-1">
            {tieneEngagement && (
              <span className="inline-flex items-center gap-1 rounded-full bg-secondary/10 px-2 py-0.5 text-[10px] font-semibold text-secondary">
                <Briefcase className="h-3 w-3" />
                {labelEstadoEngagement(lote.engagement_estado)}
              </span>
            )}
            {lote.tiene_entregables_borrador && (
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold text-primary">
                <Send className="h-3 w-3" /> Sin publicar
              </span>
            )}
          </div>
        </div>

        <div onClick={(e) => e.stopPropagation()}>
          {loadingEngagement ? (
            <Button size="sm" variant="outline" disabled className="h-9 w-full gap-1 rounded-xl text-xs">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            </Button>
          ) : engagementActivoId ? (
            <Button asChild size="sm" className="h-9 w-full gap-1.5 rounded-xl text-xs font-bold">
              <Link to={`/dashboard/engagements/${engagementActivoId}`}>
                <Briefcase className="h-3.5 w-3.5" /> Abrir engagement
              </Link>
            </Button>
          ) : (
            <Button asChild size="sm" variant="outline" className="h-9 w-full gap-1.5 rounded-xl text-xs font-bold">
              <Link to={`/dashboard/lotes/${lote.id}/editar#engagement`}>
                <Plus className="h-3.5 w-3.5" /> Crear engagement
              </Link>
            </Button>
          )}
        </div>
      </div>
    </article>
  );
};

export default LoteCardUnificada;
