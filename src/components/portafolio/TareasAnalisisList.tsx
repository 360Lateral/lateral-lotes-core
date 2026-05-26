import { useState } from "react";
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
  Plus,
  ExternalLink,
  Paperclip,
  User as UserIcon,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useActualizarTareaEstado } from "@/hooks/useActualizarTareaEstado";
import { useFirmarUrlEntregable } from "@/hooks/useFirmarUrlEntregable";
import type { EstadoTarea, TareaAnalisis } from "@/hooks/useTareasEngagement";
import type { Entregable } from "@/hooks/useEntregablesEngagement";
import SubirEntregableDialog from "@/components/entregables/SubirEntregableDialog";
import TipoEntregableIcon from "@/components/entregables/TipoEntregableIcon";

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

interface ChipEntregableProps {
  entregable: Entregable;
}

const ChipEntregable = ({ entregable }: ChipEntregableProps) => {
  const { firmar } = useFirmarUrlEntregable();
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    try {
      setLoading(true);
      let url = entregable.url_externa;
      if (!url) url = await firmar(entregable.id);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (e: any) {
      toast.error(e?.message ?? "No se pudo abrir el archivo");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className="inline-flex max-w-[220px] items-center gap-1.5 rounded-full border border-border bg-muted/50 px-2.5 py-1 font-body text-xs text-foreground transition-colors hover:bg-muted disabled:opacity-60"
      aria-label={`Abrir ${entregable.nombre}`}
    >
      {loading ? (
        <Loader2 className="h-3 w-3 shrink-0 animate-spin" />
      ) : entregable.url_externa ? (
        <ExternalLink className="h-3 w-3 shrink-0" />
      ) : (
        <TipoEntregableIcon tipo={entregable.tipo} size={12} />
      )}
      <span className="truncate">{entregable.nombre}</span>
    </button>
  );
};

interface Props {
  tareas: TareaAnalisis[];
  engagementId: string;
  ligadosPorAnalisis?: Record<string, Entregable[]>;
  puedeSubir?: boolean;
}

const TareasAnalisisList = ({
  tareas,
  engagementId,
  ligadosPorAnalisis = {},
  puedeSubir = false,
}: Props) => {
  const mutation = useActualizarTareaEstado(engagementId);
  const [dialogTareaId, setDialogTareaId] = useState<string | null>(null);

  if (!tareas.length) {
    return (
      <Card className="flex flex-col items-center gap-2 py-12 text-muted-foreground">
        <Inbox className="h-8 w-8" />
        <p className="font-body text-sm">
          Este engagement no tiene tareas de análisis configuradas.
        </p>
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
        const ligados = ligadosPorAnalisis[t.tipo_analisis_id] ?? [];

        return (
          <Card
            key={t.id}
            className={cn(
              "p-4 transition-colors",
              isDone && "border-l-4 border-l-success",
              isRejected && "border-l-4 border-l-destructive",
            )}
          >
            <div className="flex flex-col gap-4 md:flex-row md:items-start">
              <div className="flex flex-1 items-start gap-3">
                <div className="rounded-md bg-muted p-2 text-muted-foreground">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-body text-sm font-semibold text-foreground">
                    {t.tipo_analisis?.nombre ?? "Análisis"}
                  </h3>
                  <p className="mt-0.5 flex items-center gap-1.5 font-body text-xs">
                    <UserIcon className="h-3 w-3 text-muted-foreground" />
                    {t.responsable?.nombre ? (
                      <span className="text-foreground">{t.responsable.nombre}</span>
                    ) : (
                      <span className="text-muted-foreground">Sin asignar</span>
                    )}
                  </p>
                  <p className="mt-0.5 font-body text-xs text-muted-foreground">
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

            {(ligados.length > 0 || puedeSubir) && (
              <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border pt-3">
                <Paperclip className="h-3.5 w-3.5 text-muted-foreground" />
                {ligados.length === 0 && (
                  <span className="font-body text-xs text-muted-foreground">
                    Sin archivos soporte aún.
                  </span>
                )}
                {ligados.map((e) => (
                  <ChipEntregable key={e.id} entregable={e} />
                ))}
                {puedeSubir && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs"
                    onClick={() => setDialogTareaId(t.id)}
                  >
                    <Plus className="h-3.5 w-3.5" /> Archivo
                  </Button>
                )}
              </div>
            )}

            {puedeSubir && (
              <SubirEntregableDialog
                engagementId={engagementId}
                open={dialogTareaId === t.id}
                onOpenChange={(v) => setDialogTareaId(v ? t.id : null)}
                tipoForzado="documento_soporte"
                tipoAnalisisId={t.tipo_analisis_id}
              />
            )}
          </Card>
        );
      })}
    </div>
  );
};

export default TareasAnalisisList;
