import { useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate as Redir } from "react-router-dom";
import { useTransaccionesAdmin } from "@/hooks/useTransaccionesAdmin";
import TransaccionDetalleDialog, {
  estadoBadgeVariant,
} from "@/components/pagos/TransaccionDetalleDialog";
import {
  CreditCard,
  Search,
  Check,
  X,
  Clock,
  TrendingUp,
  Eye,
  Download,
} from "lucide-react";
import { KPIEstado } from "@/components/ui/KPIEstado";
import { BulkActionsBar } from "@/components/ui/BulkActionsBar";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatCOP, formatCOPCompact, formatFecha } from "@/lib/format";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const ESTADOS = [
  { value: "todas", label: "Todas" },
  { value: "pendiente", label: "Pendientes" },
  { value: "aprobada", label: "Aprobadas" },
  { value: "declinada", label: "Declinadas" },
  { value: "expirada", label: "Expiradas" },
  { value: "reembolsada", label: "Reembolsadas" },
  { value: "error", label: "Error" },
];

type OrdenKey = "recientes" | "monto-desc" | "monto-asc";

export default function DashboardPagos() {
  const { isSuperAdmin, roles, loading } = useAuth();
  const isAdmin = isSuperAdmin || roles.some((r) => r === "admin");
  const qc = useQueryClient();

  const [filtroEstado, setFiltroEstado] = useState<string>("todas");
  const [orden, setOrden] = useState<OrdenKey>("recientes");
  const [busqueda, setBusqueda] = useState("");
  const [detalleId, setDetalleId] = useState<string | undefined>(undefined);
  const [seleccionados, setSeleccionados] = useState<Set<string>>(new Set());
  const [confirmAction, setConfirmAction] = useState<"aprobar" | "declinar" | null>(null);

  const { data: todas = [], isLoading } = useTransaccionesAdmin();

  const bulkMutation = useMutation({
    mutationFn: async ({ ids, nuevoEstado }: { ids: string[]; nuevoEstado: "aprobada" | "declinada" }) => {
      const { error } = await supabase
        .from("transacciones")
        .update({
          estado: nuevoEstado,
          fecha_aprobacion: nuevoEstado === "aprobada" ? new Date().toISOString() : null,
        })
        .in("id", ids);
      if (error) throw error;
      return ids.length;
    },
    onSuccess: (n, vars) => {
      qc.invalidateQueries({ queryKey: ["transacciones-admin"] });
      const omitidas = seleccionados.size - n;
      toast.success(
        `${n} ${vars.nuevoEstado === "aprobada" ? "aprobadas" : "declinadas"}` +
          (omitidas > 0 ? ` · ${omitidas} omitidas (no estaban pendientes)` : ""),
      );
      setSeleccionados(new Set());
    },
    onError: (e: Error) => toast.error("Error en acción masiva", { description: e.message }),
  });

  if (loading) {
    return (
      <DashboardLayout>
        <div className="mx-auto max-w-7xl p-6"><Skeleton className="h-40 w-full" /></div>
      </DashboardLayout>
    );
  }
  if (!isAdmin) return <Redir to="/dashboard" replace />;

  // KPIs
  const total = todas.length;
  const pendientesCount = todas.filter((t) => t.estado === "pendiente").length;
  const aprobadasCount = todas.filter((t) => t.estado === "aprobada").length;
  const declinadasCount = todas.filter((t) =>
    ["declinada", "expirada", "error"].includes(t.estado),
  ).length;
  const cutoff = Date.now() - 30 * 86400000;
  const ingresos30 = todas
    .filter(
      (t) =>
        t.estado === "aprobada" &&
        new Date(t.fecha_aprobacion ?? t.fecha_creacion).getTime() > cutoff,
    )
    .reduce((sum, t) => sum + Number(t.monto_cop ?? 0), 0);

  // Filtrado + orden
  const filtradas = useMemo(() => {
    let arr = todas;
    if (filtroEstado !== "todas") arr = arr.filter((t) => t.estado === filtroEstado);
    if (busqueda) {
      const s = busqueda.toLowerCase();
      arr = arr.filter((t) => {
        return (
          t.id.toLowerCase().includes(s) ||
          (t.propietario?.email ?? "").toLowerCase().includes(s) ||
          (t.propietario?.nombre ?? "").toLowerCase().includes(s) ||
          (t.engagement?.lotes?.nombre_lote ?? "").toLowerCase().includes(s) ||
          (t.plan?.nombre ?? "").toLowerCase().includes(s)
        );
      });
    }
    return [...arr].sort((a, b) => {
      if (orden === "monto-desc") return Number(b.monto_cop ?? 0) - Number(a.monto_cop ?? 0);
      if (orden === "monto-asc") return Number(a.monto_cop ?? 0) - Number(b.monto_cop ?? 0);
      return new Date(b.fecha_creacion).getTime() - new Date(a.fecha_creacion).getTime();
    });
  }, [todas, filtroEstado, busqueda, orden]);

  const toggleSeleccion = (id: string) => {
    setSeleccionados((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  const todasSeleccionadas =
    filtradas.length > 0 && filtradas.every((t) => seleccionados.has(t.id));
  const toggleSeleccionTodas = () => {
    if (todasSeleccionadas) setSeleccionados(new Set());
    else setSeleccionados(new Set(filtradas.map((t) => t.id)));
  };

  const handleBulk = (action: "aprobar" | "declinar") => {
    const ids = Array.from(seleccionados);
    const pendientesIds = todas
      .filter((t) => ids.includes(t.id) && t.estado === "pendiente")
      .map((t) => t.id);
    if (pendientesIds.length === 0) {
      toast.error("Ninguna transacción seleccionada está pendiente");
      return;
    }
    bulkMutation.mutate({
      ids: pendientesIds,
      nuevoEstado: action === "aprobar" ? "aprobada" : "declinada",
    });
    setConfirmAction(null);
  };

  const handleExportarCsv = () => {
    const rows = [
      ["ID", "Fecha", "Lote", "Propietario", "Email", "Plan", "Monto", "Estado", "Reference"],
      ...filtradas.map((t) => [
        t.id,
        t.fecha_creacion,
        t.engagement?.lotes?.nombre_lote ?? "",
        t.propietario?.nombre ?? "",
        t.propietario?.email ?? "",
        t.plan?.nombre ?? "",
        String(t.monto_cop ?? 0),
        t.estado,
        t.wompi_reference ?? "",
      ]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pagos-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-7xl px-4 py-6 md:px-6">
        {/* Header */}
        <header className="mb-4 flex flex-wrap items-start justify-between gap-3 rounded-lg border border-border bg-background p-5">
          <div>
            <h1 className="flex items-center gap-2 text-xl font-semibold text-foreground">
              <CreditCard className="h-5 w-5" /> Pagos
            </h1>
            <p className="mt-0.5 text-xs text-muted-foreground">
              <strong className="text-foreground">{total}</strong> transacciones totales
              {pendientesCount > 0 && (
                <>
                  {" · "}
                  <strong className="text-primary">{pendientesCount} pendientes</strong> de revisión
                </>
              )}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={handleExportarCsv}>
              <Download className="mr-1.5 h-3.5 w-3.5" /> Exportar
            </Button>
          </div>
        </header>

        {/* KPIs */}
        <div className="mb-3 grid grid-cols-2 gap-2 md:grid-cols-5">
          <KPIEstado label="Total" value={total} icon={CreditCard} colorClass="text-foreground" iconColorClass="text-muted-foreground" />
          <KPIEstado
            label="Pendientes"
            value={pendientesCount}
            icon={Clock}
            colorClass="text-primary"
            destacado={pendientesCount > 0}
            onClick={() => setFiltroEstado("pendiente")}
          />
          <KPIEstado label="Aprobadas" value={aprobadasCount} icon={Check} colorClass="text-green-600" />
          <KPIEstado label="Declinadas" value={declinadasCount} icon={X} colorClass="text-destructive" />
          <KPIEstado label="Ingresos 30d" value={formatCOPCompact(ingresos30)} icon={TrendingUp} colorClass="text-green-600" />
        </div>

        {/* Toolbar */}
        <div className="mb-2 flex flex-wrap items-center gap-2 rounded-md border border-border bg-background px-3 py-2">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por ID, lote, propietario o plan..."
              className="h-8 pl-8 text-xs"
            />
          </div>
          <Select value={filtroEstado} onValueChange={setFiltroEstado}>
            <SelectTrigger className="h-8 w-auto text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {ESTADOS.map((e) => <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={orden} onValueChange={(v) => setOrden(v as OrdenKey)}>
            <SelectTrigger className="h-8 w-auto text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="recientes">Recientes</SelectItem>
              <SelectItem value="monto-desc">Mayor monto</SelectItem>
              <SelectItem value="monto-asc">Menor monto</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Bulk actions */}
        <BulkActionsBar
          count={seleccionados.size}
          itemLabel={{ singular: "transacción seleccionada", plural: "transacciones seleccionadas" }}
          onClear={() => setSeleccionados(new Set())}
        >
          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setConfirmAction("aprobar")}>
            <Check className="mr-1 h-3 w-3" /> Aprobar
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-7 border-destructive text-destructive text-xs"
            onClick={() => setConfirmAction("declinar")}
          >
            <X className="mr-1 h-3 w-3" /> Declinar
          </Button>
        </BulkActionsBar>

        {/* Tabla */}
        {isLoading ? (
          <div className="space-y-2"><Skeleton className="h-12 w-full" /><Skeleton className="h-12 w-full" /><Skeleton className="h-12 w-full" /></div>
        ) : filtradas.length === 0 ? (
          <EmptyState icon={CreditCard} title="Sin transacciones" description="No hay transacciones que coincidan con los filtros." />
        ) : (
          <div className="overflow-hidden rounded-md border border-border bg-background">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead className="w-8">
                    <Checkbox checked={todasSeleccionadas} onCheckedChange={toggleSeleccionTodas} />
                  </TableHead>
                  <TableHead className="text-[10px] uppercase tracking-wide">ID</TableHead>
                  <TableHead className="text-[10px] uppercase tracking-wide">Lote / Plan</TableHead>
                  <TableHead className="text-[10px] uppercase tracking-wide">Propietario</TableHead>
                  <TableHead className="text-right text-[10px] uppercase tracking-wide">Monto</TableHead>
                  <TableHead className="text-center text-[10px] uppercase tracking-wide">Estado</TableHead>
                  <TableHead className="text-right text-[10px] uppercase tracking-wide">Fecha</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtradas.map((t) => {
                  const badge = estadoBadgeVariant(t.estado);
                  const checked = seleccionados.has(t.id);
                  return (
                    <TableRow
                      key={t.id}
                      className={`hover:bg-muted/30 ${t.estado === "pendiente" ? "bg-primary/5" : ""}`}
                    >
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Checkbox checked={checked} onCheckedChange={() => toggleSeleccion(t.id)} />
                      </TableCell>
                      <TableCell className="font-mono text-[10px] cursor-pointer" onClick={() => setDetalleId(t.id)}>
                        {t.id.slice(0, 8)}
                      </TableCell>
                      <TableCell className="text-xs cursor-pointer" onClick={() => setDetalleId(t.id)}>
                        <div className="font-medium text-foreground">{t.engagement?.lotes?.nombre_lote ?? "—"}</div>
                        <div className="text-[10px] text-muted-foreground">{t.plan?.nombre ?? ""}</div>
                      </TableCell>
                      <TableCell className="text-xs cursor-pointer" onClick={() => setDetalleId(t.id)}>
                        <div className="text-foreground">{t.propietario?.nombre ?? "—"}</div>
                        <div className="text-[10px] text-muted-foreground">{t.propietario?.email ?? ""}</div>
                      </TableCell>
                      <TableCell className="text-right text-xs font-semibold text-foreground whitespace-nowrap">
                        {formatCOP(Number(t.monto_cop ?? 0))}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge className={`${badge.className} text-[10px]`}>{badge.label}</Badge>
                      </TableCell>
                      <TableCell className="text-right text-[10px] text-muted-foreground whitespace-nowrap">
                        {formatFecha(t.fecha_aprobacion ?? t.fecha_creacion)}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setDetalleId(t.id)}>
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <TransaccionDetalleDialog
        open={!!detalleId}
        onOpenChange={(v) => !v && setDetalleId(undefined)}
        transaccionId={detalleId}
      />

      <AlertDialog open={!!confirmAction} onOpenChange={(v) => !v && setConfirmAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction === "aprobar" ? "Aprobar transacciones" : "Declinar transacciones"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción modificará el estado de las transacciones pendientes seleccionadas. Las que ya no estén pendientes se omitirán.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => confirmAction && handleBulk(confirmAction)}>
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
