import { useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";
import { useLiquidacionesAdmin } from "@/hooks/useLiquidacionesAdmin";
import { useMarcarLiquidacionPagada } from "@/hooks/useMarcarLiquidacionPagada";
import MarcarLiquidacionPagadaDialog from "@/components/liquidaciones/MarcarLiquidacionPagadaDialog";
import {
  Wallet, Search, Coins, Clock, Check, Banknote, MoreHorizontal, CheckCheck,
} from "lucide-react";
import { KPIEstado } from "@/components/ui/KPIEstado";
import { BulkActionsBar } from "@/components/ui/BulkActionsBar";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatCOP, formatCOPCompact, formatFecha } from "@/lib/format";
import { toast } from "sonner";
import type { LiquidacionRow } from "@/types/finanzas";

const estadoBadge = (estado: string) => {
  switch (estado) {
    case "pendiente":
      return { className: "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300", label: "Pendiente" };
    case "pagada":
      return { className: "bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-300", label: "Pagada" };
    case "cancelada":
      return { className: "bg-muted text-muted-foreground", label: "Cancelada" };
    default:
      return { className: "bg-muted text-muted-foreground", label: estado };
  }
};

export default function DashboardLiquidaciones() {
  const { isSuperAdmin, roles, loading } = useAuth();
  const isAdmin = isSuperAdmin || roles.some((r) => r === "admin");

  const [filtroEstado, setFiltroEstado] = useState<string>("todas");
  const [busqueda, setBusqueda] = useState("");
  const [orden, setOrden] = useState<"recientes" | "monto-desc">("recientes");
  const [liqSeleccionada, setLiqSeleccionada] = useState<LiquidacionRow | null>(null);
  const [seleccionados, setSeleccionados] = useState<Set<string>>(new Set());

  const { data: todas = [], isLoading } = useLiquidacionesAdmin();
  const marcarPagada = useMarcarLiquidacionPagada();

  if (loading) {
    return (
      <DashboardLayout>
        <div className="mx-auto max-w-7xl p-6"><Skeleton className="h-40 w-full" /></div>
      </DashboardLayout>
    );
  }
  if (!isAdmin) return <Navigate to="/dashboard" replace />;

  const total = todas.length;
  const pendientesCount = todas.filter((l) => l.estado === "pendiente").length;
  const pagadasCount = todas.filter((l) => l.estado === "pagada").length;
  const sumaPendiente = todas
    .filter((l) => l.estado === "pendiente")
    .reduce((s, l) => s + Number(l.monto_neto ?? 0), 0);
  const inicioMes = new Date();
  inicioMes.setDate(1); inicioMes.setHours(0, 0, 0, 0);
  const pagadoEsteMes = todas
    .filter((l) => l.estado === "pagada" && l.fecha_pago && new Date(l.fecha_pago) >= inicioMes)
    .reduce((s, l) => s + Number(l.monto_neto ?? 0), 0);

  const filtradas = useMemo<LiquidacionRow[]>(() => {
    let arr = todas;
    if (filtroEstado !== "todas") arr = arr.filter((l) => l.estado === filtroEstado);
    if (busqueda) {
      const s = busqueda.toLowerCase();
      arr = arr.filter(
        (l) =>
          (l.experto?.nombre ?? "").toLowerCase().includes(s) ||
          (l.experto?.email ?? "").toLowerCase().includes(s) ||
          (l.orden?.lotes?.nombre_lote ?? "").toLowerCase().includes(s) ||
          (l.tipo?.nombre ?? "").toLowerCase().includes(s),
      );
    }
    return [...arr].sort((a, b) => {
      if (orden === "monto-desc") return Number(b.monto_neto ?? 0) - Number(a.monto_neto ?? 0);
      return new Date(b.fecha_generacion).getTime() - new Date(a.fecha_generacion).getTime();
    });
  }, [todas, filtroEstado, busqueda, orden]);

  const toggleSel = (id: string) => {
    setSeleccionados((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };
  const todasSel = filtradas.length > 0 && filtradas.every((l) => seleccionados.has(l.id));
  const toggleTodas = () =>
    todasSel ? setSeleccionados(new Set()) : setSeleccionados(new Set(filtradas.map((l) => l.id)));

  const handleMarcarPagadaMultiple = async () => {
    const ids = Array.from(seleccionados);
    const pendientes = todas.filter((l) => ids.includes(l.id) && l.estado === "pendiente");
    if (pendientes.length === 0) {
      toast.error("Ninguna seleccionada está pendiente");
      return;
    }
    let ok = 0, fail = 0;
    for (const l of pendientes) {
      try {
        await marcarPagada.mutateAsync({ id: l.id, metodo_pago: "transferencia" });
        ok++;
      } catch { fail++; }
    }
    const omitidas = ids.length - pendientes.length;
    toast.success(
      `${ok} marcadas como pagadas` +
        (fail > 0 ? ` · ${fail} fallaron` : "") +
        (omitidas > 0 ? ` · ${omitidas} omitidas (no pendientes)` : ""),
    );
    setSeleccionados(new Set());
  };

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-7xl px-4 py-6 md:px-6">
        <header className="mb-4 flex flex-wrap items-start justify-between gap-3 rounded-lg border border-border bg-background p-5">
          <div>
            <h1 className="flex items-center gap-2 text-xl font-semibold text-foreground">
              <Wallet className="h-5 w-5" /> Liquidaciones de expertos
            </h1>
            <p className="mt-0.5 text-xs text-muted-foreground">
              <strong className="text-foreground">{total}</strong> en total
              {pendientesCount > 0 && (
                <> · <strong className="text-primary">{pendientesCount} pendientes de pagar</strong></>
              )}
              {sumaPendiente > 0 && <> · {formatCOPCompact(sumaPendiente)} en cola</>}
            </p>
          </div>
        </header>

        <div className="mb-3 grid grid-cols-2 gap-2 md:grid-cols-4">
          <KPIEstado label="Total" value={total} icon={Coins} colorClass="text-foreground" iconColorClass="text-muted-foreground" />
          <KPIEstado
            label="Pendientes"
            value={pendientesCount}
            icon={Clock}
            colorClass="text-primary"
            destacado={pendientesCount > 0}
            onClick={() => setFiltroEstado("pendiente")}
          />
          <KPIEstado label="Pagadas" value={pagadasCount} icon={Check} colorClass="text-green-600" />
          <KPIEstado label="Pagado este mes" value={formatCOPCompact(pagadoEsteMes)} icon={Banknote} colorClass="text-green-600" />
        </div>

        <div className="mb-2 flex flex-wrap items-center gap-2 rounded-md border border-border bg-background px-3 py-2">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar experto, lote o análisis..."
              className="h-8 pl-8 text-xs"
            />
          </div>
          <Select value={filtroEstado} onValueChange={setFiltroEstado}>
            <SelectTrigger className="h-8 w-auto text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas</SelectItem>
              <SelectItem value="pendiente">Pendientes</SelectItem>
              <SelectItem value="pagada">Pagadas</SelectItem>
              <SelectItem value="cancelada">Canceladas</SelectItem>
            </SelectContent>
          </Select>
          <Select value={orden} onValueChange={(v) => setOrden(v as "recientes" | "monto-desc")}>
            <SelectTrigger className="h-8 w-auto text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="recientes">Recientes</SelectItem>
              <SelectItem value="monto-desc">Mayor monto</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <BulkActionsBar
          count={seleccionados.size}
          itemLabel={{ singular: "liquidación seleccionada", plural: "liquidaciones seleccionadas" }}
          onClear={() => setSeleccionados(new Set())}
        >
          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={handleMarcarPagadaMultiple}>
            <CheckCheck className="mr-1 h-3 w-3" /> Marcar como pagadas
          </Button>
        </BulkActionsBar>

        {isLoading ? (
          <div className="space-y-2"><Skeleton className="h-12 w-full" /><Skeleton className="h-12 w-full" /></div>
        ) : filtradas.length === 0 ? (
          <EmptyState
            icon={Wallet}
            titulo="Sin liquidaciones pendientes"
            descripcion="Las liquidaciones a expertos por trabajos completados se mostrarán aquí."
          />

        ) : (
          <div className="overflow-hidden rounded-md border border-border bg-background">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead className="w-8">
                    <Checkbox checked={todasSel} onCheckedChange={toggleTodas} />
                  </TableHead>
                  <TableHead className="text-[10px] uppercase tracking-wide">ID</TableHead>
                  <TableHead className="text-[10px] uppercase tracking-wide">Experto</TableHead>
                  <TableHead className="text-[10px] uppercase tracking-wide">Concepto</TableHead>
                  <TableHead className="text-right text-[10px] uppercase tracking-wide">Neto</TableHead>
                  <TableHead className="text-center text-[10px] uppercase tracking-wide">Estado</TableHead>
                  <TableHead className="text-right text-[10px] uppercase tracking-wide">Fecha</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtradas.map((l) => {
                  const badge = estadoBadge(l.estado);
                  const checked = seleccionados.has(l.id);
                  return (
                    <TableRow
                      key={l.id}
                      className={`hover:bg-muted/30 ${l.estado === "pendiente" ? "bg-primary/5" : ""}`}
                    >
                      <TableCell><Checkbox checked={checked} onCheckedChange={() => toggleSel(l.id)} /></TableCell>
                      <TableCell className="font-mono text-[10px]">{l.id.slice(0, 8)}</TableCell>
                      <TableCell className="text-xs">
                        <div className="text-foreground">{l.experto?.nombre ?? "—"}</div>
                        <div className="text-[10px] text-muted-foreground">{l.experto?.email ?? ""}</div>
                      </TableCell>
                      <TableCell className="text-xs">
                        <div className="text-foreground">{l.orden?.lotes?.nombre_lote ?? "—"}</div>
                        <div className="text-[10px] text-muted-foreground">{l.tipo?.nombre ?? ""}</div>
                      </TableCell>
                      <TableCell className="text-right text-xs font-semibold text-foreground whitespace-nowrap">
                        {formatCOP(Number(l.monto_neto ?? 0))}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge className={`${badge.className} text-[10px]`}>{badge.label}</Badge>
                      </TableCell>
                      <TableCell className="text-right text-[10px] text-muted-foreground whitespace-nowrap">
                        {formatFecha(l.fecha_pago ?? l.fecha_generacion)}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                              <MoreHorizontal className="h-3.5 w-3.5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {l.estado === "pendiente" && (
                              <DropdownMenuItem onClick={() => setLiqSeleccionada(l)}>
                                <CheckCheck className="mr-2 h-3.5 w-3.5" /> Marcar como pagada
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => setLiqSeleccionada(l)}>
                              Ver detalle
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <MarcarLiquidacionPagadaDialog
        open={!!liqSeleccionada}
        onOpenChange={(v) => !v && setLiqSeleccionada(null)}
        liquidacion={liqSeleccionada}
      />
    </DashboardLayout>
  );
}
