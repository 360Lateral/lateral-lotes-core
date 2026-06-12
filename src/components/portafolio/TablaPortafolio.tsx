import { useNavigate } from "react-router-dom";
import { Eye, Inbox, CheckCircle2, Circle } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import EstadoEngagementBadge from "./EstadoEngagementBadge";
import SemaforoSlaBadge from "./SemaforoSlaBadge";
import type { PortafolioVistaFila } from "@/hooks/useVistaPortafolio";

interface Props {
  filas: PortafolioVistaFila[];
  isLoading: boolean;
}

const PLAN_STYLES: Record<string, string> = {
  gratuito: "bg-muted text-muted-foreground",
  basico: "bg-secondary/20 text-secondary-foreground border-secondary/40",
  pro: "bg-primary/15 text-primary border-primary/30",
  premium: "bg-warning/15 text-warning border-warning/30",
};

const progressColor = (pct: number) => {
  if (pct < 25) return "[&>div]:bg-destructive";
  if (pct <= 75) return "[&>div]:bg-warning";
  return "[&>div]:bg-success";
};

const urgenciaRowClass = (fila: PortafolioVistaFila): string => {
  const dias = fila.dias_para_sla != null ? Number(fila.dias_para_sla) : null;
  if (dias != null && dias < 0) return "bg-destructive/10 border-l-2 border-l-destructive";
  if (fila.semaforo_sla === "rojo") return "bg-destructive/5 border-l-2 border-l-destructive";
  if (fila.semaforo_sla === "amarillo" || fila.semaforo_sla === "ambar")
    return "bg-primary/5 border-l-2 border-l-primary";
  if (!fila.asesor_nombre) return "bg-muted/30 border-l-2 border-l-muted-foreground";
  return "";
};

const EntregablePill = ({ label, done }: { label: string; done: boolean }) => (
  <span
    className={cn(
      "inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 font-body text-[10px]",
      done
        ? "border-success/40 bg-success/15 text-success"
        : "border-muted bg-muted/40 text-muted-foreground",
    )}
  >
    {done ? <CheckCircle2 className="h-3 w-3" /> : <Circle className="h-3 w-3" />}
    {label}
  </span>
);

const TablaPortafolio = ({ filas, isLoading }: Props) => {
  const navigate = useNavigate();

  return (
    <div className="overflow-x-auto rounded-md border border-border">
      <Table>
        <TableHeader className="sticky top-0 z-10 bg-muted/50">
          <TableRow>
            <TableHead className="min-w-[180px]">Lote</TableHead>
            <TableHead>Plan</TableHead>
            <TableHead>Cliente</TableHead>
            <TableHead>Asesor</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead className="min-w-[180px]">Avance</TableHead>
            <TableHead>SLA</TableHead>
            <TableHead>Entregables</TableHead>
            <TableHead>Días en gestión</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                {Array.from({ length: 10 }).map((__, j) => (
                  <TableCell key={j}>
                    <Skeleton className="h-4 w-full" />
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : filas.length === 0 ? (
            <TableRow>
              <TableCell colSpan={10} className="py-12 text-center">
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  <Inbox className="h-8 w-8" />
                  <p className="font-body text-sm">
                    No hay engagements que coincidan con tus filtros
                  </p>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            filas.map((f) => {
              const pct = Number(f.avance_pct ?? 0);
              const go = () => navigate(`/dashboard/engagements/${f.engagement_id}`);
              const ambosEntregados = f.tiene_diagnostico && f.tiene_presentacion;
              return (
                <TableRow
                  key={f.engagement_id}
                  onClick={go}
                  className={cn("cursor-pointer hover:bg-muted/40", urgenciaRowClass(f))}
                >
                  <TableCell>
                    <div className="font-body text-sm font-semibold text-foreground">
                      {f.lote_nombre ?? "Sin nombre"}
                    </div>
                    <div className="max-w-[220px] truncate font-body text-xs text-muted-foreground">
                      {[f.lote_barrio, f.lote_ciudad].filter(Boolean).join(" · ") || "—"}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={cn(
                        "font-body",
                        PLAN_STYLES[f.plan_codigo ?? ""] ?? "bg-muted",
                      )}
                    >
                      {f.plan_nombre ?? f.plan_codigo ?? "—"}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-body text-sm">
                    {f.cliente_nombre ?? "—"}
                  </TableCell>
                  <TableCell className="font-body text-sm">
                    {f.asesor_nombre ?? (
                      <span className="text-muted-foreground">Sin asignar</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col items-start gap-1">
                      <EstadoEngagementBadge estado={f.estado} />
                      {f.estado_activacion === "borrador" && (
                        <Badge
                          variant="outline"
                          className="bg-warning/15 text-warning border-warning/40 font-body"
                        >
                          Borrador
                        </Badge>
                      )}
                      {f.estado_activacion === "pendiente_pago" && (
                        <Badge
                          variant="outline"
                          className="bg-primary/10 text-primary border-primary/30 font-body"
                        >
                          Pendiente pago
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <Progress
                          value={pct}
                          className={cn("h-2 w-24", progressColor(pct))}
                        />
                        <span className="font-body text-xs text-muted-foreground">
                          {pct.toFixed(0)}%
                        </span>
                      </div>
                      <span className="font-body text-[11px] text-muted-foreground">
                        {f.n_analisis_completados} / {f.n_analisis_total} análisis
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <SemaforoSlaBadge
                      semaforo={f.semaforo_sla}
                      diasParaSla={f.dias_para_sla}
                    />
                  </TableCell>
                  <TableCell>
                    {ambosEntregados ? (
                      <span className="inline-flex items-center gap-1 rounded-full border border-success/40 bg-success/15 px-2 py-0.5 font-body text-[11px] text-success">
                        <CheckCircle2 className="h-3 w-3" /> Listo
                      </span>
                    ) : (
                      <div className="flex items-center gap-1">
                        <EntregablePill label="Diag" done={f.tiene_diagnostico} />
                        <EntregablePill label="Pres" done={f.tiene_presentacion} />
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="font-body text-sm">
                    {f.dias_en_gestion}d
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        go();
                      }}
                      aria-label="Ver detalle"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default TablaPortafolio;
