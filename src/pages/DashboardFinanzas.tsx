import { useMemo, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowRight, TrendingUp, TrendingDown, Clock, PiggyBank } from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  LineChart,
  Line,
} from "recharts";
import { useResumenFinanciero } from "@/hooks/useResumenFinanciero";
import { useTendenciaFinanciera } from "@/hooks/useTendenciaFinanciera";

const formatCOP = (n: number | null | undefined) =>
  n == null
    ? "—"
    : new Intl.NumberFormat("es-CO", {
        style: "currency",
        currency: "COP",
        maximumFractionDigits: 0,
      }).format(Number(n));

const formatCOPShort = (n: number) => {
  if (Math.abs(n) >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1)}MM`;
  if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (Math.abs(n) >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n}`;
};

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

const formatMesCorto = (mes: string) => {
  // mes: "YYYY-MM"
  const [y, m] = mes.split("-");
  const meses = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
  const mi = parseInt(m, 10) - 1;
  return `${meses[mi] ?? m} ${y.slice(2)}`;
};

const DashboardFinanzas = () => {
  const { isAdmin, isSuperAdmin, loading } = useAuth();
  const [preset, setPreset] = useState<RangoPreset>("todo");
  const [desde, setDesde] = useState<string | undefined>(undefined);
  const [hasta, setHasta] = useState<string | undefined>(undefined);
  const [customDesde, setCustomDesde] = useState<string>(firstOfMonthISO());
  const [customHasta, setCustomHasta] = useState<string>(todayISO());

  const { data: resumen, isLoading: loadingResumen } = useResumenFinanciero(desde, hasta);
  const { data: tendencia, isLoading: loadingTendencia } = useTendenciaFinanciera(12);

  const aplicarPreset = (p: RangoPreset) => {
    setPreset(p);
    if (p === "mes") {
      setDesde(firstOfMonthISO());
      setHasta(todayISO());
    } else if (p === "3meses") {
      setDesde(monthsAgoISO(2));
      setHasta(todayISO());
    } else if (p === "anio") {
      setDesde(firstOfYearISO());
      setHasta(todayISO());
    } else if (p === "todo") {
      setDesde(undefined);
      setHasta(undefined);
    } else if (p === "custom") {
      setDesde(customDesde);
      setHasta(customHasta);
    }
  };

  const tendenciaData = useMemo(
    () =>
      (tendencia ?? []).map((m) => ({
        ...m,
        mesLabel: formatMesCorto(m.mes),
      })),
    [tendencia],
  );

  if (loading) return null;
  if (!isAdmin && !isSuperAdmin) return <Navigate to="/dashboard" replace />;

  const balance = resumen?.balance;
  const diag = resumen?.diagnosticos;
  const exp = resumen?.expertos;
  const ventas = resumen?.ventas;
  const com = resumen?.comisiones;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-heading font-bold text-foreground">Panorama financiero</h1>
          <p className="text-muted-foreground mt-1">
            Todos los flujos de dinero de 360Lateral en un solo lugar.
          </p>
        </div>

        {/* Filtro */}
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="flex flex-wrap gap-2">
              {([
                { key: "mes", label: "Este mes" },
                { key: "3meses", label: "Últimos 3 meses" },
                { key: "anio", label: "Este año" },
                { key: "todo", label: "Todo el tiempo" },
                { key: "custom", label: "Personalizado" },
              ] as { key: RangoPreset; label: string }[]).map((p) => (
                <Button
                  key={p.key}
                  size="sm"
                  variant={preset === p.key ? "default" : "outline"}
                  onClick={() => aplicarPreset(p.key)}
                >
                  {p.label}
                </Button>
              ))}
            </div>
            {preset === "custom" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-md">
                <div>
                  <Label htmlFor="desde">Desde</Label>
                  <Input
                    id="desde"
                    type="date"
                    value={customDesde}
                    onChange={(e) => {
                      setCustomDesde(e.target.value);
                      setDesde(e.target.value);
                    }}
                  />
                </div>
                <div>
                  <Label htmlFor="hasta">Hasta</Label>
                  <Input
                    id="hasta"
                    type="date"
                    value={customHasta}
                    onChange={(e) => {
                      setCustomHasta(e.target.value);
                      setHasta(e.target.value);
                    }}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* KPIs balance */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            title="Entradas"
            value={balance?.entradas}
            subtitle="Diagnósticos + fee de ventas"
            icon={<TrendingUp className="h-5 w-5" />}
            accent="text-emerald-600"
            ring="ring-emerald-200"
            loading={loadingResumen}
          />
          <KpiCard
            title="Salidas pagadas"
            value={balance?.salidas_pagadas}
            subtitle="Pagos a expertos y comisionistas"
            icon={<TrendingDown className="h-5 w-5" />}
            accent="text-rose-600"
            ring="ring-rose-200"
            loading={loadingResumen}
          />
          <KpiCard
            title="Pendiente por pagar"
            value={balance?.pendiente_por_pagar}
            subtitle="Compromisos no liquidados"
            icon={<Clock className="h-5 w-5" />}
            accent="text-amber-600"
            ring="ring-amber-200"
            loading={loadingResumen}
          />
          <KpiCard
            title="Margen diagnósticos"
            value={balance?.margen_diagnosticos}
            subtitle="Ingreso diagnóstico − costo expertos"
            icon={<PiggyBank className="h-5 w-5" />}
            accent="text-primary"
            ring="ring-primary/30"
            loading={loadingResumen}
          />
        </div>

        {/* Desglose por fuente */}
        <div>
          <h2 className="text-xl font-heading font-semibold mb-3">Desglose por fuente</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
                { label: "Fee 5% retenido", value: formatCOP(exp?.fee_retenido_360 ?? 0) },
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
        </div>

        {/* Tendencia */}
        <Card>
          <CardHeader>
            <CardTitle>Evolución mensual</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingTendencia ? (
              <Skeleton className="h-72 w-full" />
            ) : (
              <div className="w-full overflow-x-auto">
                <div className="min-w-[640px] h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={tendenciaData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="mesLabel" tick={{ fontSize: 12 }} />
                      <YAxis tickFormatter={formatCOPShort} tick={{ fontSize: 12 }} />
                      <Tooltip
                        formatter={(value: number) => formatCOP(value)}
                        labelClassName="font-medium"
                      />
                      <Legend />
                      <Bar dataKey="ingresos_diagnostico" name="Ingresos diagnóstico" fill="#10b981" />
                      <Bar dataKey="fee_ventas" name="Fee de ventas" fill="#3b82f6" />
                      <Bar dataKey="pagos_expertos" name="Pagos a expertos" fill="#ef4444" />
                      <Bar dataKey="comisiones" name="Comisiones" fill="#f59e0b" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Valor transado en ventas (separado por magnitud) */}
        <Card>
          <CardHeader>
            <CardTitle>Valor transado en ventas</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingTendencia ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <div className="w-full overflow-x-auto">
                <div className="min-w-[640px] h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={tendenciaData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="mesLabel" tick={{ fontSize: 12 }} />
                      <YAxis tickFormatter={formatCOPShort} tick={{ fontSize: 12 }} />
                      <Tooltip formatter={(value: number) => formatCOP(value)} />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="valor_transado"
                        name="Valor transado"
                        stroke="#6366f1"
                        strokeWidth={2}
                        dot={{ r: 3 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

interface KpiCardProps {
  title: string;
  value: number | undefined;
  subtitle: string;
  icon: React.ReactNode;
  accent: string;
  ring: string;
  loading: boolean;
}

const KpiCard = ({ title, value, subtitle, icon, accent, ring, loading }: KpiCardProps) => (
  <Card className={`ring-1 ${ring}`}>
    <CardContent className="pt-6">
      <div className="flex items-start justify-between">
        <div className="space-y-1 min-w-0">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">{title}</p>
          {loading ? (
            <Skeleton className="h-7 w-32 mt-1" />
          ) : (
            <p className={`text-2xl font-bold font-heading ${accent} break-words`}>
              {formatCOP(value ?? 0)}
            </p>
          )}
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </div>
        <div className={`${accent} shrink-0`}>{icon}</div>
      </div>
    </CardContent>
  </Card>
);

interface SourceCardProps {
  title: string;
  lines: { label: string; value: string; strong?: boolean }[];
  linkLabel: string;
  to: string;
  loading: boolean;
}

const SourceCard = ({ title, lines, linkLabel, to, loading }: SourceCardProps) => (
  <Card className="flex flex-col">
    <CardHeader className="pb-2">
      <CardTitle className="text-base">{title}</CardTitle>
    </CardHeader>
    <CardContent className="flex flex-col flex-1 justify-between gap-3">
      <div className="space-y-1.5">
        {loading
          ? Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-4 w-full" />)
          : lines.map((l) => (
              <div key={l.label} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{l.label}</span>
                <span className={l.strong ? "font-semibold text-foreground" : "text-foreground"}>
                  {l.value}
                </span>
              </div>
            ))}
      </div>
      <Button asChild variant="ghost" size="sm" className="justify-start px-0 text-primary">
        <Link to={to}>
          {linkLabel} <ArrowRight className="ml-1 h-4 w-4" />
        </Link>
      </Button>
    </CardContent>
  </Card>
);

export default DashboardFinanzas;
