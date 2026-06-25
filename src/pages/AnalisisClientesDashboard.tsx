import { useMemo, useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  Users,
  UserPlus,
  UserMinus,
  Building2,
  TrendingUp,
  Download,
  Mail,
  CheckCircle2,
} from "lucide-react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { formatCOPCompact } from "@/lib/format";
import KPICard from "@/components/dashboard/KPICard";
import {
  useMetricasClientesEjecutivo,
  type RangoClientes,
  type ClienteRiesgo,
} from "@/hooks/useMetricasClientesEjecutivo";

const COLORES_PLANES: Record<string, string> = {
  premium: "hsl(var(--primary))",
  pro: "hsl(217 91% 35%)",
  basico: "hsl(217 91% 60%)",
  gratuito: "hsl(var(--muted-foreground))",
  pay_per_view: "hsl(38 92% 50%)",
};

const PLAN_LABEL: Record<string, string> = {
  premium: "Premium",
  pro: "Pro",
  basico: "Básico",
  gratuito: "Gratuito",
  pay_per_view: "Pay-per-view",
};

const MOTIVO_LABEL: Record<string, string> = {
  vencimiento: "Vencimiento próximo",
  inactivo: "Sin actividad >30d",
};

const ChartCard = ({ titulo, children }: { titulo: string; children: React.ReactNode }) => (
  <Card>
    <CardHeader className="pb-2">
      <CardTitle className="text-base">{titulo}</CardTitle>
    </CardHeader>
    <CardContent>{children}</CardContent>
  </Card>
);

const exportarCsvRiesgo = (items: ClienteRiesgo[]) => {
  const esc = (v: unknown) => {
    const s = v == null ? "" : String(v);
    return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const headers = ["Nombre", "Email", "Tipo", "Plan", "Motivo", "Fecha"];
  const rows = items.map((c) =>
    [c.nombre, c.email, c.tipo, PLAN_LABEL[c.plan] ?? c.plan, MOTIVO_LABEL[c.motivo], c.fecha_riesgo]
      .map(esc)
      .join(","),
  );
  const csv = [headers.join(","), ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `clientes-en-riesgo-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};

const AnalisisClientesDashboard = () => {
  const [rango, setRango] = useState<RangoClientes>("3m");
  const [filtroTipo, setFiltroTipo] = useState<"all" | "vencimiento" | "inactivo">("all");
  const { data, isLoading } = useMetricasClientesEjecutivo(rango);

  const kpis = data?.kpis;
  const riesgoFiltrado = useMemo(() => {
    const items = data?.clientes_riesgo ?? [];
    if (filtroTipo === "all") return items;
    return items.filter((c) => c.motivo === filtroTipo);
  }, [data?.clientes_riesgo, filtroTipo]);

  const contactarCliente = (c: ClienteRiesgo) => {
    if (!c.email) return;
    const asunto = encodeURIComponent("Sobre tu suscripción en 360Lateral");
    const cuerpo = encodeURIComponent(
      `Hola ${c.nombre ?? ""},\n\nQueríamos saber cómo va tu experiencia con 360Lateral.\n\nUn saludo,\nEquipo 360Lateral`,
    );
    window.location.href = `mailto:${c.email}?subject=${asunto}&body=${cuerpo}`;
  };

  return (
    <DashboardLayout>
      <div className="container py-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold">Análisis de clientes</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {data?.total_clientes ?? 0} clientes históricos · Vista ejecutiva de retención y crecimiento
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportarCsvRiesgo(data?.clientes_riesgo ?? [])}
            disabled={!data?.clientes_riesgo?.length}
          >
            <Download className="h-4 w-4 mr-1" />
            Exportar CSV
          </Button>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          <KPICard
            label="Clientes activos"
            value={kpis?.clientes_activos ?? 0}
            delta={kpis?.clientes_activos_delta}
            icon={Users}
            descripcion="Con suscripción o PPV vigente"
            loading={isLoading}
          />
          <KPICard
            label="Nuevos este mes"
            value={kpis?.clientes_nuevos_mes ?? 0}
            delta={kpis?.clientes_nuevos_delta}
            icon={UserPlus}
            descripcion="Primera compra últimos 30 días"
            loading={isLoading}
          />
          <KPICard
            label="Churn mensual"
            value={`${(kpis?.churn_rate ?? 0).toFixed(1)}%`}
            delta={kpis?.churn_rate_delta}
            deltaInverso
            deltaSufijo=" cancel."
            icon={UserMinus}
            descripcion="Cancelaciones / activos"
            loading={isLoading}
          />
          <KPICard
            label="Lotes/desarrollador"
            value={(kpis?.promedio_lotes_desarrollador ?? 0).toFixed(1)}
            icon={Building2}
            descripcion="Promedio de PPVs activos"
            loading={isLoading}
          />
          <KPICard
            label="LTV estimado"
            value={formatCOPCompact(kpis?.ltv_estimado ?? 0)}
            icon={TrendingUp}
            descripcion="Gasto promedio histórico"
            loading={isLoading}
          />
        </div>

        {/* Charts */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold">Evolución temporal</h2>
            <ToggleGroup
              type="single"
              value={rango}
              onValueChange={(v) => v && setRango(v as RangoClientes)}
              variant="outline"
              size="sm"
            >
              <ToggleGroupItem value="30d">30 días</ToggleGroupItem>
              <ToggleGroupItem value="3m">3 meses</ToggleGroupItem>
              <ToggleGroupItem value="12m">12 meses</ToggleGroupItem>
            </ToggleGroup>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-[290px] w-full" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <ChartCard titulo="Clientes activos">
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={data?.evolucion_activos ?? []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="periodo" fontSize={11} />
                    <YAxis fontSize={11} allowDecimals={false} />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="activos"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard titulo="Nuevos clientes">
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={data?.evolucion_nuevos ?? []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="periodo" fontSize={11} />
                    <YAxis fontSize={11} allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="nuevos" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard titulo="Cancelaciones">
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={data?.evolucion_cancelaciones ?? []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="periodo" fontSize={11} />
                    <YAxis fontSize={11} allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="cancelaciones" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard titulo="Distribución de planes activos">
                {(data?.distribucion_planes?.length ?? 0) === 0 ? (
                  <div className="h-[250px] flex items-center justify-center text-sm text-muted-foreground">
                    Sin planes activos
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={data!.distribucion_planes}
                        dataKey="count"
                        nameKey="plan"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        innerRadius={40}
                        label={(e: any) => `${PLAN_LABEL[e.plan] ?? e.plan}: ${e.count}`}
                      >
                        {data!.distribucion_planes.map((entry, idx) => (
                          <Cell
                            key={idx}
                            fill={COLORES_PLANES[entry.plan] ?? "hsl(var(--muted))"}
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </ChartCard>
            </div>
          )}
        </div>

        {/* Tabla clientes en riesgo */}
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <CardTitle>Clientes en riesgo</CardTitle>
              <Select value={filtroTipo} onValueChange={(v) => setFiltroTipo(v as typeof filtroTipo)}>
                <SelectTrigger className="w-full md:w-[220px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="vencimiento">Vencimiento próximo</SelectItem>
                  <SelectItem value="inactivo">Sin actividad</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-40 w-full" />
            ) : riesgoFiltrado.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle2 className="h-12 w-12 mx-auto text-emerald-500 mb-2" />
                <p className="font-medium">Ningún cliente en riesgo</p>
                <p className="text-sm text-muted-foreground">
                  Todas las suscripciones están vigentes y activas.
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Motivo</TableHead>
                    <TableHead className="text-right">Vence / Inactivo desde</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {riesgoFiltrado.map((c) => (
                    <TableRow key={`${c.id}-${c.motivo}`}>
                      <TableCell>
                        <p className="font-medium text-sm">{c.nombre ?? "—"}</p>
                        <p className="text-xs text-muted-foreground">{c.email ?? ""}</p>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">{c.tipo}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge>{PLAN_LABEL[c.plan] ?? c.plan}</Badge>
                      </TableCell>
                      <TableCell>
                        <span
                          className={cn(
                            "text-xs font-medium",
                            c.motivo === "vencimiento" && "text-amber-600",
                            c.motivo === "inactivo" && "text-red-600",
                          )}
                        >
                          {MOTIVO_LABEL[c.motivo]}
                        </span>
                      </TableCell>
                      <TableCell className="text-right text-xs">
                        {c.fecha_riesgo
                          ? format(new Date(c.fecha_riesgo), "d 'de' MMM yyyy", { locale: es })
                          : "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => contactarCliente(c)}
                          disabled={!c.email}
                        >
                          <Mail className="h-3 w-3 mr-1" />
                          Contactar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default AnalisisClientesDashboard;
