import { useMemo, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { useTransaccionesAdmin } from "@/hooks/useTransaccionesAdmin";
import TransaccionDetalleDialog, {
  estadoBadgeVariant,
} from "@/components/pagos/TransaccionDetalleDialog";
import { CreditCard, Search } from "lucide-react";

const formatCOP = (n: number | null | undefined) =>
  n == null
    ? "—"
    : new Intl.NumberFormat("es-CO", {
        style: "currency",
        currency: "COP",
        maximumFractionDigits: 0,
      }).format(n);

const formatFecha = (s: string | null | undefined) =>
  s ? new Date(s).toLocaleDateString("es-CO") : "—";

const ESTADOS = [
  { value: "todas", label: "Todas" },
  { value: "pendiente", label: "Pendientes" },
  { value: "aprobada", label: "Aprobadas" },
  { value: "declinada", label: "Declinadas" },
  { value: "expirada", label: "Expiradas" },
  { value: "reembolsada", label: "Reembolsadas" },
  { value: "error", label: "Error" },
];

export default function DashboardPagos() {
  const { isAdminOrExperto, isSuperAdmin, roles, loading } = useAuth();
  const isAdmin =
    isSuperAdmin || roles.some((r) => r === "admin");

  const [tab, setTab] = useState<string>("todas");
  const [searchProp, setSearchProp] = useState("");
  const [searchLote, setSearchLote] = useState("");
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [detalleId, setDetalleId] = useState<string | undefined>(undefined);

  const { data: todas = [], isLoading: loadingTodas } = useTransaccionesAdmin();
  const { data: porEstado = [], isLoading: loadingEstado } = useTransaccionesAdmin(
    tab === "todas" ? undefined : tab,
  );

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

  // KPIs basados en TODAS las transacciones
  const ahora = new Date();
  const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
  const ingresosMes = todas
    .filter(
      (t: any) =>
        t.estado === "aprobada" && new Date(t.fecha_creacion) >= inicioMes,
    )
    .reduce((acc: number, t: any) => acc + Number(t.monto_cop ?? 0), 0);

  const pendientesCount = todas.filter((t: any) => t.estado === "pendiente").length;
  const aprobadasCount = todas.filter((t: any) => t.estado === "aprobada").length;

  const denomTasa = todas.filter((t: any) =>
    ["aprobada", "declinada", "expirada", "error"].includes(t.estado),
  ).length;
  const tasaConversion =
    denomTasa === 0 ? 0 : Math.round((aprobadasCount / denomTasa) * 100);

  // Filtrado adicional sobre lista de la tab
  const filtradas = useMemo(() => {
    return porEstado.filter((t) => {
      if (searchProp) {
        const s = searchProp.toLowerCase();
        const nombre = (t.propietario?.nombre ?? "").toLowerCase();
        const email = (t.propietario?.email ?? "").toLowerCase();
        if (!nombre.includes(s) && !email.includes(s)) return false;
      }
      if (searchLote) {
        const s = searchLote.toLowerCase();
        const lote = (t.engagement?.lotes?.nombre_lote ?? "").toLowerCase();
        if (!lote.includes(s)) return false;
      }
      if (desde && new Date(t.fecha_creacion) < new Date(desde)) return false;
      if (hasta) {
        const fin = new Date(hasta);
        fin.setHours(23, 59, 59, 999);
        if (new Date(t.fecha_creacion) > fin) return false;
      }
      return true;
    });
  }, [porEstado, searchProp, searchLote, desde, hasta]);

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 md:px-6">
        <header>
          <h1 className="flex items-center gap-2 font-display text-2xl font-semibold text-foreground">
            <CreditCard className="h-6 w-6" /> Pagos y transacciones
          </h1>
          <p className="font-body text-sm text-muted-foreground">
            Histórico completo de cobros a propietarios por diagnóstico inmobiliario.
          </p>
        </header>

        {/* KPIs */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Card className="p-4">
            <p className="text-xs text-muted-foreground">Ingresos del mes</p>
            <p className="font-display text-xl font-semibold text-foreground">
              {formatCOP(ingresosMes)}
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-muted-foreground">Pendientes</p>
            <p className="font-display text-xl font-semibold text-foreground">
              {pendientesCount}
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-muted-foreground">Aprobadas (histórico)</p>
            <p className="font-display text-xl font-semibold text-foreground">
              {aprobadasCount}
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-muted-foreground">Tasa de conversión</p>
            <p className="font-display text-xl font-semibold text-foreground">
              {tasaConversion}%
            </p>
          </Card>
        </div>

        {/* Filtros */}
        <Card className="p-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Propietario (nombre / email)"
                value={searchProp}
                onChange={(e) => setSearchProp(e.target.value)}
                className="pl-8"
              />
            </div>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Lote"
                value={searchLote}
                onChange={(e) => setSearchLote(e.target.value)}
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
            {ESTADOS.map((e) => (
              <TabsTrigger key={e.value} value={e.value} className="flex-1 min-w-[100px]">
                {e.label}
              </TabsTrigger>
            ))}
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
              No hay transacciones que coincidan con los filtros.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Lote</TableHead>
                    <TableHead>Propietario</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead className="text-right">Monto</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtradas.map((t) => {
                    const badge = estadoBadgeVariant(t.estado);
                    return (
                      <TableRow key={t.id}>
                        <TableCell className="whitespace-nowrap text-xs">
                          {formatFecha(t.fecha_creacion)}
                        </TableCell>
                        <TableCell className="text-sm">
                          {t.engagement?.lotes?.nombre_lote ?? "—"}
                        </TableCell>
                        <TableCell className="text-sm">
                          <div>{t.propietario?.nombre ?? "—"}</div>
                          <div className="text-xs text-muted-foreground">
                            {t.propietario?.email ?? ""}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">{t.plan?.nombre ?? "—"}</TableCell>
                        <TableCell className="whitespace-nowrap text-right text-sm">
                          {formatCOP(t.monto_cop == null ? null : Number(t.monto_cop))}
                        </TableCell>
                        <TableCell>
                          <Badge className={badge.className}>{badge.label}</Badge>
                        </TableCell>
                        <TableCell className="font-mono text-[10px] text-muted-foreground">
                          {t.wompi_reference ?? "—"}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setDetalleId(t.id)}
                          >
                            Ver detalle
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </Card>
      </div>

      <TransaccionDetalleDialog
        open={!!detalleId}
        onOpenChange={(v) => !v && setDetalleId(undefined)}
        transaccionId={detalleId}
      />
    </DashboardLayout>
  );
}
