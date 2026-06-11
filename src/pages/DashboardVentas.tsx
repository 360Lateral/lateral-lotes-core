import { useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { useVentasCerradas } from "@/hooks/useVentasCerradas";
import { useComisionesAdmin } from "@/hooks/useComisionesAdmin";
import MarcarComisionPagadaDialog, {
  formatCOP,
} from "@/components/comisiones/MarcarComisionPagadaDialog";
import { Handshake, TrendingUp, Wallet, Calendar } from "lucide-react";
import type { ComisionRow } from "@/types/finanzas";

interface VentaRow {
  id: string;
  fecha_cierre: string | null;
  precio_venta_final: number | string | null;
  fee_360_pct: number | string | null;
  fee_360_monto: number | string | null;
  comprador_externo: string | null;
  lote?: { nombre_lote: string | null; ciudad: string | null } | null;
  developer?: { nombre: string | null } | null;
  cerrada_por_perfil?: { nombre: string | null } | null;
}

const formatFecha = (s: string | null | undefined) =>
  s ? new Date(s).toLocaleDateString("es-CO") : "—";

export default function DashboardVentas() {
  const { roles, loading } = useAuth();
  const isAdmin = roles.some((r) => ["super_admin", "admin"].includes(r));

  const [subTab, setSubTab] = useState<"pendiente" | "pagada">("pendiente");
  const [comisionSeleccionada, setComisionSeleccionada] = useState<ComisionRow | null>(null);

  const { data: ventasData = [], isLoading: loadingVentas } = useVentasCerradas();
  const ventas = ventasData as unknown as VentaRow[];
  const { data: todasComisiones = [] } = useComisionesAdmin();
  const { data: comisionesFiltradas = [], isLoading: loadingComisiones } =
    useComisionesAdmin(subTab);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="mx-auto max-w-7xl p-6">
          <Skeleton className="h-40 w-full" />
        </div>
      </DashboardLayout>
    );
  }
  if (!isAdmin) return <Navigate to="/dashboard" replace />;

  const totalVendido = ventas.reduce(
    (acc, v) => acc + Number(v.precio_venta_final ?? 0),
    0
  );
  const feeAcumulado = ventas.reduce(
    (acc, v) => acc + Number(v.fee_360_monto ?? 0),
    0
  );
  const hoy = new Date();
  const ventasMes = ventas.filter((v) => {
    if (!v.fecha_cierre) return false;
    const f = new Date(v.fecha_cierre);
    return f.getMonth() === hoy.getMonth() && f.getFullYear() === hoy.getFullYear();
  }).length;
  const comisionesPorPagar = todasComisiones
    .filter((c) => c.estado === "pendiente")
    .reduce((acc, c) => acc + Number(c.comision_monto ?? 0), 0);

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 md:px-6">
        <header>
          <h1 className="flex items-center gap-2 font-display text-2xl font-semibold">
            <Handshake className="h-6 w-6" /> Ventas y comisiones
          </h1>
          <p className="text-sm text-muted-foreground">
            Ventas cerradas y comisiones a comisionistas.
          </p>
        </header>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Card className="p-4 border-l-4 border-l-primary">
            <p className="text-xs text-muted-foreground">Total vendido</p>
            <p className="font-display text-xl font-semibold text-primary">
              {formatCOP(totalVendido)}
            </p>
          </Card>
          <Card className="p-4 border-l-4 border-l-green-500">
            <p className="text-xs text-muted-foreground">Fee 360Lateral acumulado</p>
            <p className="font-display text-xl font-semibold text-green-700 dark:text-green-400">
              {formatCOP(feeAcumulado)}
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Calendar className="h-3 w-3" /> Ventas este mes
            </p>
            <p className="font-display text-xl font-semibold text-foreground">{ventasMes}</p>
          </Card>
          <Card className="p-4 border-l-4 border-l-amber-500">
            <p className="text-xs text-muted-foreground">Comisiones por pagar</p>
            <p className="font-display text-xl font-semibold text-amber-700 dark:text-amber-400">
              {formatCOP(comisionesPorPagar)}
            </p>
          </Card>
        </div>

        <Tabs defaultValue="ventas">
          <TabsList className="flex w-full flex-wrap">
            <TabsTrigger value="ventas" className="flex-1 min-w-[140px] gap-1">
              <TrendingUp className="h-4 w-4" /> Ventas cerradas
            </TabsTrigger>
            <TabsTrigger value="comisiones" className="flex-1 min-w-[140px] gap-1">
              <Wallet className="h-4 w-4" /> Comisiones
            </TabsTrigger>
          </TabsList>

          <TabsContent value="ventas">
            <Card>
              {loadingVentas ? (
                <div className="space-y-2 p-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : ventas.length === 0 ? (
                <div className="p-10 text-center text-sm text-muted-foreground">
                  Aún no hay ventas cerradas.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fecha cierre</TableHead>
                        <TableHead>Lote</TableHead>
                        <TableHead>Comprador</TableHead>
                        <TableHead className="text-right">Precio final</TableHead>
                        <TableHead className="text-right">Fee 360</TableHead>
                        <TableHead>Cerrada por</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {ventas.map((v) => (
                        <TableRow key={v.id}>
                          <TableCell className="whitespace-nowrap text-xs">
                            {formatFecha(v.fecha_cierre)}
                          </TableCell>
                          <TableCell className="text-sm">
                            <div>{v.lote?.nombre_lote ?? "—"}</div>
                            <div className="text-xs text-muted-foreground">
                              {v.lote?.ciudad ?? ""}
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">
                            {v.comprador_externo || v.developer?.nombre || "—"}
                          </TableCell>
                          <TableCell className="whitespace-nowrap text-right font-semibold">
                            {formatCOP(Number(v.precio_venta_final))}
                          </TableCell>
                          <TableCell className="whitespace-nowrap text-right text-xs">
                            {Number(v.fee_360_pct)}%{" "}
                            <span className="block text-muted-foreground">
                              {formatCOP(Number(v.fee_360_monto))}
                            </span>
                          </TableCell>
                          <TableCell className="text-xs">
                            {v.cerrada_por_perfil?.nombre ?? "—"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="comisiones" className="space-y-3">
            <Tabs value={subTab} onValueChange={(v) => setSubTab(v as "pendiente" | "pagada")}>;
              <TabsList>
                <TabsTrigger value="pendiente">Pendientes</TabsTrigger>
                <TabsTrigger value="pagada">Pagadas</TabsTrigger>
              </TabsList>
            </Tabs>

            <Card>
              {loadingComisiones ? (
                <div className="space-y-2 p-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : comisionesFiltradas.length === 0 ? (
                <div className="p-10 text-center text-sm text-muted-foreground">
                  {subTab === "pendiente"
                    ? "No hay comisiones pendientes de pago."
                    : "Aún no se han registrado pagos de comisiones."}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Comisionista</TableHead>
                        <TableHead>Lote</TableHead>
                        <TableHead className="text-right">Base</TableHead>
                        <TableHead className="text-right">%</TableHead>
                        <TableHead className="text-right">Monto</TableHead>
                        <TableHead>Estado</TableHead>
                        {subTab === "pendiente" && <TableHead></TableHead>}
                        {subTab === "pagada" && <TableHead>Pago</TableHead>}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {comisionesFiltradas.map((c) => (
                        <TableRow key={c.id}>
                          <TableCell className="whitespace-nowrap text-xs">
                            {formatFecha(c.fecha_generacion)}
                          </TableCell>
                          <TableCell className="text-sm">
                            <div>{c.comisionista?.nombre ?? "—"}</div>
                            <div className="text-xs text-muted-foreground">
                              {c.comisionista?.email ?? ""}
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">
                            {c.lote?.nombre_lote ?? "—"}
                          </TableCell>
                          <TableCell className="whitespace-nowrap text-right text-sm">
                            {formatCOP(Number(c.base_calculo))}
                          </TableCell>
                          <TableCell className="whitespace-nowrap text-right text-xs">
                            {Number(c.comision_pct)}%
                          </TableCell>
                          <TableCell className="whitespace-nowrap text-right text-sm font-semibold">
                            {formatCOP(Number(c.comision_monto))}
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={
                                c.estado === "pendiente"
                                  ? "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300"
                                  : c.estado === "pagada"
                                  ? "bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-300"
                                  : "bg-muted text-muted-foreground"
                              }
                            >
                              {c.estado}
                            </Badge>
                          </TableCell>
                          {subTab === "pendiente" && (
                            <TableCell>
                              <Button
                                size="sm"
                                onClick={() => setComisionSeleccionada(c)}
                              >
                                Marcar pagada
                              </Button>
                            </TableCell>
                          )}
                          {subTab === "pagada" && (
                            <TableCell className="text-xs">
                              <div>{c.metodo_pago ?? "—"}</div>
                              {c.referencia_pago && (
                                <div className="font-mono text-[10px] text-muted-foreground">
                                  {c.referencia_pago}
                                </div>
                              )}
                              <div className="text-[10px] text-muted-foreground">
                                {formatFecha(c.fecha_pago)}
                              </div>
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <MarcarComisionPagadaDialog
        open={!!comisionSeleccionada}
        onOpenChange={(v) => !v && setComisionSeleccionada(null)}
        comision={comisionSeleccionada}
      />
    </DashboardLayout>
  );
}
