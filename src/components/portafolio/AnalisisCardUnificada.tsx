import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Building,
  Coins,
  ExternalLink,
  Leaf,
  Loader2,
  Mountain,
  Paperclip,
  Plus,
  Scale,
  Settings,
  TrendingUp,
  User as UserIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import ChipEntregable from "@/components/entregables/ChipEntregable";
import SubirEntregableDialog from "@/components/entregables/SubirEntregableDialog";
import { useActualizarTareaEstado } from "@/hooks/useActualizarTareaEstado";
import type {
  EstadoTareaUnif,
  TipoAnalisisCodigo,
} from "@/hooks/useAnalisisUnificado";
import type { AnalisisItemUnificado } from "@/hooks/useAnalisisUnificadoEngagement";

interface Props {
  item: AnalisisItemUnificado;
  engagementId: string;
  loteId: string;
  puedeGestionar: boolean;
}

const ICON_MAP: Record<TipoAnalisisCodigo, any> = {
  juridico: Scale,
  ambiental: Leaf,
  arquitectonico: Building,
  financiero: Coins,
  geotecnico: Mountain,
  mercado: TrendingUp,
  sspp: Settings,
};

const ESTADO_LABELS: Record<EstadoTareaUnif, string> = {
  no_aplica: "No aplica",
  pendiente: "Pendiente",
  en_progreso: "En progreso",
  en_revision: "En revisión",
  aprobado: "Aprobado",
  rechazado: "Requiere ajustes",
  entregado: "Entregado",
};

const badgeClass = (estado: EstadoTareaUnif | null) => {
  switch (estado) {
    case "aprobado":
    case "entregado":
      return "bg-emerald-100 text-emerald-700 border-emerald-200";
    case "en_revision":
      return "bg-amber-100 text-amber-800 border-amber-200";
    case "en_progreso":
      return "bg-primary/10 text-primary border-primary/20";
    case "rechazado":
      return "bg-destructive/10 text-destructive border-destructive/20";
    default:
      return "bg-muted text-muted-foreground border-border";
  }
};

const scoreColor = (s: number | null) => {
  if (s == null) return "text-muted-foreground";
  if (s >= 8) return "text-emerald-700";
  if (s >= 6) return "text-primary";
  return "text-amber-700";
};

const fmtFecha = (d: string | null) =>
  d
    ? new Date(d).toLocaleDateString("es-CO", {
        day: "2-digit",
        month: "short",
      })
    : null;

const AnalisisCardUnificada = ({
  item,
  engagementId,
  loteId,
  puedeGestionar,
}: Props) => {
  const Icon = ICON_MAP[item.tipo_codigo] ?? Settings;
  const navigate = useNavigate();
  const [dialogOpen, setDialogOpen] = useState(false);
  const mutation = useActualizarTareaEstado(engagementId);
  const isUpdating =
    mutation.isPending && mutation.variables?.tareaId === item.tarea_id;
  const fechaLimite = fmtFecha(item.fecha_objetivo);

  if (!item.incluido_en_plan) {
    return (
      <Card className="flex flex-col gap-2 p-4 opacity-60">
        <div className="flex items-center gap-3">
          <div className="rounded-md bg-muted p-2">
            <Icon className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="font-body text-sm font-semibold text-muted-foreground">
            {item.tipo_nombre}
          </p>
        </div>
        <p className="font-body text-xs text-muted-foreground">
          No incluido en este plan.
        </p>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col gap-3 p-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <div className="shrink-0 rounded-md bg-primary/10 p-2">
            <Icon className="h-4 w-4 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="truncate font-body text-sm font-semibold text-foreground">
              {item.tipo_nombre}
            </p>
            <Badge
              variant="secondary"
              className={cn("mt-1 border text-[10px]", badgeClass(item.tarea_estado))}
            >
              {item.tarea_estado ? ESTADO_LABELS[item.tarea_estado] : "Sin iniciar"}
            </Badge>
          </div>
        </div>
        {item.score != null && (
          <div className="shrink-0 text-right">
            <p
              className={cn(
                "font-display text-2xl font-bold leading-none",
                scoreColor(item.score),
              )}
            >
              {item.score.toFixed(1)}
            </p>
            <p className="mt-0.5 text-[10px] text-muted-foreground">Score</p>
          </div>
        )}
      </div>

      {/* Avance */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
          <span>Avance</span>
          <span>{item.factor_avance}%</span>
        </div>
        <Progress value={item.factor_avance} className="h-1.5" />
      </div>

      {/* Meta info */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <UserIcon className="h-3 w-3" />
          {item.responsable_nombre ?? (
            <span className="italic">Sin asignar</span>
          )}
        </span>
        {fechaLimite && <span>Vence: {fechaLimite}</span>}
      </div>

      {/* Entregables */}
      {item.entregables.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 border-t border-border pt-2">
          <Paperclip className="h-3 w-3 text-muted-foreground" />
          {item.entregables.slice(0, 3).map((e) => (
            <ChipEntregable key={e.id} entregable={e} />
          ))}
          {item.entregables.length > 3 && (
            <span className="font-body text-[10px] text-muted-foreground">
              +{item.entregables.length - 3} más
            </span>
          )}
        </div>
      )}

      {/* Acciones */}
      {puedeGestionar && (
        <div className="mt-auto flex flex-wrap items-center gap-2 border-t border-border pt-3">
          {item.tarea_id && (
            <div className="flex items-center gap-1.5">
              {isUpdating && (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
              )}
              <Select
                value={item.tarea_estado ?? "pendiente"}
                disabled={isUpdating}
                onValueChange={(v) =>
                  mutation.mutate({
                    tareaId: item.tarea_id!,
                    nuevoEstado: v as EstadoTareaUnif,
                  })
                }
              >
                <SelectTrigger className="h-8 w-[140px] font-body text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(ESTADO_LABELS) as EstadoTareaUnif[]).map((e) => (
                    <SelectItem key={e} value={e}>
                      {ESTADO_LABELS[e]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2 text-xs"
            onClick={() => setDialogOpen(true)}
          >
            <Plus className="mr-1 h-3 w-3" />
            Entregable
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="ml-auto h-8 px-2 text-xs"
            onClick={() =>
              navigate(
                `/dashboard/lotes/${loteId}/analisis?tipo=${item.tipo_codigo}`,
              )
            }
          >
            Editar datos
            <ExternalLink className="ml-1 h-3 w-3" />
          </Button>
        </div>
      )}

      {puedeGestionar && (
        <SubirEntregableDialog
          engagementId={engagementId}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          tipoForzado="documento_soporte"
          tipoAnalisisId={item.tipo_analisis_id}
        />
      )}
    </Card>
  );
};

export default AnalisisCardUnificada;
