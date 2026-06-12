import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface PasoTimeline {
  key: string;
  label: string;
  fecha?: string | null;
  estado: "completado" | "actual" | "pendiente";
}

interface Props {
  pasos: PasoTimeline[];
}

const TimelineProcesoEngagement = ({ pasos }: Props) => {
  if (pasos.length === 0) return null;
  const idxActual = pasos.findIndex((p) => p.estado === "actual");
  const todosCompletados = pasos.every((p) => p.estado === "completado");
  const progreso = todosCompletados
    ? 100
    : idxActual >= 0
      ? (idxActual / Math.max(1, pasos.length - 1)) * 100
      : 0;

  return (
    <div className="relative w-full pt-2">
      {/* track */}
      <div className="absolute left-0 right-0 top-5 h-0.5 bg-border" />
      {/* progress */}
      <div
        className="absolute left-0 top-5 h-0.5 bg-primary transition-all"
        style={{ width: `${progreso}%` }}
      />
      <div className="relative grid" style={{ gridTemplateColumns: `repeat(${pasos.length}, minmax(0, 1fr))` }}>
        {pasos.map((p) => {
          const completado = p.estado === "completado";
          const actual = p.estado === "actual";
          return (
            <div key={p.key} className="flex flex-col items-center gap-1.5 px-0.5 text-center">
              <div
                className={cn(
                  "z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 bg-background transition-colors",
                  completado && "border-primary bg-primary text-primary-foreground",
                  actual && "border-primary text-primary",
                  !completado && !actual && "border-border text-muted-foreground",
                )}
              >
                {completado ? (
                  <Check className="h-4 w-4" />
                ) : actual ? (
                  <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-primary" />
                ) : (
                  <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60" />
                )}
              </div>
              <span
                className={cn(
                  "text-[11px] font-medium leading-tight sm:text-xs",
                  (completado || actual) ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {p.label}
              </span>
              {p.fecha && (
                <span className="text-[10px] text-muted-foreground">{p.fecha}</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TimelineProcesoEngagement;
