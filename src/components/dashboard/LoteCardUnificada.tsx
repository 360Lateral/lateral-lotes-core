import { Briefcase, Users, MapPin, User, Award, AlertCircle, Check, Send, ImageIcon, MapPinned, Plus, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { FotoLote } from "@/components/lotes/FotoLote";
import MapaEstaticoLote from "@/components/lotes/MapaEstaticoLote";
import { BadgeSla } from "@/components/portafolio/BadgeSla";
import { useEngagementActivoDelLote } from "@/hooks/useEngagementActivoDelLote";
import type { LoteUnificado } from "@/hooks/useDashboardUnificado";
import type { SlaEstado } from "@/lib/sla-helpers";

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

  return (
    <article
      onClick={onClick}
      className={`group relative cursor-pointer overflow-hidden rounded-md border border-border border-l-4 bg-background transition-shadow hover:shadow-md ${colorBordeIzq(
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
          className="absolute right-2 top-2 z-10 flex h-5 w-5 items-center justify-center rounded border border-border bg-background/95"
        >
          {selected && <Check className="h-3 w-3 text-primary" />}
        </button>
      )}

      <div className="relative h-32 w-full overflow-hidden bg-muted">
        {lote.foto_url ? (
          <>
            <FotoLote
              url={lote.foto_url}
              alt={lote.nombre_lote}
              className="h-full w-full object-cover"
            />
            <span className="absolute bottom-1.5 left-1.5 inline-flex items-center gap-0.5 rounded-full bg-background/70 px-1.5 py-0.5 text-[9px] font-medium text-foreground/80 backdrop-blur-sm">
              <ImageIcon className="h-2.5 w-2.5" /> Foto
            </span>
          </>
        ) : lote.lat != null && lote.lng != null ? (
          <>
            <MapaEstaticoLote
              lat={lote.lat}
              lng={lote.lng}
              nombre={lote.nombre_lote}
              className="h-full w-full object-cover"
            />
            <span className="absolute bottom-1.5 left-1.5 inline-flex items-center gap-0.5 rounded-full bg-background/70 px-1.5 py-0.5 text-[9px] font-medium text-foreground/80 backdrop-blur-sm">
              <MapPinned className="h-2.5 w-2.5" /> Ubicación
            </span>
          </>
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-1 bg-gradient-to-br from-muted to-muted/60 px-3 text-center text-muted-foreground">
            <MapPin className="h-6 w-6 opacity-60" />
            <span className="line-clamp-2 text-[10px]">
              {[lote.ciudad, lote.barrio].filter(Boolean).join(" · ") || "Sin ubicación"}
            </span>
          </div>
        )}
        <div className="absolute left-2 top-2 flex flex-col gap-1">
          {lote.score_360 != null && (
            <span className="rounded-full bg-background/95 px-1.5 py-0.5 text-[9px] font-semibold text-foreground shadow-sm">
              Score {lote.score_360.toFixed(1)}
            </span>
          )}
          {lote.has_resolutoria && (
            <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-500/95 px-1.5 py-0.5 text-[9px] font-semibold text-white shadow-sm">
              <Award className="h-2.5 w-2.5" /> Resolutoría
            </span>
          )}
        </div>
        <div className="absolute right-2 bottom-2 flex flex-col items-end gap-1">
          {porValidar && (
            <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-500 px-1.5 py-0.5 text-[9px] font-semibold text-white shadow-sm">
              <AlertCircle className="h-2.5 w-2.5" /> Por validar
            </span>
          )}
          {tieneEngagement && lote.sla_estado && (
            <BadgeSla
              estado={lote.sla_estado as SlaEstado}
              diasParaSla={lote.dias_para_sla}
              size="xs"
            />
          )}
        </div>
      </div>

      <div className="space-y-1.5 p-2.5">
        <h3 className="truncate text-sm font-semibold text-foreground">
          {lote.nombre_lote}
        </h3>
        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
          <MapPin className="h-3 w-3 shrink-0" />
          <span className="truncate">
            {[lote.ciudad, lote.barrio].filter(Boolean).join(" · ") || "—"}
            {lote.area_total_m2 && (
              <> · {lote.area_total_m2.toLocaleString("es-CO")} m²</>
            )}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-1">
          {tieneEngagement && (
            <span className="inline-flex items-center gap-0.5 rounded-full bg-secondary/10 px-1.5 py-0.5 text-[9px] font-medium text-secondary">
              <Briefcase className="h-2.5 w-2.5" />
              {labelEstadoEngagement(lote.engagement_estado)}
            </span>
          )}
          {tieneLeads && (
            <span className="inline-flex items-center gap-0.5 rounded-full bg-blue-100 px-1.5 py-0.5 text-[9px] font-medium text-blue-700">
              <Users className="h-2.5 w-2.5" />
              {lote.leads_count} {lote.leads_count === 1 ? "lead" : "leads"}
              {lote.leads_nuevos_count > 0 && (
                <span className="ml-0.5 rounded-full bg-blue-700 px-1 text-[8px] text-white">
                  {lote.leads_nuevos_count}
                </span>
              )}
            </span>
          )}
          {lote.tiene_entregables_borrador && (
            <span className="inline-flex items-center gap-0.5 rounded-full bg-primary/15 px-1.5 py-0.5 text-[9px] font-medium text-primary">
              <Send className="h-2.5 w-2.5" /> Sin publicar
            </span>
          )}
        </div>

        {tieneEngagement && lote.engagement_avance_pct != null && (
          <div className="space-y-0.5 pt-1">
            <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full bg-primary"
                style={{ width: `${Math.min(100, lote.engagement_avance_pct)}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[10px] text-muted-foreground">
              <span>{Math.round(lote.engagement_avance_pct)}%</span>
              <span className="flex items-center gap-0.5 truncate">
                <User className="h-2.5 w-2.5" />
                {lote.asesor_nombre ?? <em className="not-italic">Sin asesor</em>}
              </span>
            </div>
          </div>
        )}
      </div>
    </article>
  );
};

export default LoteCardUnificada;
