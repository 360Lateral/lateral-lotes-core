import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import type { PortafolioVistaFila } from "@/hooks/useVistaPortafolio";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { MapPin, User, Clock, AlertTriangle } from "lucide-react";

interface Props {
  filas: PortafolioVistaFila[];
}

const COLUMNAS: { key: string; label: string; color: string }[] = [
  { key: "pendiente", label: "Pendiente", color: "bg-muted/40" },
  { key: "prospecto", label: "Prospecto", color: "bg-muted/40" },
  { key: "en_progreso", label: "En progreso", color: "bg-primary/10" },
  { key: "en_revision", label: "En revisión", color: "bg-primary/15" },
  { key: "activo", label: "Activo", color: "bg-success/10" },
  { key: "entregado", label: "Entregado", color: "bg-success/20" },
];

const urgenciaCardClass = (f: PortafolioVistaFila): string => {
  const dias = f.dias_para_sla != null ? Number(f.dias_para_sla) : null;
  if (dias != null && dias < 0) return "border-l-2 border-l-destructive";
  if (f.semaforo_sla === "rojo") return "border-l-2 border-l-destructive";
  if (f.semaforo_sla === "amarillo" || f.semaforo_sla === "ambar")
    return "border-l-2 border-l-primary";
  if (!f.asesor_nombre) return "border-l-2 border-l-muted-foreground opacity-90";
  return "";
};

export const KanbanPortafolio = ({ filas }: Props) => {
  const navigate = useNavigate();

  const porColumna = useMemo(() => {
    const map: Record<string, PortafolioVistaFila[]> = {};
    COLUMNAS.forEach((c) => (map[c.key] = []));
    filas.forEach((f) => {
      if (map[f.estado] !== undefined) map[f.estado].push(f);
    });
    return map;
  }, [filas]);

  return (
    <div className="overflow-x-auto">
      <div className="flex gap-3 min-w-max pb-2">
        {COLUMNAS.map((col) => {
          const items = porColumna[col.key] ?? [];
          return (
            <div
              key={col.key}
              className={`w-[280px] shrink-0 rounded-md ${col.color} p-2`}
            >
              <div className="mb-2 flex items-center justify-between px-1">
                <span className="text-xs font-semibold uppercase tracking-wide text-foreground">
                  {col.label}
                </span>
                <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">
                  {items.length}
                </Badge>
              </div>
              <div className="space-y-2 max-h-[calc(100vh-360px)] overflow-y-auto pr-1">
                {items.map((f) => (
                  <button
                    key={f.engagement_id}
                    type="button"
                    onClick={() =>
                      navigate(`/dashboard/engagements/${f.engagement_id}`)
                    }
                    className={`w-full text-left rounded-md border border-border bg-background p-2 transition-shadow hover:shadow-sm ${urgenciaCardClass(f)}`}
                  >
                    <p className="text-xs font-semibold text-foreground truncate">
                      {f.lote_nombre ?? "Lote sin nombre"}
                    </p>
                    <p className="mt-1 flex items-center gap-1 text-[10px] text-muted-foreground truncate">
                      <MapPin className="h-3 w-3 shrink-0" />
                      {[f.lote_ciudad, f.lote_barrio].filter(Boolean).join(" · ") || "—"}
                    </p>
                    <p className="mt-1 flex items-center gap-1 text-[10px] text-muted-foreground truncate">
                      <User className="h-3 w-3 shrink-0" />
                      {f.asesor_nombre ?? (
                        <span className="italic">Sin asesor</span>
                      )}
                    </p>
                    {f.avance_pct != null && (
                      <div className="mt-2 space-y-1">
                        <Progress value={Number(f.avance_pct)} className="h-1.5" />
                        <p className="text-[10px] text-muted-foreground">
                          {Math.round(Number(f.avance_pct))}% avance
                        </p>
                      </div>
                    )}
                    {f.dias_para_sla != null && (
                      <p
                        className={`mt-1.5 flex items-center gap-1 text-[10px] font-medium ${
                          Number(f.dias_para_sla) < 0
                            ? "text-destructive"
                            : "text-muted-foreground"
                        }`}
                      >
                        {Number(f.dias_para_sla) < 0 ? (
                          <>
                            <AlertTriangle className="h-3 w-3" />
                            Atrasado {Math.abs(Number(f.dias_para_sla))}d
                          </>
                        ) : (
                          <>
                            <Clock className="h-3 w-3" />
                            {f.dias_para_sla}d para SLA
                          </>
                        )}
                      </p>
                    )}
                  </button>
                ))}
                {items.length === 0 && (
                  <div className="rounded-md border border-dashed border-border/60 p-3 text-center text-[11px] text-muted-foreground">
                    Sin engagements
                  </div>
                )}
                {items.length > 50 && (
                  <p className="text-[10px] text-warning px-1">
                    {items.length} items — considera filtrar
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default KanbanPortafolio;
