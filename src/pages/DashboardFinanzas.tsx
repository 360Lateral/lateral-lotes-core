import { useMemo, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  ArrowRight, TrendingUp, TrendingDown, Clock, PiggyBank, FileText, BarChart3,
} from "lucide-react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend,
  CartesianGrid, LineChart, Line,
} from "recharts";
import { useResumenFinanciero } from "@/hooks/useResumenFinanciero";
import { useTendenciaFinanciera } from "@/hooks/useTendenciaFinanciera";
import { KPIFinanciero } from "@/components/ui/KPIEstado";
import { formatCOP, formatCOPCompact } from "@/lib/format-moneda";



const todayISO = () => new Date().toISOString().slice(0, 10);
const firstOfMonthISO = () => {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
};
const firstOfYearISO = () => `${new Date().getFullYear()}-01-01`;
const monthsAgoISO = (n: number) => {
  const d = new Date();
  d.setMonth(d.getMonth() - n);
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
};

type RangoPreset = "mes" | "3meses" | "anio" | "todo" | "custom";

const PERIODO_LABELS: Record<RangoPreset, string> = {
  mes: "Este mes",
  "3meses": "Últimos 3 meses",
  anio: "Este año",
  todo: "Todo el tiempo",
  custom: "Personalizado",
};

const formatMesCorto = (mes: string) => {
  const [y, m] = mes.split("-");
  const meses = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
  const mi = parseInt(m, 10) - 1;
  return `${meses[mi] ?? m} ${y.slice(2)}`;
};

const DashboardFinanzas = () => {
  const { roles, isSuperAdmin, loading } = useAuth();
  const isAdmin = roles.some((r) => ["super_admin", "admin"].includes(r));
  const [preset, setPreset] = useState<RangoPreset>("todo");
  const [desde, setDesde] = useState<string | undefined>(undefined);
  const [hasta, setHasta] = useState<string | undefined>(undefined);
  const [customDesde, setCustomDesde] = useState<string>(firstOfMonthISO());
  const [customHasta, setCustomHasta] = useState<string>(todayISO());

  const { data: resumen, isLoading: loadingResumen } = useResumenFinanciero(desde, hasta);
  const { data: tendencia, isLoading: loadingTendencia } = useTendenciaFinanciera(12);

  const aplicarPreset = (p: RangoPreset) => {
    setPreset(p);
    if (p === "mes") { setDesde(firstOfMonthISO()); setHasta(todayISO()); }
    else if (p === "3meses") { setDesde(monthsAgoISO(2)); setHasta(todayISO()); }
    else if (p === "anio") { setDesde(firstOfYearISO()); setHasta(todayISO()); }
    else if (p === "todo") { setDesde(undefined); setHasta(undefined); }
    else if (p === "custom") { setDesde(customDesde); setHasta(customHasta); }
  };

  const tendenciaData = useMemo(
    () => (tendencia ?? []).map((m) => ({ ...m, mesLabel: formatMesCorto(m.mes) })),
    [tendencia],
  );

  if (loading) return null;
  if (!isAdmin && !isSuperAdmin) return <Navigate to="/dashboard" replace />;

  const balance = resumen?.balance;
  const diag = resumen?.diagnosticos;
  const exp = resumen?.expertos;
  const ventas = resumen?.ventas;
  const com = resumen?.comisiones;

  const ingresos = balance?.entradas ?? 0;
  const egresos = balance?.salidas_pagadas ?? 0;
  const utilidad = ingresos - egresos;

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-7xl px-4 py-6 md:px-6">
        {/* Header */}
        <header className="mb-4 flex flex-wrap items-start justify-between gap-3 rounded-lg border border-border bg-background p-5">
          <div>
            <h1 className="flex items-center gap-2 text-xl font-semibold text-foreground">
              <BarChart3 className="h-5 w-5" /> Finanzas
            </h1>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Ingresos del período:{" "}
              <strong className="text-green-600">{formatCOPCompact(ingresos)}</strong>
              {" · "}Utilidad bruta:{" "}
              <strong className={utilidad >= 0 ? "text-foreground" : "text-destructive"}>
                {formatCOPCompact(utilidad)}
              </strong>
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Select value={preset} onValueChange={(v) => aplicarPreset(v as RangoPreset)}>
              <SelectTrigger className="h-8 w-auto text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.keys(PERIODO_LABELS) as RangoPreset[]).map((k) => (
                  <SelectItem key={k} value={k}>{PERIODO_LABELS[k]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" disabled>
              <FileText className="mr-1.5 h-3.5 w-3.5" /> Reporte
            </Button>
          </div>
        </header>

        {preset === "custom" && (
          <Card className="mb-3">
            <CardContent className="pt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-md">
                <div>
                  <Label htmlFor="desde">Desde</Label>
                  <Input id="desde" type="date" value={customDesde}
                    onChange={(e) => { setCustomDesde(e.target.value); setDesde(e.target.value); }} />
                </div>
                <div>
                  <Label htmlFor="hasta">Hasta</Label>
                  <Input id="hasta" type="date" value={customHasta}
                    onChange={(e) => { setCustomHasta(e.target.value); setHasta(e.target.value); }} />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* KPIs financieros */}
        <div className="mb-4 grid grid-cols-2 gap-2 md:grid-cols-4">
          {loadingResumen ? (
            Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20" />)
          ) : (
            <>
              <KPIFinanciero label="Ingresos" value={formatCOPCompact(ingresos)} icon={TrendingUp} />
              <KPIFinanciero label="Egresos" value={formatCOPCompact(egresos)} icon={TrendingDown} invertirColorDelta />
              <KPIFinanciero label="Utilidad bruta" value={formatCOPCompact(utilidad)} icon={PiggyBank} />
              <KPIFinanciero
                label="Pendiente por pagar"
                value={formatCOPCompact(balance?.pendiente_por_pagar ?? 0)}
                icon={Clock}
                sublabel="Compromisos no liquidados"
              />
            </>
          )}
        </div>

        {/* Gráficos */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Evolución mensual</CardTitle>
              <p className="text-[10px] text-muted-foreground">Últimos 12 meses</p>
            </CardHeader>
            <CardContent>
              {loadingTendencia ? (
                <Skeleton className="h-64 w-full" />
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={tendenciaData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="mesLabel" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                    <YAxis tickFormatter={formatCOPShort} tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                    <Tooltip
                      contentStyle={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))", fontSize: 12 }}
                      formatter={(v: number) => formatCOP(v)}
                    />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="ingresos_diagnostico" name="Ingresos diagnóstico" fill="hsl(142, 76%, 36%)" radius={[2, 2, 0, 0]} />
                    <Bar dataKey="fee_ventas" name="Fee ventas" fill="hsl(142, 50%, 50%)" radius={[2, 2, 0, 0]} />
                    <Bar dataKey="pagos_expertos" name="Pagos expertos" fill="hsl(0, 84%, 60%)" fillOpacity={0.7} radius={[2, 2, 0, 0]} />
                    <Bar dataKey="comisiones" name="Comisiones" fill="hsl(38, 92%, 50%)" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Valor transado en ventas</CardTitle>
              <p className="text-[10px] text-muted-foreground">Últimos 12 meses</p>
            </CardHeader>
            <CardContent>
              {loadingTendencia ? (
                <Skeleton className="h-64 w-full" />
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={tendenciaData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="mesLabel" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                    <YAxis tickFormatter={formatCOPShort} tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                    <Tooltip
                      contentStyle={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))", fontSize: 12 }}
                      formatter={(v: number) => formatCOP(v)}
                    />
                    <Line
                      type="monotone"
                      dataKey="valor_transado"
                      name="Valor transado"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      dot={{ r: 3, fill: "hsl(var(--primary))" }}
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Desglose por fuente */}
        <Card className="mt-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Desglose por fuente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <SourceCard
                title="Diagnósticos"
                loading={loadingResumen}
                lines={[
                  { label: "Ingresos", value: formatCOP(diag?.ingresos ?? 0), strong: true },
                  { label: "Transacciones", value: String(diag?.num_transacciones ?? 0) },
                ]}
                linkLabel="Ver pagos"
                to="/dashboard/pagos"
              />
              <SourceCard
                title="Expertos"
                loading={loadingResumen}
                lines={[
                  { label: "Pagado", value: formatCOP(exp?.pagado ?? 0), strong: true },
                  { label: "Pendiente", value: formatCOP(exp?.pendiente ?? 0) },
                  { label: "Fee retenido", value: formatCOP(exp?.fee_retenido_360 ?? 0) },
                ]}
                linkLabel="Ver liquidaciones"
                to="/dashboard/liquidaciones"
              />
              <SourceCard
                title="Ventas"
                loading={loadingResumen}
                lines={[
                  { label: "Ventas", value: String(ventas?.num_ventas ?? 0) },
                  { label: "Valor transado", value: formatCOP(ventas?.valor_transado ?? 0) },
                  { label: "Fee 360Lateral", value: formatCOP(ventas?.fee_360 ?? 0), strong: true },
                ]}
                linkLabel="Ver ventas"
                to="/dashboard/ventas"
              />
              <SourceCard
                title="Comisiones"
                loading={loadingResumen}
                lines={[
                  { label: "Pagado", value: formatCOP(com?.pagado ?? 0), strong: true },
                  { label: "Pendiente", value: formatCOP(com?.pendiente ?? 0) },
                  { label: "Total", value: String(com?.num ?? 0) },
                ]}
                linkLabel="Ver comisiones"
                to="/dashboard/ventas"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

interface SourceCardProps {
  title: string;
  lines: { label: string; value: string; strong?: boolean }[];
  linkLabel: string;
  to: string;
  loading: boolean;
}

const SourceCard = ({ title, lines, linkLabel, to, loading }: SourceCardProps) => (
  <div className="rounded-md border border-border p-3">
    <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{title}</div>
    <div className="mt-2 space-y-1">
      {loading
        ? Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-4 w-full" />)
        : lines.map((l) => (
            <div key={l.label} className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">{l.label}</span>
              <span className={l.strong ? "font-semibold text-foreground" : "text-foreground"}>{l.value}</span>
            </div>
          ))}
    </div>
    <Button asChild variant="ghost" size="sm" className="mt-2 h-7 justify-start px-0 text-[11px] text-primary">
      <Link to={to}>{linkLabel} <ArrowRight className="ml-1 h-3 w-3" /></Link>
    </Button>
  </div>
);

export default DashboardFinanzas;
