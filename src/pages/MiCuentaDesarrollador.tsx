import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
  Lock, ShieldCheck, ExternalLink, Key, FileSignature, Receipt,
  CalendarClock, Wallet, Sparkles, Coins, Search, MapPin,
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
  type ItemHistorialDev,
} from "@/hooks/desarrollador/useHistorialDesarrollador";
import { useAuth } from "@/contexts/AuthContext";
import { MetricaOverview } from "@/components/ui/MetricaOverview";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatCOPCompact, formatFecha, formatoRelativo } from "@/lib/format";

// ---------- Subcomponents ----------

const TarjetaLoteDesbloqueado = ({ acceso }: { acceso: AccesoConDatos }) => {
  const diasRestantes = acceso.fecha_expiracion
    ? Math.ceil(
        (new Date(acceso.fecha_expiracion).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
      )
    : null;
  const expiraPronto = diasRestantes != null && diasRestantes <= 7;

  const titulo =
    acceso.nombre_lote ??
    [acceso.ciudad, acceso.barrio].filter(Boolean).join(" · ") ??
    "Lote";

  return (
    <Link
      to={`/lotes/${acceso.lote_id}`}
      className="block group"
    >
      <Card className="hover:border-primary/40 transition-colors h-full">
        <CardContent className="p-4 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="font-semibold text-foreground truncate">{titulo}</p>
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5 truncate">
                <MapPin className="h-3 w-3 shrink-0" />
                {[acceso.ciudad, acceso.barrio].filter(Boolean).join(" · ") || "—"}
              </p>
            </div>
            {diasRestantes != null && (
              <Badge
                variant={expiraPronto ? "destructive" : "secondary"}
                className="shrink-0 text-[10px]"
              >
                {diasRestantes}d
              </Badge>
            )}
          </div>
          <div className="text-xs text-muted-foreground">
            {acceso.area_total_m2
              ? `${acceso.area_total_m2.toLocaleString("es-CO")} m²`
              : "—"}
            {acceso.estrato != null && ` · Estrato ${acceso.estrato}`}
            {acceso.tipo_lote && ` · ${acceso.tipo_lote}`}
          </div>
          <div className="flex items-center justify-between pt-1">
            <span className="text-xs text-primary inline-flex items-center gap-1">
              <Key className="h-3 w-3" /> Acceso activo
            </span>
            <ExternalLink className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary" />
          </div>
        </CardContent>
      </Card>
    </Link>
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

  const totalDias = Math.max(1, suscripcion.periodo_meses * 30);
  const diasRestantes = resumen?.dias_restantes ?? 0;
  const progresoUsado = Math.min(
    100,
    Math.max(0, ((totalDias - diasRestantes) / totalDias) * 100),
  );

  return (
    <Card className="bg-gradient-to-br from-[#1a2744] to-[#0f1d36] text-white border-0">
      <CardContent className="p-5 space-y-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-xs uppercase tracking-wide text-white/60">
              Suscripción actual
            </p>
            <p className="text-lg font-semibold capitalize mt-0.5">
              Plan {suscripcion.nivel} · {suscripcion.periodo_meses}{" "}
              {suscripcion.periodo_meses === 1 ? "mes" : "meses"}
            </p>
          </div>
          <Badge className="bg-emerald-500/20 text-emerald-200 border-emerald-400/30 hover:bg-emerald-500/20">
            Activa
          </Badge>
        </div>

        <p className="text-xs text-white/70">
          Vence {formatFecha(suscripcion.fecha_fin)} · {diasRestantes} días restantes
        </p>

        <Progress value={progresoUsado} className="h-2 bg-white/10" />

        <Button
          asChild
          variant="secondary"
          className="w-full bg-white text-[#1a2744] hover:bg-white/90"
        >
          <Link to="/suscripcion">Renovar suscripción</Link>
        </Button>
      </CardContent>
    </Card>
  );
};

const ItemHistorial = ({ item }: { item: ItemHistorialDev }) => {
  const cfg =
    item.tipo_pago === "acceso_lote"
      ? { Icon: Key, color: "text-emerald-700 bg-emerald-50" }
      : item.tipo_pago === "suscripcion"
      ? { Icon: Receipt, color: "text-secondary bg-secondary/10" }
      : { Icon: FileSignature, color: "text-emerald-700 bg-emerald-50" };

  return (
    <div className="flex items-start gap-3 py-2">
      <div
        className={`h-8 w-8 rounded-full shrink-0 flex items-center justify-center ${cfg.color}`}
      >
        <cfg.Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm text-foreground truncate">{item.descripcion}</p>
        <p className="text-xs text-muted-foreground">
          {formatoRelativo(item.fecha_aprobacion ?? item.fecha_creacion)} ·{" "}
          {formatCOPCompact(item.monto_cop)}
        </p>
      </div>
    </div>
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
                                ? `${l.area_total_m2.toLocaleString("es-CO")} m²`
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
                <CardTitle className="text-base">Historial reciente</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                {historial && historial.length > 0 ? (
                  <div className="divide-y divide-border">
                    {historial.map((h) => (
                      <ItemHistorial key={h.id} item={h} />
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground flex items-center gap-2 py-2">
                    <Coins className="h-4 w-4" /> Sin transacciones aún.
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
