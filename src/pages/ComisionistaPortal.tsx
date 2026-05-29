import { useMemo, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useMisAutorizaciones } from "@/hooks/useMisAutorizaciones";
import { useMisComisiones } from "@/hooks/useMisComisiones";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Eye, ExternalLink, Briefcase, Wallet } from "lucide-react";
import Navbar from "@/components/Navbar";
import CargarLoteComisionistaDialog from "@/components/comisionista/CargarLoteComisionistaDialog";

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

const estadoPubBadge = (estado: string, publicado: boolean) => {
  if (estado === "pendiente_validacion")
    return {
      className:
        "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300",
      label: "Pendiente validación",
    };
  if (estado === "rechazado")
    return { className: "bg-destructive/15 text-destructive", label: "Rechazado" };
  if (estado === "retirado")
    return { className: "bg-muted text-muted-foreground", label: "Retirado" };
  if (estado === "aprobado" && publicado)
    return {
      className:
        "bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-300",
      label: "Publicado",
    };
  return { className: "bg-muted text-muted-foreground", label: "Aprobado" };
};

const estadoComBadge = (estado: string) => {
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
      return { className: "bg-muted text-muted-foreground", label: "Cancelada" };
    default:
      return { className: "bg-muted text-muted-foreground", label: estado };
  }
};

export default function ComisionistaPortal() {
  const { user, loading, isComisionista, isAdminOrExperto } = useAuth();
  const [openDialog, setOpenDialog] = useState(false);

  const { data: autorizaciones = [], isLoading: loadingAut } = useMisAutorizaciones();
  const { data: comisiones = [], isLoading: loadingCom } = useMisComisiones();

  const kpis = useMemo(() => {
    const arr = comisiones as any[];
    const total = arr.reduce((acc, c) => acc + Number(c.comision_monto ?? 0), 0);
    const pendiente = arr
      .filter((c) => c.estado === "pendiente")
      .reduce((acc, c) => acc + Number(c.comision_monto ?? 0), 0);
    const pagado = arr
      .filter((c) => c.estado === "pagada")
      .reduce((acc, c) => acc + Number(c.comision_monto ?? 0), 0);
    return { total, pendiente, pagado };
  }, [comisiones]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Skeleton className="h-32 w-64" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (!isComisionista && !isAdminOrExperto)
    return <Navigate to="/bienvenida" replace />;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 md:px-6">
        <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="flex items-center gap-2 font-display text-2xl font-semibold text-foreground">
              <Briefcase className="h-6 w-6" /> Portal del comisionista
            </h1>
            <p className="font-body text-sm text-muted-foreground">
              Lotes que representas y seguimiento de tus comisiones.
            </p>
          </div>
        </header>

        <Tabs defaultValue="lotes">
          <TabsList>
            <TabsTrigger value="lotes">Lotes que represento</TabsTrigger>
            <TabsTrigger value="comisiones">Mis comisiones</TabsTrigger>
          </TabsList>

          {/* TAB 1: lotes */}
          <TabsContent value="lotes" className="mt-4 space-y-4">
            <div className="flex justify-end">
              <Button onClick={() => setOpenDialog(true)}>
                <Plus className="mr-2 h-4 w-4" /> Cargar lote de propietario
              </Button>
            </div>

            {loadingAut ? (
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-44" />
                ))}
              </div>
            ) : autorizaciones.length === 0 ? (
              <Card className="p-10 text-center font-body text-sm text-muted-foreground">
                Aún no representas ningún lote. Carga uno con el botón de arriba.
              </Card>
            ) : (
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                {(autorizaciones as any[]).map((a) => {
                  const lote = a.lote;
                  const badge = estadoPubBadge(
                    lote?.estado_publicacion ?? "aprobado",
                    !!lote?.publicado_venta
                  );
                  return (
                    <Card key={a.id} className="flex flex-col gap-3 p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h3 className="truncate font-display font-semibold text-foreground">
                            {lote?.nombre_lote ?? "—"}
                          </h3>
                          <p className="truncate text-xs text-muted-foreground">
                            {[lote?.ciudad, lote?.barrio].filter(Boolean).join(" · ") || "—"}
                          </p>
                        </div>
                        <Badge className={badge.className}>{badge.label}</Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <p className="text-muted-foreground">Propietario</p>
                          <p className="truncate font-medium">{a.propietario?.nombre ?? "—"}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Comisión</p>
                          <p className="font-medium">{Number(a.comision_pct)}%</p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-muted-foreground">Precio estimado</p>
                          <p className="font-medium">
                            {formatCOP(lote?.precio_venta_estimado)}
                          </p>
                        </div>
                      </div>

                      <div className="mt-auto flex gap-2 pt-2">
                        <Button asChild size="sm" variant="outline" className="flex-1">
                          <Link to={`/lotes/${a.lote_id}/ficha`}>
                            <Eye className="mr-1 h-3 w-3" /> Ficha
                          </Link>
                        </Button>
                        {lote?.publicado_venta && lote?.estado_publicacion === "aprobado" && (
                          <Button asChild size="sm" variant="outline" className="flex-1">
                            <Link to={`/lotes/${a.lote_id}`}>
                              <ExternalLink className="mr-1 h-3 w-3" /> Mercado
                            </Link>
                          </Button>
                        )}
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* TAB 2: comisiones */}
          <TabsContent value="comisiones" className="mt-4 space-y-4">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <Card className="p-4 border-l-4 border-l-primary">
                <p className="text-xs text-muted-foreground">Total potencial</p>
                <p className="font-display text-xl font-semibold text-primary">
                  {formatCOP(kpis.total)}
                </p>
              </Card>
              <Card className="p-4 border-l-4 border-l-amber-500">
                <p className="text-xs text-muted-foreground">Pendiente de cobro</p>
                <p className="font-display text-xl font-semibold text-amber-700 dark:text-amber-400">
                  {formatCOP(kpis.pendiente)}
                </p>
              </Card>
              <Card className="p-4 border-l-4 border-l-green-500">
                <p className="text-xs text-muted-foreground">Ya cobrado</p>
                <p className="font-display text-xl font-semibold text-green-700 dark:text-green-400">
                  {formatCOP(kpis.pagado)}
                </p>
              </Card>
            </div>

            {loadingCom ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : comisiones.length === 0 ? (
              <Card className="flex flex-col items-center gap-2 p-10 text-center font-body text-sm text-muted-foreground">
                <Wallet className="h-8 w-8" />
                Aún no tienes comisiones. Se generan automáticamente al cerrar la venta de un lote que representas.
              </Card>
            ) : (
              <div className="space-y-3">
                {(comisiones as any[]).map((c) => {
                  const badge = estadoComBadge(c.estado);
                  return (
                    <Card key={c.id} className="p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="truncate font-display font-semibold text-foreground">
                              {c.lote?.nombre_lote ?? "—"}
                            </h4>
                            <Badge className={badge.className}>{badge.label}</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {c.lote?.ciudad ?? ""}
                          </p>
                          <div className="mt-2 grid grid-cols-2 gap-2 text-xs md:grid-cols-4">
                            <div>
                              <p className="text-muted-foreground">Precio venta</p>
                              <p className="font-medium">{formatCOP(Number(c.base_calculo))}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">% comisión</p>
                              <p className="font-medium">{Number(c.comision_pct)}%</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Monto</p>
                              <p className="font-semibold text-green-700 dark:text-green-400">
                                {formatCOP(Number(c.comision_monto))}
                              </p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">
                                {c.estado === "pagada" ? "Pago" : "Generada"}
                              </p>
                              <p className="font-medium">
                                {c.estado === "pagada"
                                  ? `${c.metodo_pago ?? ""} · ${formatFecha(c.fecha_pago)}`
                                  : formatFecha(c.fecha_generacion)}
                              </p>
                            </div>
                          </div>
                          {c.estado === "pendiente" && (
                            <p className="mt-2 text-xs text-muted-foreground">
                              360Lateral procesará tu comisión próximamente.
                            </p>
                          )}
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <CargarLoteComisionistaDialog open={openDialog} onOpenChange={setOpenDialog} />
    </div>
  );
}
