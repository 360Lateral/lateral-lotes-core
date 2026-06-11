import { useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
import { useAuth } from "@/contexts/AuthContext";
import { useLiquidacionesAdmin } from "@/hooks/useLiquidacionesAdmin";
import MarcarLiquidacionPagadaDialog, {
  formatCOP,
} from "@/components/liquidaciones/MarcarLiquidacionPagadaDialog";
import { Wallet, Search } from "lucide-react";
import type { LiquidacionRow } from "@/types/finanzas";

const formatFecha = (s: string | null | undefined) =>
  s ? new Date(s).toLocaleDateString("es-CO") : "—";

const estadoBadge = (estado: string) => {
  switch (estado) {
    case "pendiente":
      return {
        className:
          "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300",
        label: "Pendiente",
      };
    case "pagada":
      return {
        className:
          "bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-300",
        label: "Pagada",
      };
    case "cancelada":
      return {
        className: "bg-muted text-muted-foreground",
        label: "Cancelada",
      };
    default:
      return { className: "bg-muted text-muted-foreground", label: estado };
  }
};

export default function DashboardLiquidaciones() {
  const { isSuperAdmin, roles, loading } = useAuth();
  const isAdmin =
    isSuperAdmin || roles.some((r) => r === "admin");

  const [tab, setTab] = useState<string>("pendiente");
  const [searchExperto, setSearchExperto] = useState("");
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [liqSeleccionada, setLiqSeleccionada] =
    useState<LiquidacionRow | null>(null);

  const { data: todas = [], isLoading: loadingTodas } = useLiquidacionesAdmin();
  const { data: porEstado = [], isLoading: loadingEstado } =
    useLiquidacionesAdmin(tab);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="mx-auto max-w-7xl p-6">
          <Skeleton className="h-40 w-full" />
        </div>
      </DashboardLayout>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  // KPIs sobre TODAS
  const porPagar = todas
    .filter((l) => l.estado === "pendiente")
    .reduce((acc, l) => acc + Number(l.monto_neto ?? 0), 0);
  const pagadoHistorico = todas
    .filter((l) => l.estado === "pagada")
    .reduce((acc, l) => acc + Number(l.monto_neto ?? 0), 0);
  const feeAcumulado = todas.reduce(
    (acc, l) => acc + Number(l.fee_monto ?? 0),
    0
  );
  const pendientesCount = todas.filter(
    (l) => l.estado === "pendiente"
  ).length;

  const filtradas = useMemo<LiquidacionRow[]>(() => {
    return porEstado.filter((l) => {
      if (searchExperto) {
        const s = searchExperto.toLowerCase();
        const nombre = (l.experto?.nombre ?? "").toLowerCase();
        const email = (l.experto?.email ?? "").toLowerCase();
        if (!nombre.includes(s) && !email.includes(s)) return false;
      }
      if (desde && new Date(l.fecha_generacion) < new Date(desde)) return false;
      if (hasta) {
        const fin = new Date(hasta);
        fin.setHours(23, 59, 59, 999);
        if (new Date(l.fecha_generacion) > fin) return false;
      }
      return true;
    });
  }, [porEstado, searchExperto, desde, hasta]);

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 md:px-6">
        <header>
          <h1 className="flex items-center gap-2 font-display text-2xl font-semibold text-foreground">
            <Wallet className="h-6 w-6" /> Liquidaciones a expertos
          </h1>
          <p className="font-body text-sm text-muted-foreground">
            Pagos pendientes y realizados a los expertos por análisis completados.
          </p>
        </header>

        {/* KPIs */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Card className="p-4 border-l-4 border-l-amber-500">
            <p className="text-xs text-muted-foreground">Por pagar</p>
            <p className="font-display text-xl font-semibold text-amber-700 dark:text-amber-400">
              {formatCOP(porPagar)}
            </p>
          </Card>
          <Card className="p-4 border-l-4 border-l-green-500">
            <p className="text-xs text-muted-foreground">Pagado (histórico)</p>
            <p className="font-display text-xl font-semibold text-green-700 dark:text-green-400">
              {formatCOP(pagadoHistorico)}
            </p>
          </Card>
          <Card className="p-4 border-l-4 border-l-primary">
            <p className="text-xs text-muted-foreground">Fee acumulado 360Lateral</p>
            <p className="font-display text-xl font-semibold text-primary">
              {formatCOP(feeAcumulado)}
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-muted-foreground">Liquidaciones pendientes</p>
            <p className="font-display text-xl font-semibold text-foreground">
              {pendientesCount}
            </p>
          </Card>
        </div>

        {/* Filtros */}
        <Card className="p-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Experto (nombre / email)"
                value={searchExperto}
                onChange={(e) => setSearchExperto(e.target.value)}
                className="pl-8"
              />
            </div>
            <Input
              type="date"
              value={desde}
              onChange={(e) => setDesde(e.target.value)}
              aria-label="Desde"
            />
            <Input
              type="date"
              value={hasta}
              onChange={(e) => setHasta(e.target.value)}
              aria-label="Hasta"
            />
          </div>
        </Card>

        {/* Tabs */}
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="flex w-full flex-wrap">
            <TabsTrigger value="pendiente" className="flex-1 min-w-[110px]">
              Pendientes
            </TabsTrigger>
            <TabsTrigger value="pagada" className="flex-1 min-w-[110px]">
              Pagadas
            </TabsTrigger>
            <TabsTrigger value="cancelada" className="flex-1 min-w-[110px]">
              Canceladas
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Tabla */}
        <Card>
          {loadingEstado || loadingTodas ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : filtradas.length === 0 ? (
            <div className="p-10 text-center font-body text-sm text-muted-foreground">
              {tab === "pendiente"
                ? "No hay liquidaciones pendientes de pago."
                : tab === "pagada"
                ? "Aún no se han registrado pagos."
                : "No hay liquidaciones canceladas."}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Experto</TableHead>
                    <TableHead>Lote / análisis</TableHead>
                    <TableHead className="text-right">Bruto</TableHead>
                    <TableHead className="text-right">Fee</TableHead>
                    <TableHead className="text-right">Neto</TableHead>
                    <TableHead>Estado</TableHead>
                    {tab === "pagada" && <TableHead>Pago</TableHead>}
                    {tab === "pendiente" && <TableHead></TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtradas.map((l) => {
                    const badge = estadoBadge(l.estado);
                    return (
                      <TableRow key={l.id}>
                        <TableCell className="whitespace-nowrap text-xs">
                          {formatFecha(l.fecha_generacion)}
                        </TableCell>
                        <TableCell className="text-sm">
                          <div>{l.experto?.nombre ?? "—"}</div>
                          <div className="text-xs text-muted-foreground">
                            {l.experto?.email ?? ""}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">
                          <div>{l.orden?.lotes?.nombre_lote ?? "—"}</div>
                          <div className="text-xs text-muted-foreground">
                            {l.tipo?.nombre ?? ""}
                          </div>
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-right text-sm">
                          {formatCOP(Number(l.monto_bruto))}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-right text-xs text-muted-foreground">
                          {Number(l.fee_pct)}% ={" "}
                          {formatCOP(Number(l.fee_monto))}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-right text-sm font-semibold text-foreground">
                          {formatCOP(Number(l.monto_neto))}
                        </TableCell>
                        <TableCell>
                          <Badge className={badge.className}>{badge.label}</Badge>
                        </TableCell>
                        {tab === "pagada" && (
                          <TableCell className="text-xs">
                            <div>{l.metodo_pago ?? "—"}</div>
                            {l.referencia_pago && (
                              <div className="font-mono text-[10px] text-muted-foreground">
                                {l.referencia_pago}
                              </div>
                            )}
                            <div className="text-[10px] text-muted-foreground">
                              {formatFecha(l.fecha_pago)}
                            </div>
                          </TableCell>
                        )}
                        {tab === "pendiente" && (
                          <TableCell>
                            <Button
                              size="sm"
                              onClick={() => setLiqSeleccionada(l)}
                            >
                              Marcar como pagada
                            </Button>
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </Card>
      </div>

      <MarcarLiquidacionPagadaDialog
        open={!!liqSeleccionada}
        onOpenChange={(v) => !v && setLiqSeleccionada(null)}
        liquidacion={liqSeleccionada}
      />
    </DashboardLayout>
  );
}
