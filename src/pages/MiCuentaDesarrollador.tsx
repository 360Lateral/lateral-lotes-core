import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  Lock, ShieldCheck, ExternalLink, Key, FileSignature, Receipt,
  CalendarClock, Wallet, Sparkles, Coins, Search, MapPin, FileText,
} from "lucide-react";
import { useMiSuscripcion, type Suscripcion } from "@/hooks/useMiSuscripcion";
import {
  useMisAccesosConDatos,
  type AccesoConDatos,
} from "@/hooks/desarrollador/useMisAccesosConDatos";
import {
  useResumenCuentaDesarrollador,
  type ResumenCuentaDesarrollador,
} from "@/hooks/desarrollador/useResumenCuentaDesarrollador";
import { useLotesRecomendados } from "@/hooks/desarrollador/useLotesRecomendados";
import {
  useHistorialDesarrollador,
} from "@/hooks/desarrollador/useHistorialDesarrollador";
import { useAuth } from "@/contexts/AuthContext";
import { MetricaOverview } from "@/components/ui/MetricaOverview";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatCOP, formatCOPCompact, formatFecha } from "@/lib/format";
import { cn } from "@/lib/utils";
import { formatMetros } from "@/lib/format-moneda";

// ---------- Subcomponents ----------

const TarjetaLoteDesbloqueado = ({ acceso }: { acceso: AccesoConDatos }) => {
  const diasRestantes = acceso.fecha_expiracion
    ? Math.ceil(
        (new Date(acceso.fecha_expiracion).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
      )
    : null;
  const expiraPronto = diasRestantes != null && diasRestantes <= 7;
  const expirado = diasRestantes != null && diasRestantes <= 0;

  const titulo =
    acceso.nombre_lote ??
    [acceso.ciudad, acceso.barrio].filter(Boolean).join(" · ") ??
    "Lote";

  return (
    <Card className="hover:border-primary/40 transition-colors h-full">
      <CardContent className="p-4 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <Link
              to={`/lotes/${acceso.lote_id}`}
              className="font-semibold text-foreground hover:text-primary truncate block"
            >
              {titulo}
            </Link>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5 truncate">
              <MapPin className="h-3 w-3 shrink-0" />
              {[acceso.ciudad, acceso.barrio].filter(Boolean).join(" · ") || "—"}
            </p>
          </div>
          {diasRestantes != null && (
            <Badge
              variant={expirado ? "destructive" : expiraPronto ? "outline" : "secondary"}
              className={cn(
                "shrink-0 text-[10px]",
                expiraPronto && !expirado && "border-amber-500 text-amber-700 bg-amber-50",
              )}
            >
              {expirado ? "Expirado" : `${diasRestantes}d restantes`}
            </Badge>
          )}
        </div>
        <div className="text-xs text-muted-foreground">
          {acceso.area_total_m2
            ? `${formatMetros(acceso.area_total_m2)}`
            : "—"}
          {acceso.estrato != null && ` · Estrato ${acceso.estrato}`}
          {acceso.tipo_lote && ` · ${acceso.tipo_lote}`}
        </div>
        <div className="flex items-center gap-2 pt-1">
          <Button asChild size="sm" variant="default" className="h-7 text-xs">
            <Link to={`/lotes/${acceso.lote_id}`}>
              <Key className="h-3 w-3 mr-1" /> Ver lote
            </Link>
          </Button>
          <Button asChild size="sm" variant="outline" className="h-7 text-xs">
            <Link to={`/lotes/${acceso.lote_id}/ficha`}>
              <ExternalLink className="h-3 w-3 mr-1" /> Ficha técnica
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

const CardSuscripcionDestacada = ({
  suscripcion,
  resumen,
}: {
  suscripcion: Suscripcion | null;
  resumen: ResumenCuentaDesarrollador | undefined;
}) => {
  if (!suscripcion) {
    return (
      <Card className="bg-gradient-to-br from-[#1a2744] to-[#0f1d36] text-white border-0">
        <CardContent className="p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            <p className="font-medium">Sin suscripción</p>
          </div>
          <p className="text-sm text-white/70">
            Suscríbete para acceder a información detallada de los lotes.
          </p>
          <Button asChild variant="secondary" className="w-full">
            <Link to="/suscripcion">Ver planes</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const diasRestantes = resumen?.dias_restantes ?? 0;
  const expirada = diasRestantes <= 0;
  const expiraPronto = diasRestantes > 0 && diasRestantes <= 7;
  const esPremium = suscripcion.nivel === "premium";

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base">Tu suscripción</CardTitle>
          <Badge
            variant={expirada ? "destructive" : expiraPronto ? "outline" : "default"}
            className={cn(
              "capitalize",
              expiraPronto && !expirada && "border-amber-500 text-amber-700 bg-amber-50",
            )}
          >
            Plan {suscripcion.nivel}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div
          className={cn(
            "text-center p-4 rounded-md border",
            expirada
              ? "bg-red-50 border-red-200"
              : expiraPronto
              ? "bg-amber-50 border-amber-200"
              : "bg-emerald-50 border-emerald-200",
          )}
        >
          <p
            className={cn(
              "font-display text-3xl font-bold",
              expirada ? "text-red-700" : expiraPronto ? "text-amber-700" : "text-emerald-700",
            )}
          >
            {expirada ? "Vencida" : `${diasRestantes} días`}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {expirada ? "Venció el" : "Vence el"} {formatFecha(suscripcion.fecha_fin)}
          </p>
        </div>
        <div className="flex flex-col gap-1.5">
          <Button asChild className="w-full" size="sm">
            <Link to="/suscripcion">
              {expirada ? "Reactivar" : "Renovar"} suscripción
            </Link>
          </Button>
          {!esPremium && (
            <Button asChild variant="outline" className="w-full" size="sm">
              <Link to="/suscripcion">
                <Sparkles className="h-3 w-3 mr-1" />
                Mejorar a plan superior
              </Link>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};



// ---------- Page ----------

const MiCuentaDesarrollador = () => {
  const { user, isDesarrollador } = useAuth();
  const { data: suscripcion, isLoading: loadingSub } = useMiSuscripcion();
  const { data: accesos, isLoading: loadingAcc } = useMisAccesosConDatos();
  const { data: resumen } = useResumenCuentaDesarrollador();
  const { data: recomendados } = useLotesRecomendados(6);
  const { data: historial } = useHistorialDesarrollador(8);

  const nombre =
    (user?.user_metadata as any)?.full_name ??
    user?.email?.split("@")[0] ??
    "Desarrollador";

  const accesosActivos = (accesos ?? []).filter(
    (a) =>
      a.estado === "activa" &&
      a.fecha_expiracion &&
      new Date(a.fecha_expiracion) > new Date(),
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        {/* Header personalizado */}
        <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-semibold text-foreground">
              Hola, {nombre}.
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Tienes acceso a {resumen?.accesos_activos ?? 0} lotes activos
              {suscripcion && (
                <>
                  {" "}con suscripción{" "}
                  <span className="capitalize font-medium text-foreground">
                    Plan {suscripcion.nivel}
                  </span>
                </>
              )}
              .
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" size="sm">
              <Link to="/suscripcion">
                <Sparkles className="h-4 w-4 mr-1.5" /> Mi suscripción
              </Link>
            </Button>
            <Button asChild size="sm">
              <Link to="/mercado">
                <Search className="h-4 w-4 mr-1.5" /> Explorar mercado
              </Link>
            </Button>
          </div>
        </header>

        {!isDesarrollador && (
          <Card className="p-4 bg-muted/30 border-dashed text-sm text-muted-foreground">
            Esta sección está pensada para usuarios desarrolladores. Algunas acciones de pago
            no estarán disponibles para tu perfil.
          </Card>
        )}

        {/* 4 métricas overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <MetricaOverview
            label="Lotes activos"
            value={resumen?.accesos_activos ?? 0}
            icon={Key}
            sublabel="Accesos vigentes"
          />
          <MetricaOverview
            label="NDAs firmados"
            value={resumen?.ndas_firmados ?? 0}
            icon={FileSignature}
          />
          <MetricaOverview
            label="Días suscripción"
            value={resumen?.dias_restantes ?? 0}
            icon={CalendarClock}
            sublabel={
              resumen?.fecha_renovacion
                ? `Hasta ${formatFecha(resumen.fecha_renovacion)}`
                : "Sin plan activo"
            }
          />
          <MetricaOverview
            label="Gasto mes"
            value={formatCOPCompact(resumen?.gasto_mes_actual ?? 0)}
            icon={Wallet}
            delta={resumen?.delta_gasto ?? undefined}
            deltaLabel={
              resumen?.delta_gasto != null
                ? `${resumen.delta_gasto > 0 ? "+" : ""}${resumen.delta_gasto}% vs anterior`
                : undefined
            }
          />
        </div>

        {/* Layout 2 columnas */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Col principal */}
          <div className="lg:col-span-2 space-y-6">
            {/* Mis lotes desbloqueados */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-lg">Mis lotes desbloqueados</CardTitle>
                <Badge variant="secondary">{accesosActivos.length} activos</Badge>
              </CardHeader>
              <CardContent>
                {loadingAcc ? (
                  <Skeleton className="h-32 w-full" />
                ) : accesosActivos.length === 0 ? (
                  <EmptyState
                    icon={Lock}
                    title="Aún no has desbloqueado lotes"
                    description='Desde la ficha de un lote puedes usar la opción "Desbloquear solo este lote" para acceder por un periodo limitado.'
                    action={
                      <Button asChild size="sm">
                        <Link to="/mercado">Explorar mercado</Link>
                      </Button>
                    }
                  />
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {accesosActivos.map((a) => (
                      <TarjetaLoteDesbloqueado key={a.id} acceso={a} />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recomendados */}
            {recomendados && recomendados.length > 0 && (
              <Card>
                <CardHeader className="flex flex-row items-start justify-between space-y-0">
                  <div>
                    <CardTitle className="text-lg">Recomendados para ti</CardTitle>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Basado en tus intereses recientes
                    </p>
                  </div>
                  <Button asChild variant="ghost" size="sm">
                    <Link to="/mercado">Ver más →</Link>
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {recomendados.slice(0, 6).map((l) => (
                      <Link
                        key={l.lote_id}
                        to={`/lotes/${l.lote_id}`}
                        className="block group"
                      >
                        <Card className="hover:border-primary/40 transition-colors h-full">
                          <CardContent className="p-3 space-y-1">
                            <p className="text-sm font-medium text-foreground truncate">
                              {l.nombre_lote ?? l.ciudad ?? "Lote"}
                            </p>
                            <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                              <MapPin className="h-3 w-3 shrink-0" />
                              {[l.ciudad, l.barrio].filter(Boolean).join(" · ") || "—"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {l.area_total_m2
                                ? `${formatMetros(l.area_total_m2)}`
                                : "—"}
                              {l.estrato != null && ` · Estrato ${l.estrato}`}
                            </p>
                          </CardContent>
                        </Card>
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar sticky */}
          <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
            {loadingSub ? (
              <Skeleton className="h-44 w-full" />
            ) : (
              <CardSuscripcionDestacada
                suscripcion={(suscripcion ?? null) as Suscripcion | null}
                resumen={resumen}
              />
            )}

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Historial de transacciones</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                {historial && historial.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs h-8 px-2">Fecha</TableHead>
                        <TableHead className="text-xs h-8 px-2">Concepto</TableHead>
                        <TableHead className="text-xs h-8 px-2 text-right">Monto</TableHead>
                        <TableHead className="text-xs h-8 px-2 w-[70px]">Estado</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {historial.map((t) => {
                        const Icon =
                          t.tipo_pago === "acceso_lote"
                            ? Key
                            : t.tipo_pago === "suscripcion"
                            ? Receipt
                            : FileSignature;
                        return (
                          <TableRow key={t.id}>
                            <TableCell className="text-xs px-2 py-2 whitespace-nowrap text-muted-foreground">
                              {formatFecha(t.fecha_aprobacion ?? t.fecha_creacion)}
                            </TableCell>
                            <TableCell className="text-xs px-2 py-2">
                              <span className="inline-flex items-center gap-1.5 font-medium">
                                <Icon className="h-3 w-3 text-muted-foreground" />
                                {t.descripcion}
                              </span>
                            </TableCell>
                            <TableCell className="text-xs px-2 py-2 text-right font-medium tabular-nums">
                              {formatCOPCompact(t.monto_cop)}
                            </TableCell>
                            <TableCell className="px-2 py-2">
                              <Badge
                                variant={t.estado === "aprobada" ? "default" : "secondary"}
                                className="text-[10px] capitalize"
                              >
                                {t.estado}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-sm text-muted-foreground flex items-center gap-2 py-2">
                    <Coins className="h-4 w-4" /> Aún no tienes transacciones. Cuando compres una suscripción o un lote, aparecerá aquí.
                  </p>
                )}
              </CardContent>
            </Card>
          </aside>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default MiCuentaDesarrollador;
