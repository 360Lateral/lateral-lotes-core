import {
  Calculator,
  DollarSign,
  FileText,
  LayoutGrid,
  Leaf,
  Loader2,
  Mountain,
  Plug,
  Scale,
  Target,
  TrendingUp,
  Inbox,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useActualizarTareaEstado } from "@/hooks/useActualizarTareaEstado";
import type { EstadoTarea, TareaAnalisis } from "@/hooks/useTareasEngagement";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  juridico: Scale,
  ambiental: Leaf,
  sspp: Plug,
  geotecnico: Mountain,
  mercado: TrendingUp,
  arquitectonico: LayoutGrid,
  financiero: Calculator,
  normativo: FileText,
  valoracion: DollarSign,
  score_viabilidad: Target,
};

const ESTADO_LABELS: Record<EstadoTarea, string> = {
  no_aplica: "No aplica",
  pendiente: "Pendiente",
  en_progreso: "En progreso",
  en_revision: "En revisión",
  aprobado: "Aprobado",
  rechazado: "Rechazado",
  entregado: "Entregado",
};

const FACTOR: Record<EstadoTarea, number> = {
  no_aplica: 0,
  pendiente: 0,
  en_progreso: 40,
  en_revision: 70,
  aprobado: 90,
  rechazado: 0,
  entregado: 100,
};

const fmtDateTime = (d: string) =>
  new Date(d).toLocaleString("es-CO", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

interface Props {
  tareas: TareaAnalisis[];
  engagementId: string;
}

const TareasAnalisisList = ({ tareas, engagementId }: Props) => {
  const mutation = useActualizarTareaEstado(engagementId);

  if (!tareas.length) {
    return (
      <Card className="flex flex-col items-center gap-2 py-12 text-muted-foreground">
        <Inbox className="h-8 w-8" />
        <p className="font-body text-sm">Este engagement no tiene tareas de análisis configuradas.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {tareas.map((t) => {
        const codigo = t.tipo_analisis?.codigo ?? "";
        const Icon = ICON_MAP[codigo] ?? FileText;
        const factor = FACTOR[t.estado] ?? 0;
        const isDone = t.estado === "entregado" || t.estado === "aprobado";
        const isRejected = t.estado === "rechazado";
        const isUpdating =
          mutation.isPending && mutation.variables?.tareaId === t.id;

        return (
          <Card
            key={t.id}
            className={cn(
              "p-4 transition-colors",
              isDone && "border-l-4 border-l-success",
              isRejected && "border-l-4 border-l-destructive",
            )}
          >
            <div className="flex flex-col gap-4 md:flex-row md:items-center">
              <div className="flex flex-1 items-start gap-3">
                <div className="rounded-md bg-muted p-2 text-muted-foreground">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-body text-sm font-semibold text-foreground">
                    {t.tipo_analisis?.nombre ?? "Análisis"}
                  </h3>
                  <p className="font-body text-xs text-muted-foreground">
                    Actualizado: {fmtDateTime(t.updated_at)}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <span
                  className={cn(
                    "rounded-full border px-2.5 py-0.5 font-body text-xs",
                    isRejected
                      ? "border-destructive/30 bg-destructive/10 text-destructive"
                      : factor >= 90
                        ? "border-success/30 bg-success/10 text-success"
                        : factor > 0
                          ? "border-warning/30 bg-warning/10 text-warning"
                          : "border-border bg-muted text-muted-foreground",
                  )}
                >
                  {factor}% al avance
                </span>

                <div className="flex items-center gap-2">
                  {isUpdating && (
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  )}
                  <Select
                    value={t.estado}
                    disabled={isUpdating}
                    onValueChange={(v) =>
                      mutation.mutate({ tareaId: t.id, nuevoEstado: v as EstadoTarea })
                    }
                  >
                    <SelectTrigger className="h-9 w-[160px] font-body">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.keys(ESTADO_LABELS) as EstadoTarea[]).map((e) => (
                        <SelectItem key={e} value={e}>
                          {ESTADO_LABELS[e]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
};

export default TareasAnalisisList;
