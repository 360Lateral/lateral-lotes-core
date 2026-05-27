import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, Trophy } from "lucide-react";
import { useMetricasExpertos, type MetricaExperto } from "@/hooks/useMetricasExpertos";

type SortKey =
  | "nombre"
  | "total_propuestas"
  | "propuestas_ganadas"
  | "tasa_adjudicacion_pct"
  | "tiempo_respuesta_horas_avg"
  | "servicios_completados"
  | "tiempo_entrega_dias_avg"
  | "sla_cumplido_pct";

const fmtNum = (v: number | null | undefined, suffix = "") =>
  v === null || v === undefined ? "—" : `${v}${suffix}`;

const badgeAdjudicacion = (pct: number | null, totalProp: number) => {
  if (pct === null) return <span className="text-muted-foreground">—</span>;
  if (pct >= 50) return <Badge className="bg-emerald-600 hover:bg-emerald-600">{pct}%</Badge>;
  if (pct >= 25) return <Badge className="bg-amber-500 hover:bg-amber-500">{pct}%</Badge>;
  if (totalProp > 5) return <Badge variant="destructive">{pct}%</Badge>;
  return <Badge variant="secondary">{pct}%</Badge>;
};

const badgeSla = (pct: number | null) => {
  if (pct === null) return <span className="text-muted-foreground">—</span>;
  if (pct >= 90) return <Badge className="bg-emerald-600 hover:bg-emerald-600">{pct}%</Badge>;
  if (pct >= 70) return <Badge className="bg-amber-500 hover:bg-amber-500">{pct}%</Badge>;
  return <Badge variant="destructive">{pct}%</Badge>;
};

const DashboardMetricasExpertos = () => {
  const navigate = useNavigate();
  const { data: metricas = [], isLoading } = useMetricasExpertos();
  const [sortBy, setSortBy] = useState<SortKey>("propuestas_ganadas");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const sorted = useMemo(() => {
    const copy = [...metricas];
    copy.sort((a, b) => {
      const av = (a as any)[sortBy];
      const bv = (b as any)[sortBy];
      if (av === null || av === undefined) return 1;
      if (bv === null || bv === undefined) return -1;
      if (typeof av === "string") {
        return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
      }
      return sortDir === "asc" ? av - bv : bv - av;
    });
    return copy;
  }, [metricas, sortBy, sortDir]);

  const resumen = useMemo(() => {
    const totalProp = metricas.reduce((s, m) => s + (m.total_propuestas || 0), 0);
    const totalComp = metricas.reduce((s, m) => s + (m.servicios_completados || 0), 0);
    const conProp = metricas.filter((m) => (m.total_propuestas || 0) > 0);
    const avgAdj = conProp.length
      ? conProp.reduce((s, m) => s + (m.tasa_adjudicacion_pct || 0), 0) / conProp.length
      : null;
    const conComp = metricas.filter(
      (m) => (m.servicios_completados || 0) > 0 && m.sla_cumplido_pct !== null,
    );
    const avgSla = conComp.length
      ? conComp.reduce((s, m) => s + (m.sla_cumplido_pct || 0), 0) / conComp.length
      : null;
    return { totalProp, totalComp, avgAdj, avgSla };
  }, [metricas]);

  const toggleSort = (key: SortKey) => {
    if (sortBy === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortBy(key);
      setSortDir("desc");
    }
  };

  const SortHeader = ({ k, label }: { k: SortKey; label: string }) => (
    <Button variant="ghost" size="sm" className="h-7 px-2 -ml-2" onClick={() => toggleSort(k)}>
      {label}
      <ArrowUpDown className="ml-1 h-3 w-3" />
    </Button>
  );

  const hayDatos = metricas.some(
    (m: MetricaExperto) =>
      m.total_propuestas > 0 || m.total_invitaciones > 0 || m.servicios_completados > 0,
  );

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-foreground">
            Desempeño de expertos
          </h1>
          <p className="text-sm text-muted-foreground">
            Indicadores agregados desde el lanzamiento del módulo de órdenes de servicio.
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                Total propuestas enviadas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">{resumen.totalProp}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                Servicios completados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">{resumen.totalComp}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                Tasa promedio de adjudicación
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">
                {resumen.avgAdj === null ? "—" : `${resumen.avgAdj.toFixed(1)}%`}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                SLA cumplido promedio
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">
                {resumen.avgSla === null ? "—" : `${resumen.avgSla.toFixed(1)}%`}
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Ranking de expertos</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : !hayDatos ? (
              <div className="p-12 flex flex-col items-center gap-3 text-center text-muted-foreground">
                <Trophy className="h-10 w-10" />
                <p>Todavía no hay actividad de expertos para mostrar.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead><SortHeader k="nombre" label="Experto" /></TableHead>
                      <TableHead><SortHeader k="total_propuestas" label="Propuestas" /></TableHead>
                      <TableHead><SortHeader k="propuestas_ganadas" label="Ganadas" /></TableHead>
                      <TableHead><SortHeader k="tasa_adjudicacion_pct" label="Adjudicación %" /></TableHead>
                      <TableHead><SortHeader k="tiempo_respuesta_horas_avg" label="Resp. (h)" /></TableHead>
                      <TableHead><SortHeader k="servicios_completados" label="Completados" /></TableHead>
                      <TableHead><SortHeader k="tiempo_entrega_dias_avg" label="Entrega (d)" /></TableHead>
                      <TableHead><SortHeader k="sla_cumplido_pct" label="SLA %" /></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sorted.map((m) => (
                      <TableRow
                        key={m.experto_id}
                        className="cursor-pointer"
                        onClick={() =>
                          navigate(`/dashboard/usuarios?filtro=${m.experto_id}`)
                        }
                      >
                        <TableCell>
                          <p className="font-medium text-foreground">{m.nombre ?? "—"}</p>
                          <p className="text-xs text-muted-foreground">{m.email ?? ""}</p>
                        </TableCell>
                        <TableCell>{m.total_propuestas}</TableCell>
                        <TableCell>{m.propuestas_ganadas}</TableCell>
                        <TableCell>
                          {badgeAdjudicacion(m.tasa_adjudicacion_pct, m.total_propuestas)}
                        </TableCell>
                        <TableCell>{fmtNum(m.tiempo_respuesta_horas_avg, " h")}</TableCell>
                        <TableCell>{m.servicios_completados}</TableCell>
                        <TableCell>{fmtNum(m.tiempo_entrega_dias_avg, " d")}</TableCell>
                        <TableCell>{badgeSla(m.sla_cumplido_pct)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default DashboardMetricasExpertos;
