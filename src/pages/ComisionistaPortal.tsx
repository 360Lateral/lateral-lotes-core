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
import {
  Plus,
  Eye,
  ExternalLink,
  Wallet,
  Briefcase,
  Clock,
  CheckCircle2,
  TrendingUp,
  MapPin,
  FileText,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import CargarLoteComisionistaDialog from "@/components/comisionista/CargarLoteComisionistaDialog";
import { KPIEstado } from "@/components/ui/KPIEstado";
import { EmptyState } from "@/components/ui/EmptyState";
import { FotoLote } from "@/components/lotes/FotoLote";
import { formatCOP, formatCOPCompact, formatFecha } from "@/lib/format";

const estadoPubBadge = (estado: string, publicado: boolean) => {
  if (estado === "pendiente_validacion")
    return {
      className:
        "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300",
      label: "Pendiente",
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

interface CardLoteProps {
  autorizacion: any;
}

const CardLoteRepresentado = ({ autorizacion }: CardLoteProps) => {
  const lote = autorizacion.lote;
  const badge = estadoPubBadge(
    lote?.estado_publicacion ?? "aprobado",
    !!lote?.publicado_venta
  );
  const fotoUrl: string | null =
    lote?.foto_url ?? lote?.fotos_lotes?.[0]?.url ?? null;
  const precio = lote?.precio_venta_estimado
    ? Number(lote.precio_venta_estimado)
    : null;
  const pct = Number(autorizacion.comision_pct);
  const comisionEstimada = precio != null ? (precio * pct) / 100 : null;

  return (
    <Card className="flex flex-col overflow-hidden">
      <div className="relative aspect-[16/10] bg-muted">
        <FotoLote
          url={fotoUrl}
          alt={lote?.nombre_lote ?? "Lote"}
          className="h-full w-full object-cover"
          fallbackClassName="h-full w-full"
        />
        <Badge className={`absolute left-2 top-2 ${badge.className}`}>
          {badge.label}
        </Badge>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div>
          <h3 className="truncate font-display font-semibold text-foreground">
            {lote?.nombre_lote ?? "—"}
          </h3>
          <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-muted-foreground">
            <MapPin className="h-3 w-3 shrink-0" />
            {[lote?.ciudad, lote?.barrio].filter(Boolean).join(" · ") || "—"}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <p className="text-muted-foreground">Propietario</p>
            <p className="truncate font-medium">
              {autorizacion.propietario?.nombre ?? "—"}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Tu comisión</p>
            <p className="font-semibold text-primary">{pct}%</p>
          </div>
        </div>

        <div className="rounded-md border border-border bg-muted/30 p-2.5">
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
            Comisión estimada
          </p>
          <p className="font-display text-lg font-bold text-green-700 dark:text-green-400">
            {comisionEstimada != null ? formatCOPCompact(comisionEstimada) : "—"}
          </p>
          {precio != null && (
            <p className="text-[10px] text-muted-foreground">
              sobre {formatCOPCompact(precio)}
            </p>
          )}
        </div>

        <div className="mt-auto flex gap-2 pt-2">
          <Button asChild size="sm" variant="outline" className="flex-1">
            <Link to={`/lotes/${autorizacion.lote_id}/ficha`}>
              <Eye className="mr-1 h-3 w-3" /> Ficha
            </Link>
          </Button>
          {lote?.publicado_venta && lote?.estado_publicacion === "aprobado" && (
            <Button asChild size="sm" variant="outline" className="flex-1">
              <Link to={`/lotes/${autorizacion.lote_id}`}>
                <ExternalLink className="mr-1 h-3 w-3" /> Mercado
              </Link>
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
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

    const inicioMes = new Date();
    inicioMes.setDate(1);
    inicioMes.setHours(0, 0, 0, 0);
    const pagadoEsteMes = arr
      .filter(
        (c) =>
          c.estado === "pagada" &&
          c.fecha_pago &&
          new Date(c.fecha_pago) >= inicioMes
      )
      .reduce((acc, c) => acc + Number(c.comision_monto ?? 0), 0);

    return { total, pendiente, pagado, pagadoEsteMes };
  }, [comisiones]);

  const lotesRepresentadosCount = (autorizaciones as any[]).length;
  const comisionesPendientesCount = (comisiones as any[]).filter(
    (c) => c.estado === "pendiente"
  ).length;
  const nombre =
    user?.user_metadata?.full_name ??
    user?.email?.split("@")[0] ??
    "Comisionista";

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
        {/* Header personalizado con stat textual */}
        <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h1 className="font-display text-2xl font-semibold text-foreground">
              Hola, {nombre}.
            </h1>
            <p className="mt-1 font-body text-sm text-muted-foreground">
              Representas{" "}
              <span className="font-medium text-foreground">
                {lotesRepresentadosCount}{" "}
                {lotesRepresentadosCount === 1 ? "lote" : "lotes"}
              </span>
              {comisionesPendientesCount > 0 && (
                <>
                  {" "}con{" "}
                  <span className="font-medium text-amber-700 dark:text-amber-400">
                    {comisionesPendientesCount}{" "}
                    {comisionesPendientesCount === 1
                      ? "comisión pendiente"
                      : "comisiones pendientes"}
                  </span>{" "}
                  de cobro
                </>
              )}
              .
            </p>
          </div>

          <Button onClick={() => setOpenDialog(true)}>
            <Plus className="mr-2 h-4 w-4" /> Cargar lote
          </Button>
        </header>

        {/* 4 KPIs cromáticos */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <KPIEstado
            label="Lotes representados"
            value={lotesRepresentadosCount}
            icon={Briefcase}
            colorClass="text-primary"
          />
          <KPIEstado
            label="Pendiente cobro"
            value={formatCOPCompact(kpis.pendiente)}
            icon={Clock}
            colorClass="text-amber-700 dark:text-amber-400"
            destacado={comisionesPendientesCount > 0}
          />
          <KPIEstado
            label="Pagado este mes"
            value={formatCOPCompact(kpis.pagadoEsteMes)}
            icon={CheckCircle2}
            colorClass="text-green-700 dark:text-green-400"
          />
          <KPIEstado
            label="Total histórico"
            value={formatCOPCompact(kpis.total)}
            icon={TrendingUp}
            colorClass="text-foreground"
          />
        </div>

        <Tabs defaultValue="lotes">
          <TabsList>
            <TabsTrigger value="lotes" className="gap-2">
              Lotes que represento
              {lotesRepresentadosCount > 0 && (
                <Badge className="h-5 min-w-5 justify-center bg-primary/15 px-1.5 text-[10px] text-primary hover:bg-primary/15">
                  {lotesRepresentadosCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="comisiones" className="gap-2">
              Mis comisiones
              {comisionesPendientesCount > 0 && (
                <Badge className="h-5 min-w-5 justify-center bg-amber-500/20 px-1.5 text-[10px] text-amber-700 hover:bg-amber-500/20 dark:text-amber-300">
                  {comisionesPendientesCount}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: lotes */}
          <TabsContent value="lotes" className="mt-4 space-y-4">
            {loadingAut ? (
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-72" />
                ))}
              </div>
            ) : lotesRepresentadosCount === 0 ? (
              <EmptyState
                icon={Briefcase}
                titulo="Aún no representas ningún lote"
                descripcion="Carga el primer lote de un propietario para comenzar a recibir comisiones por su venta."
                ctaLabel="Cargar primer lote"
                onCtaClick={() => setOpenDialog(true)}
                ctaVariant="hero"
              />
            ) : (
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                {(autorizaciones as any[]).map((a) => (
                  <CardLoteRepresentado key={a.id} autorizacion={a} />
                ))}
              </div>
            )}
          </TabsContent>

          {/* TAB 2: comisiones tabla densa */}
          <TabsContent value="comisiones" className="mt-4 space-y-4">
            {loadingCom ? (
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : (comisiones as any[]).length === 0 ? (
              <EmptyState
                icon={Wallet}
                titulo="Aún no tienes comisiones registradas"
                descripcion="Cuando uno de tus lotes representados se venda, las comisiones aparecerán aquí."
              />
            ) : (
              <Card className="overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
                      <tr>
                        <th className="px-3 py-2 text-left font-medium">Lote</th>
                        <th className="px-3 py-2 text-left font-medium">
                          Propietario
                        </th>
                        <th className="px-3 py-2 text-right font-medium">%</th>
                        <th className="px-3 py-2 text-right font-medium">Monto</th>
                        <th className="px-3 py-2 text-left font-medium">Estado</th>
                        <th className="px-3 py-2 text-left font-medium">Fecha</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(comisiones as any[]).map((c) => {
                        const badge = estadoComBadge(c.estado);
                        const esPendiente = c.estado === "pendiente";
                        return (
                          <tr
                            key={c.id}
                            className={`border-t border-border ${
                              esPendiente ? "bg-amber-500/5" : ""
                            }`}
                          >
                            <td className="max-w-[200px] truncate px-3 py-2.5">
                              <span className="inline-flex items-center gap-1.5 font-medium text-foreground">
                                <FileText className="h-3 w-3 text-muted-foreground" />
                                {c.lote?.nombre_lote ?? "—"}
                              </span>
                            </td>
                            <td className="max-w-[160px] truncate px-3 py-2.5 text-muted-foreground">
                              {c.propietario?.nombre ?? "—"}
                            </td>
                            <td className="px-3 py-2.5 text-right tabular-nums">
                              {Number(c.comision_pct ?? 0)}%
                            </td>
                            <td className="px-3 py-2.5 text-right font-semibold tabular-nums text-green-700 dark:text-green-400">
                              {formatCOP(Number(c.comision_monto ?? 0))}
                            </td>
                            <td className="px-3 py-2.5">
                              <Badge className={badge.className}>
                                {badge.label}
                              </Badge>
                            </td>
                            <td className="px-3 py-2.5 text-xs text-muted-foreground">
                              {formatFecha(c.fecha_pago ?? c.fecha_generacion ?? c.created_at)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <CargarLoteComisionistaDialog
        open={openDialog}
        onOpenChange={setOpenDialog}
      />
    </div>
  );
}
