import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  User,
  ExternalLink,
  AlertTriangle,
  Scale,
  Leaf,
  Building,
  Coins,
  Mountain,
  TrendingUp,
  Settings,
} from "lucide-react";
import type {
  AnalisisDimension,
  TipoAnalisisCodigo,
} from "@/hooks/useAnalisisUnificado";

interface Props {
  dimension: AnalisisDimension;
  onEditar: () => void;
  size?: "sm" | "md";
}

const iconoPorTipo: Record<TipoAnalisisCodigo, any> = {
  juridico: Scale,
  ambiental: Leaf,
  arquitectonico: Building,
  financiero: Coins,
  geotecnico: Mountain,
  mercado: TrendingUp,
  sspp: Settings,
};

const labelEstadoTarea = (estado: string | null) => {
  if (!estado) return "Sin iniciar";
  const map: Record<string, string> = {
    no_aplica: "No aplica",
    pendiente: "Pendiente",
    en_progreso: "En progreso",
    en_revision: "En revisión",
    aprobado: "Aprobado",
    rechazado: "Requiere ajustes",
    entregado: "Entregado",
  };
  return map[estado] ?? estado;
};

const badgeEstadoClass = (estado: string | null) => {
  const variants: Record<string, string> = {
    pendiente: "bg-muted text-muted-foreground",
    en_progreso: "bg-primary/10 text-primary",
    en_revision: "bg-amber-100 text-amber-800",
    aprobado: "bg-emerald-100 text-emerald-700",
    entregado: "bg-emerald-200 text-emerald-800",
    rechazado: "bg-destructive/15 text-destructive",
    no_aplica: "bg-muted text-muted-foreground",
  };
  return variants[estado ?? "pendiente"] ?? variants.pendiente;
};

const colorScore = (score: number | null) => {
  if (score == null) return "text-muted-foreground";
  if (score >= 8) return "text-emerald-700";
  if (score >= 6) return "text-primary";
  return "text-amber-700";
};

const humanizarCampo = (key: string): string =>
  key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

const CAMPOS_OMITIR = new Set([
  "id",
  "lote_id",
  "created_at",
  "updated_at",
  "observaciones",
  "score",
]);

const ResumenHallazgos = ({
  hallazgos,
}: {
  hallazgos: Record<string, any>;
}) => {
  const banderas: string[] = [];
  for (const [key, val] of Object.entries(hallazgos)) {
    if (CAMPOS_OMITIR.has(key)) continue;
    if (typeof val === "boolean" && val === true) {
      banderas.push(humanizarCampo(key));
      if (banderas.length >= 3) break;
    }
  }
  if (banderas.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {banderas.map((b) => (
        <span
          key={b}
          className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-800 border border-amber-200"
        >
          <AlertTriangle className="h-3 w-3" />
          {b}
        </span>
      ))}
    </div>
  );
};

export const AnalisisCard = ({ dimension, onEditar, size = "md" }: Props) => {
  const Icon = iconoPorTipo[dimension.tipo_codigo] ?? Settings;
  const tieneHallazgos = dimension.hallazgos != null;
  const tieneTarea = dimension.tarea_id != null;

  return (
    <Card className="p-4 flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className="rounded-md bg-primary/10 p-2 shrink-0">
            <Icon className="h-4 w-4 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="font-body text-sm font-semibold text-foreground truncate">
              {dimension.tipo_nombre}
            </p>
            <Badge
              variant="secondary"
              className={`mt-1 text-[10px] ${badgeEstadoClass(dimension.tarea_estado)}`}
            >
              {labelEstadoTarea(dimension.tarea_estado)}
            </Badge>
          </div>
        </div>
        {dimension.score != null && (
          <div className="text-right shrink-0">
            <p className={`text-xl font-bold leading-none ${colorScore(dimension.score)}`}>
              {dimension.score.toFixed(1)}
            </p>
            <p className="text-[10px] text-muted-foreground mt-1">Score</p>
          </div>
        )}
      </div>

      {/* Avance */}
      {tieneTarea && (
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
            <span>Avance</span>
            <span>{Math.round(dimension.tarea_avance_pct)}%</span>
          </div>
          <Progress value={dimension.tarea_avance_pct} className="h-1.5" />
        </div>
      )}

      {/* Responsable */}
      {dimension.responsable_nombre && (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <User className="h-3 w-3" />
          <span className="truncate">{dimension.responsable_nombre}</span>
        </div>
      )}

      {/* Hallazgos */}
      {tieneHallazgos && size !== "sm" && (
        <ResumenHallazgos hallazgos={dimension.hallazgos as Record<string, any>} />
      )}

      {/* CTA */}
      <Button
        variant="outline"
        size="sm"
        className="mt-auto w-full justify-center"
        onClick={onEditar}
      >
        <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
        {tieneHallazgos ? "Ver y editar análisis" : "Iniciar análisis"}
      </Button>
    </Card>
  );
};

export default AnalisisCard;
