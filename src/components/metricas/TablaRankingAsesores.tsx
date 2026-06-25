import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import type { RankingAsesoresFila } from "@/hooks/useRankingAsesores";
import { cn } from "@/lib/utils";
import { formatCOP } from "@/lib/format-moneda";

type SortKey =
  | "engagements_activos"
  | "engagements_entregados"
  | "avance_promedio"
  | "tiempo_medio_cierre_dias"
  | "sla_cumplidos_pct"
  | "ingresos_generados_cop";

interface Props {
  data: RankingAsesoresFila[];
  isLoading: boolean;
}

const slaBadgeVariant = (
  pct: number | null
): { className: string; label: string } => {
  if (pct === null || pct === undefined)
    return { className: "bg-muted text-muted-foreground", label: "—" };
  const v = Number(pct);
  if (v >= 90)
    return {
      className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
      label: `${v.toFixed(0)}%`,
    };
  if (v >= 70)
    return {
      className: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
      label: `${v.toFixed(0)}%`,
    };
  return {
    className: "bg-destructive/15 text-destructive",
    label: `${v.toFixed(0)}%`,
  };
};

const iniciales = (nombre: string) =>
  nombre
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");

const TablaRankingAsesores = ({ data, isLoading }: Props) => {
  const [sortKey, setSortKey] = useState<SortKey>("ingresos_generados_cop");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const sorted = useMemo(() => {
    const copy = [...data];
    copy.sort((a, b) => {
      const av = (a[sortKey] ?? 0) as number;
      const bv = (b[sortKey] ?? 0) as number;
      return sortDir === "asc" ? av - bv : bv - av;
    });
    return copy;
  }, [data, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const SortBtn = ({ k, children }: { k: SortKey; children: React.ReactNode }) => (
    <button
      type="button"
      onClick={() => toggleSort(k)}
      className="inline-flex items-center gap-1 font-body text-xs font-semibold text-muted-foreground hover:text-foreground"
    >
      {children}
      {sortKey === k ? (
        sortDir === "asc" ? (
          <ArrowUp className="h-3 w-3" />
        ) : (
          <ArrowDown className="h-3 w-3" />
        )
      ) : (
        <ArrowUpDown className="h-3 w-3 opacity-50" />
      )}
    </button>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-body text-base">Ranking de asesores</CardTitle>
        <p className="font-body text-xs text-muted-foreground">
          Ordenados por ingresos generados
        </p>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : sorted.length === 0 ? (
          <p className="py-8 text-center font-body text-sm text-muted-foreground">
            Sin asesores con actividad en este periodo
          </p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>Asesor</TableHead>
                  <TableHead>
                    <SortBtn k="engagements_activos">Activos</SortBtn>
                  </TableHead>
                  <TableHead>
                    <SortBtn k="engagements_entregados">Entregados</SortBtn>
                  </TableHead>
                  <TableHead className="min-w-[160px]">
                    <SortBtn k="avance_promedio">Avance promedio</SortBtn>
                  </TableHead>
                  <TableHead>
                    <SortBtn k="tiempo_medio_cierre_dias">Tiempo medio cierre</SortBtn>
                  </TableHead>
                  <TableHead>
                    <SortBtn k="sla_cumplidos_pct">SLA cumplidos</SortBtn>
                  </TableHead>
                  <TableHead className="text-right">
                    <SortBtn k="ingresos_generados_cop">Ingresos generados</SortBtn>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sorted.map((fila, idx) => {
                  const sla = slaBadgeVariant(fila.sla_cumplidos_pct);
                  const avance = Number(fila.avance_promedio ?? 0);
                  return (
                    <TableRow key={fila.asesor_id}>
                      <TableCell className="font-body font-semibold">
                        {idx === 0 ? "🏆 1" : idx + 1}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-muted font-body text-xs font-semibold text-foreground">
                            {iniciales(fila.asesor_nombre)}
                          </div>
                          <span className="font-body text-sm text-foreground">
                            {fila.asesor_nombre}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="default">{fila.engagements_activos}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/40 dark:text-emerald-300">
                          {fila.engagements_entregados}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={avance} className="h-2 w-24" />
                          <span className="font-body text-xs text-muted-foreground">
                            {avance.toFixed(0)}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="font-body text-sm">
                        {fila.engagements_entregados > 0 && fila.tiempo_medio_cierre_dias != null
                          ? `${Number(fila.tiempo_medio_cierre_dias).toFixed(0)} días`
                          : "—"}
                      </TableCell>
                      <TableCell>
                        <Badge className={cn("hover:opacity-90", sla.className)}>
                          {sla.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-body text-sm font-semibold">
                        {formatCOP(fila.ingresos_generados_cop)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TablaRankingAsesores;
