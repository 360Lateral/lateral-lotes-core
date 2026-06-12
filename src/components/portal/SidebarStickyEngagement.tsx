import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Mail, Calendar, CalendarCheck, Activity, MessageSquare, FileText, CheckCircle2 } from "lucide-react";
import { formatRelativeDate } from "@/lib/formatRelativeDate";
import type { EventoEngagement } from "@/hooks/cliente/useActividadEngagement";

interface Props {
  asesor: { nombre: string | null; email?: string | null; especialidad?: string | null } | null;
  fechaInicio?: string | null;
  fechaEntregaEstimada?: string | null;
  avancePct: number;
  onContactarAsesor: () => void;
  iniciales: string;
  actividad: EventoEngagement[];
}

const iconoEvento = (tipo: EventoEngagement["tipo"]) => {
  if (tipo === "entregable_publicado") return <FileText className="h-3.5 w-3.5" />;
  if (tipo === "tarea_completada") return <CheckCircle2 className="h-3.5 w-3.5" />;
  return <MessageSquare className="h-3.5 w-3.5" />;
};

const SidebarStickyEngagement = ({
  asesor,
  fechaInicio,
  fechaEntregaEstimada,
  avancePct,
  onContactarAsesor,
  iniciales,
  actividad,
}: Props) => {
  return (
    <aside className="space-y-4 lg:sticky lg:top-20">
      {/* Asesor */}
      <div className="rounded-lg border border-border bg-card p-4">
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Tu asesor asignado
        </h3>
        {asesor ? (
          <>
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                <AvatarFallback className="bg-primary/10 text-primary">
                  {iniciales}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="truncate font-medium">{asesor.nombre ?? "Experto"}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {asesor.especialidad ?? "Experto 360Lateral"}
                </p>
              </div>
            </div>
            <Button onClick={onContactarAsesor} className="mt-4 w-full">
              <Mail className="mr-2 h-4 w-4" /> Contactar asesor
            </Button>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">Por asignar</p>
        )}
      </div>

      {/* Resumen del proceso */}
      <div className="rounded-lg border border-border bg-card p-4">
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Resumen del proceso
        </h3>
        <div className="space-y-3 text-sm">
          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" /> Inicio
            </span>
            <span className="font-medium">{fechaInicio ?? "—"}</span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <CalendarCheck className="h-3.5 w-3.5" /> Entrega
            </span>
            <span className="font-medium">{fechaEntregaEstimada ?? "—"}</span>
          </div>
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Avance</span>
              <span className="font-semibold">{Math.round(avancePct)}%</span>
            </div>
            <Progress value={avancePct} className="h-2" />
          </div>
        </div>
      </div>

      {/* Actividad reciente */}
      <div className="rounded-lg border border-border bg-card p-4">
        <h3 className="mb-3 flex items-center gap-1.5 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          <Activity className="h-3.5 w-3.5" /> Actividad reciente
        </h3>
        {actividad.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sin actividad reciente todavía.</p>
        ) : (
          <ul className="space-y-3">
            {actividad.slice(0, 5).map((ev) => (
              <li key={ev.id} className="flex items-start gap-2.5">
                <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  {iconoEvento(ev.tipo)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs leading-snug text-foreground">{ev.titulo}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {formatRelativeDate(ev.fecha)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
};

export default SidebarStickyEngagement;
