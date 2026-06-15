import { useNavigate } from "react-router-dom";
import { CalendarDays, ChevronLeft, ExternalLink } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import EstadoEngagementBadge from "./EstadoEngagementBadge";
import { BadgeSla } from "./BadgeSla";
import type { SlaEstado } from "@/lib/sla-helpers";
import type { EngagementDetalle } from "@/hooks/useEngagementDetalle";

const PLAN_STYLES: Record<string, string> = {
  gratuito: "bg-muted text-muted-foreground",
  basico: "bg-secondary/20 text-secondary-foreground border-secondary/40",
  pro: "bg-primary/15 text-primary border-primary/30",
  premium: "bg-warning/15 text-warning border-warning/30",
};

const fmtDate = (d: string | null) =>
  d ? new Date(d).toLocaleDateString("es-CO", { year: "numeric", month: "short", day: "numeric" }) : "—";

const fmtArea = (n: number | null) =>
  n != null ? `${n.toLocaleString("es-CO")} m²` : "—";

interface Props {
  engagement: EngagementDetalle;
}

const EngagementHeader = ({ engagement }: Props) => {
  const navigate = useNavigate();
  const lote = engagement.lote;
  const plan = engagement.plan;
  const pct = Number(engagement.avance_pct ?? 0);

  // SLA semáforo simple
  let semaforo: "verde" | "amarillo" | "rojo" | null = null;
  let diasSla: number | null = null;
  if (engagement.fecha_sla_objetivo) {
    const ms = new Date(engagement.fecha_sla_objetivo).getTime() - Date.now();
    diasSla = Math.ceil(ms / (1000 * 60 * 60 * 24));
    semaforo = diasSla < 0 ? "rojo" : diasSla <= 3 ? "amarillo" : "verde";
  }

  const inicio = engagement.fecha_inicio ?? engagement.fecha_solicitud ?? engagement.created_at;
  const diasGestion = Math.max(
    0,
    Math.floor((Date.now() - new Date(inicio).getTime()) / (1000 * 60 * 60 * 24)),
  );

  return (
    <div className="space-y-4">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate("/dashboard/portafolio")}
        className="font-body"
      >
        <ChevronLeft className="h-4 w-4" /> Volver al portafolio
      </Button>

      <Card className="overflow-hidden">
        <div className="grid grid-cols-1 gap-6 p-6 md:grid-cols-2">
          {/* Izquierda — lote */}
          <div>
            <h1 className="font-display text-2xl font-semibold text-foreground">
              {lote?.nombre_lote ?? "Lote sin nombre"}
            </h1>
            <p className="mt-1 font-body text-sm text-muted-foreground">
              {[lote?.direccion, lote?.ciudad].filter(Boolean).join(", ") || "Sin dirección"}
            </p>
            <p className="mt-2 font-body text-sm text-foreground">
              Área: <span className="font-medium">{fmtArea(lote?.area_total_m2 ?? null)}</span>
            </p>
            {lote?.id && (
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => navigate(`/dashboard/lotes/${lote.id}/editar`)}
              >
                <ExternalLink className="h-4 w-4" /> Ver lote
              </Button>
            )}
          </div>

          {/* Derecha — engagement */}
          <div className="space-y-3 md:border-l md:border-border md:pl-6">
            <div>
              <p className="font-body text-xs uppercase tracking-wide text-muted-foreground">
                Plan
              </p>
              <Badge
                variant="outline"
                className={cn(
                  "mt-1 px-3 py-1 text-sm font-body",
                  PLAN_STYLES[plan?.codigo ?? ""] ?? "bg-muted",
                )}
              >
                {plan?.nombre ?? "Sin plan"}
              </Badge>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <p className="font-body text-xs uppercase tracking-wide text-muted-foreground">
                  Cliente
                </p>
                <p className="font-body text-sm text-foreground">
                  {engagement.cliente?.nombre ?? "Sin cliente registrado"}
                </p>
                {engagement.cliente?.email && (
                  <p className="font-body text-xs text-muted-foreground">{engagement.cliente.email}</p>
                )}
              </div>
              <div>
                <p className="font-body text-xs uppercase tracking-wide text-muted-foreground">
                  Asesor
                </p>
                <p className="font-body text-sm text-foreground">
                  {engagement.asesor?.nombre ?? "Sin asignar"}
                </p>
                {engagement.asesor?.email && (
                  <p className="font-body text-xs text-muted-foreground">{engagement.asesor.email}</p>
                )}
              </div>
              <div>
                <p className="font-body text-xs uppercase tracking-wide text-muted-foreground">
                  Fecha inicio
                </p>
                <p className="font-body text-sm">{fmtDate(inicio)}</p>
              </div>
              <div>
                <p className="font-body text-xs uppercase tracking-wide text-muted-foreground">
                  SLA objetivo
                </p>
                <p className="font-body text-sm">{fmtDate(engagement.fecha_sla_objetivo)}</p>
              </div>
            </div>

            <div>
              <p className="font-body text-xs uppercase tracking-wide text-muted-foreground">
                Estado
              </p>
              <div className="mt-1">
                <EstadoEngagementBadge estado={engagement.estado} />
              </div>
            </div>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 gap-4 border-t border-border bg-muted/30 p-6 sm:grid-cols-3">
          <div>
            <p className="font-body text-xs uppercase tracking-wide text-muted-foreground">
              Avance
            </p>
            <p className="mt-1 font-display text-3xl font-semibold text-foreground">
              {pct.toFixed(0)}%
            </p>
            <Progress value={pct} className="mt-2 h-2" />
          </div>
          <div>
            <p className="font-body text-xs uppercase tracking-wide text-muted-foreground">
              SLA
            </p>
            <div className="mt-2">
              <SemaforoSlaBadge semaforo={semaforo} diasParaSla={diasSla} />
            </div>
          </div>
          <div>
            <p className="font-body text-xs uppercase tracking-wide text-muted-foreground">
              Días en gestión
            </p>
            <p className="mt-1 flex items-center gap-2 font-display text-3xl font-semibold text-foreground">
              <CalendarDays className="h-6 w-6 text-muted-foreground" />
              {diasGestion}
              <span className="font-body text-base font-normal text-muted-foreground">días</span>
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default EngagementHeader;
