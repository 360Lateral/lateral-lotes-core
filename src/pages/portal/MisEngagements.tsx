import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import PortalClienteLayout from "@/components/portal/PortalClienteLayout";
import PortalProtectedRoute from "@/components/portal/PortalProtectedRoute";
import {
  useMisEngagementsCliente,
  EngagementClienteResumen,
} from "@/hooks/cliente/useMisEngagementsCliente";
import { useMisActivos } from "@/hooks/useMisActivos";
import { nombreLoteMostrable, computeSlaConfig } from "@/lib/portal-display";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useGenerarPagoWompi } from "@/hooks/useGenerarPagoWompi";
import { useResumenPortafolio } from "@/hooks/cliente/useResumenPortafolio";
import {
  useActividadReciente,
  type EventoActividad,
} from "@/hooks/cliente/useActividadReciente";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import MisActivosTab from "@/components/portal/MisActivosTab";

import PublicarActivoDialog from "@/components/portal/PublicarActivoDialog";
import {
  Folder,
  MapPin,
  Calendar,
  CheckCircle2,
  Clock,
  Sparkles,
  Plus,
  CreditCard,
  AlertCircle,
  Loader2,
  Eye,
  Briefcase,
  Building2,
  TrendingUp,
  TrendingDown,
  FileSignature,
  Activity,
  ArrowRight,
  type LucideIcon,
} from "lucide-react";

const planVariant = (codigo?: string | null): {
  variant: "default" | "secondary" | "outline" | "destructive";
  className?: string;
} => {
  const c = (codigo || "").toLowerCase();
  if (c.includes("premium")) return { variant: "default", className: "bg-amber-500 hover:bg-amber-600 text-white" };
  if (c.includes("pro")) return { variant: "default" };
  if (c.includes("basico") || c.includes("básico")) return { variant: "secondary" };
  return { variant: "outline" };
};

const formatoFecha = (fecha: string | null) => {
  if (!fecha) return "—";
  return new Date(fecha).toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatoRelativo = (fechaISO: string): string => {
  const dias = Math.floor(
    (Date.now() - new Date(fechaISO).getTime()) / (1000 * 60 * 60 * 24)
  );
  if (dias <= 0) return "Hoy";
  if (dias === 1) return "Ayer";
  if (dias < 7) return `Hace ${dias} días`;
  if (dias < 30) return `Hace ${Math.floor(dias / 7)} sem`;
  return `Hace ${Math.floor(dias / 30)} m`;
};

const SlaChip = ({ e }: { e: EngagementClienteResumen }) => {
  const esEntregado = e.estado === "entregado" || e.estado === "cerrado";
  const cfg = computeSlaConfig({
    dias: e.dias_para_sla,
    esEntregado,
    fechaEntrega: e.fecha_sla,
  });
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium",
        cfg.bgClass,
        cfg.textClass,
      )}
    >
      <Clock className="h-3 w-3" />
      {cfg.text}
    </span>
  );
};

const ChipMaestro = ({ label, ready }: { label: string; ready: boolean }) => {
  if (ready) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
        <CheckCircle2 className="h-3.5 w-3.5" />
        {label}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
      <Clock className="h-3.5 w-3.5" />
      {label} · Pendiente
    </span>
  );
};

const EngagementCard = ({ e, onClick }: { e: EngagementClienteResumen; onClick: () => void }) => {
  const plan = planVariant(e.plan_codigo);
  const ambosListos = e.tiene_diagnostico && e.tiene_presentacion;
  const generarPago = useGenerarPagoWompi();
  const isPendientePago = e.estado_activacion === "pendiente_pago";
  const isBorrador = e.estado_activacion === "borrador";
  const isActivo = e.estado_activacion === "activo";

  const handleReintentarPago = async (ev: React.MouseEvent) => {
    ev.stopPropagation();
    try {
      const data = await generarPago.mutateAsync(e.engagement_id);
      if (data.payment_url) window.location.href = data.payment_url;
    } catch {
      /* toast handled */
    }
  };

  const cardInner = (
    <Card className="overflow-hidden h-full">
      {ambosListos && isActivo && (
        <div className="flex items-center gap-2 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300">
          <Sparkles className="h-4 w-4" />
          Tu Diagnóstico está listo · Haz clic para abrirlo
        </div>
      )}
      {isPendientePago && (
        <div className="flex items-start gap-2 bg-blue-50 px-4 py-2.5 text-sm text-blue-800 dark:bg-blue-950/30 dark:text-blue-300">
          <Clock className="h-4 w-4 mt-0.5 shrink-0" />
          <span className="flex-1">Esperando confirmación de pago.</span>
          <Button
            size="sm"
            variant="default"
            onClick={handleReintentarPago}
            disabled={generarPago.isPending}
          >
            {generarPago.isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <CreditCard className="h-3.5 w-3.5 mr-1" />
            )}
            Continuar pago
          </Button>
        </div>
      )}
      {isBorrador && (
        <div className="flex items-start gap-2 bg-amber-50 px-4 py-2.5 text-sm text-amber-800 dark:bg-amber-950/30 dark:text-amber-300">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <span>
            Tu diagnóstico fue creado pero aún no inicia. Contacta a 360Lateral para activarlo.
          </span>
        </div>
      )}
      <CardContent className="p-6 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
              <h3 className="text-lg font-semibold truncate">
                {nombreLoteMostrable(e.lote_nombre, e.lote_direccion, e.lote_ciudad)}
              </h3>
            <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">
                {[e.lote_direccion, e.lote_ciudad].filter(Boolean).join(", ") || "Ubicación no disponible"}
              </span>
            </p>
          </div>
          {e.plan_nombre && (
            <Badge variant={plan.variant} className={plan.className}>
              {e.plan_nombre}
            </Badge>
          )}
        </div>

        {isActivo && (
          <>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Avance</span>
                <span className="font-medium">{Math.round(e.avance_pct ?? 0)}%</span>
              </div>
              <Progress value={e.avance_pct ?? 0} />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="capitalize">{e.estado.replace(/_/g, " ")}</Badge>
              <SlaChip e={e} />
            </div>

            <div className="pt-3 border-t border-border flex flex-wrap items-center gap-2">
              <ChipMaestro label="Diagnóstico" ready={e.tiene_diagnostico} />
              <ChipMaestro label="Presentación" ready={e.tiene_presentacion} />
            </div>

            {e.plan_codigo && e.plan_codigo.toLowerCase() !== "premium" && (
              <div className="border-t pt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  asChild
                  className="text-xs h-7 gap-1 px-2"
                  onClick={(ev) => ev.stopPropagation()}
                >
                  <Link to="/planes">
                    <Sparkles className="h-3 w-3" />
                    Mejorar plan para más análisis
                  </Link>
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );

  if (!isActivo) return <div className="rounded-lg h-full">{cardInner}</div>;

  return (
    <button
      type="button"
      onClick={onClick}
      className="text-left transition-shadow hover:shadow-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-lg h-full"
    >
      {cardInner}
    </button>
  );
};

const ServiciosList = ({ onComprar }: { onComprar: () => void }) => {
  const navigate = useNavigate();
  const { data, isLoading } = useMisEngagementsCliente();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Diagnósticos contratados y solicitudes en curso.
        </p>
        <Button onClick={onComprar} size="sm" variant="outline">
          <Plus className="mr-1 h-4 w-4" /> Comprar diagnóstico
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {[...Array(2)].map((_, i) => (
            <Skeleton key={i} className="h-56 w-full" />
          ))}
        </div>
      ) : !data || data.length === 0 ? (
        <Card>
          <CardContent className="py-16 flex flex-col items-center text-center gap-4">
            <Folder className="h-16 w-16 text-muted-foreground/40" />
            <div className="space-y-1 max-w-md">
              <h3 className="text-lg font-semibold">Aún no tienes diagnósticos contratados.</h3>
              <p className="text-sm text-muted-foreground">
                Compra uno desde "Planes" para empezar a analizar tu lote.
              </p>
            </div>
            <Button onClick={onComprar}>
              <Plus className="mr-1 h-4 w-4" /> Comprar mi primer diagnóstico
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {data.map((e) => (
            <EngagementCard
              key={e.engagement_id}
              e={e}
              onClick={() => navigate(`/portal/engagement/${e.engagement_id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// ---------- Overview ----------

const MetricaOverview = ({
  label,
  value,
  icon: Icon,
  delta,
  deltaLabel,
  sublabel,
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  delta?: number;
  deltaLabel?: string;
  sublabel?: string;
}) => (
  <Card>
    <CardContent className="p-4 flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="text-xs uppercase tracking-wide text-muted-foreground font-medium truncate">
          {label}
        </p>
        <p className="text-2xl font-semibold mt-1">{value}</p>
        {deltaLabel && (
          <p
            className={`text-xs mt-1 flex items-center gap-1 ${
              delta && delta > 0
                ? "text-emerald-600"
                : delta && delta < 0
                ? "text-destructive"
                : "text-muted-foreground"
            }`}
          >
            {delta !== undefined && delta > 0 && <TrendingUp className="h-3 w-3" />}
            {delta !== undefined && delta < 0 && <TrendingDown className="h-3 w-3" />}
            {deltaLabel}
          </p>
        )}
        {sublabel && !deltaLabel && (
          <p className="text-xs mt-1 text-muted-foreground">{sublabel}</p>
        )}
      </div>
      <div className="h-9 w-9 shrink-0 rounded-md bg-primary/10 text-primary flex items-center justify-center">
        <Icon className="h-4 w-4" />
      </div>
    </CardContent>
  </Card>
);

// ---------- Actividad ----------

const iconoPorTipo = (tipo: EventoActividad["tipo"]): LucideIcon => {
  switch (tipo) {
    case "diagnostico_entregado":
      return CheckCircle2;
    case "nda_firmado":
      return FileSignature;
    case "vista_nueva":
      return Eye;
    default:
      return Activity;
  }
};

const colorPorTipo = (tipo: EventoActividad["tipo"]): string => {
  switch (tipo) {
    case "diagnostico_entregado":
      return "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300";
    case "nda_firmado":
      return "bg-primary/10 text-primary";
    case "vista_nueva":
      return "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300";
    default:
      return "bg-muted text-muted-foreground";
  }
};

const ActividadRecientePanel = () => {
  const { data: actividad, isLoading } = useActividadReciente();

  return (
    <Card>
      <CardContent className="p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">Actividad reciente</h3>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : !actividad || actividad.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Sin actividad reciente. Cuando alguien interactúe con tu portafolio, aparecerá aquí.
          </p>
        ) : (
          <ul className="space-y-3">
            {actividad.slice(0, 5).map((ev) => {
              const Icon = iconoPorTipo(ev.tipo);
              return (
                <li key={ev.id} className="flex items-start gap-3">
                  <div
                    className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${colorPorTipo(ev.tipo)}`}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm leading-snug">{ev.titulo}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {formatoRelativo(ev.fecha)}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
};

interface SugerenciaProximoPaso {
  descripcion: string;
  cta: string;
  onClick: () => void;
}

const useProximoPasoSugerencia = ({
  onComprar,
  onPublicar,
}: {
  onComprar: () => void;
  onPublicar: () => void;
}): SugerenciaProximoPaso | null => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: engagements } = useMisEngagementsCliente();
  const { data: activos } = useMisActivos(user?.id);

  const ev = engagements ?? [];
  const ac = activos ?? [];

  const sinNada = ev.length === 0 && ac.length === 0;
  if (sinNada) {
    return {
      descripcion:
        "Compra tu primer diagnóstico para conocer el potencial real de un lote.",
      cta: "Ver planes",
      onClick: onComprar,
    };
  }

  // 1. Engagement entregado sin publicar
  const entregadoSinPublicar = ev.find(
    (e) =>
      e.estado === "entregado" &&
      !ac.some((a) => a.nombre_lote === e.lote_nombre && a.publicado_venta)
  );
  if (entregadoSinPublicar) {
    const nombre = nombreLoteMostrable(
      entregadoSinPublicar.lote_nombre,
      entregadoSinPublicar.lote_direccion,
      entregadoSinPublicar.lote_ciudad,
    );
    return {
      descripcion: `Tu diagnóstico de "${nombre}" está listo. Publícalo en el mercado para empezar a recibir interesados.`,
      cta: "Publicar al mercado",
      onClick: onPublicar,
    };
  }

  // 2. Engagement atrasado
  const atrasado = ev.find(
    (e) => e.dias_para_sla != null && e.dias_para_sla < 0 && e.estado !== "entregado",
  );
  if (atrasado) {
    const nombre = nombreLoteMostrable(
      atrasado.lote_nombre,
      atrasado.lote_direccion,
      atrasado.lote_ciudad,
    );
    return {
      descripcion: `Tu análisis de "${nombre}" lleva más tiempo del estimado. Contacta a tu asesor desde el detalle del engagement.`,
      cta: "Ver engagement",
      onClick: () => navigate(`/portal/engagement/${atrasado.engagement_id}`),
    };
  }

  // 3. Engagement en borrador (pago pendiente)
  const borrador = ev.find(
    (e) => e.estado_activacion === "borrador" || e.estado_activacion === "pendiente_pago",
  );
  if (borrador) {
    const nombre = nombreLoteMostrable(
      borrador.lote_nombre,
      borrador.lote_direccion,
      borrador.lote_ciudad,
    );
    return {
      descripcion: `Tu lote "${nombre}" espera el pago para que iniciemos el análisis.`,
      cta: "Completar pago",
      onClick: () => navigate(`/portal/engagement/${borrador.engagement_id}`),
    };
  }

  // 4. Activo en revisión por equipo
  const pendienteAprobacion = ac.find(
    (a) => a.estado_publicacion === "pendiente_validacion"
  );
  if (pendienteAprobacion) {
    return {
      descripcion: `"${pendienteAprobacion.nombre_lote ?? "Tu activo"}" está siendo revisado por 360Lateral. Te avisaremos cuando esté publicado.`,
      cta: "Ver mis activos",
      onClick: () => navigate("/portal?tab=activos"),
    };
  }

  // 5. Tiene activos pero ningún engagement
  if (ac.length > 0 && ev.length === 0) {
    return {
      descripcion:
        "Contrata un diagnóstico técnico para que tus activos publicados conviertan más rápido.",
      cta: "Ver planes",
      onClick: onComprar,
    };
  }

  return null;
};

const ProximoPasoCard = ({
  onComprar,
  onPublicar,
}: {
  onComprar: () => void;
  onPublicar: () => void;
}) => {
  const sugerencia = useProximoPasoSugerencia({ onComprar, onPublicar });
  if (!sugerencia) return null;

  return (
    <Card className="bg-primary/5 border-primary/20">
      <CardContent className="p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold text-primary">Próximo paso sugerido</h3>
        </div>
        <p className="text-sm text-foreground/90 leading-relaxed">
          {sugerencia.descripcion}
        </p>
        <Button size="sm" onClick={sugerencia.onClick} className="w-full">
          {sugerencia.cta}
          <ArrowRight className="ml-1 h-3.5 w-3.5" />
        </Button>
      </CardContent>
    </Card>
  );
};

// ---------- Página ----------

const PortalHomeInner = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: engagements } = useMisEngagementsCliente();
  const { data: activos = [] } = useMisActivos(user?.id);
  const { data: resumen } = useResumenPortafolio();
  const [publicarOpen, setPublicarOpen] = useState(false);
  const generarPago = useGenerarPagoWompi();

  const irAComprar = () => navigate("/planes");

  const nombre =
    (user?.user_metadata?.full_name as string) ||
    (user?.user_metadata?.nombre as string) ||
    user?.email?.split("@")[0] ||
    "Cliente";

  const serviciosCount =
    resumen?.serviciosActivos ??
    (engagements ?? []).filter(
      (e) => e.estado !== "cancelado" && e.estado !== "cerrado"
    ).length;

  const activosPublicadosCount =
    resumen?.activosPublicados ??
    activos.filter((a) => a.estado_publicacion === "aprobado" && a.publicado_venta).length;

  const engagementsConPagoPendiente = useMemo(
    () => (engagements ?? []).filter((e) => e.estado_activacion === "pendiente_pago"),
    [engagements]
  );

  const handleReintentarPagoPrimero = async () => {
    const first = engagementsConPagoPendiente[0];
    if (!first) return;
    try {
      const data = await generarPago.mutateAsync(first.engagement_id);
      if (data.payment_url) window.location.href = data.payment_url;
    } catch {
      /* toast manejado */
    }
  };

  const initialTab =
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).get("tab") === "activos"
      ? "activos"
      : "servicios";

  const deltaSemanal = resumen?.deltaSemanal ?? 0;
  const deltaLabel =
    deltaSemanal === 0
      ? "Sin cambios vs semana anterior"
      : `${deltaSemanal > 0 ? "+" : ""}${deltaSemanal} vs semana anterior`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">
            Hola, {nombre}.
          </h1>
          <p className="text-sm text-muted-foreground">
            Tienes{" "}
            <span className="font-medium text-foreground">
              {serviciosCount} {serviciosCount === 1 ? "diagnóstico" : "diagnósticos"} en curso
            </span>{" "}
            y{" "}
            <span className="font-medium text-foreground">
              {activosPublicadosCount} {activosPublicadosCount === 1 ? "activo publicado" : "activos publicados"}
            </span>{" "}
            en el mercado.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => setPublicarOpen(true)}>
            <Plus className="mr-1 h-4 w-4" />
            Publicar activo
          </Button>
          <Button size="sm" onClick={irAComprar}>
            <Plus className="mr-1 h-4 w-4" />
            Comprar diagnóstico
          </Button>
        </div>
      </header>

      {/* Alert global pagos pendientes */}
      {engagementsConPagoPendiente.length > 0 && (
        <Alert className="border-blue-300 bg-blue-50 dark:bg-blue-950/30">
          <AlertCircle className="h-4 w-4 text-blue-700 dark:text-blue-300" />
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <AlertTitle className="text-blue-900 dark:text-blue-100">
                Pago pendiente
              </AlertTitle>
              <AlertDescription className="text-blue-800 dark:text-blue-200">
                {engagementsConPagoPendiente.length === 1
                  ? `El diagnóstico de "${engagementsConPagoPendiente[0].lote_nombre ?? "tu lote"}" está esperando confirmación de pago.`
                  : `Tienes ${engagementsConPagoPendiente.length} diagnósticos esperando confirmación de pago.`}
              </AlertDescription>
            </div>
            <Button
              size="sm"
              variant="default"
              onClick={handleReintentarPagoPrimero}
              disabled={generarPago.isPending}
              className="shrink-0"
            >
              {generarPago.isPending && (
                <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
              )}
              Continuar pago
            </Button>
          </div>
        </Alert>
      )}

      {/* Overview 2x2 / 4 cols */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricaOverview
          label="Servicios activos"
          value={serviciosCount}
          icon={Briefcase}
          sublabel={
            resumen?.proximaEntregaDias != null && resumen.proximaEntregaNombre
              ? `Próxima entrega en ${resumen.proximaEntregaDias} d`
              : "Sin entregas próximas"
          }
        />
        <MetricaOverview
          label="Activos publicados"
          value={activosPublicadosCount}
          icon={Building2}
          sublabel={activosPublicadosCount > 0 ? "En el mercado" : "Sin activos públicos"}
        />
        <MetricaOverview
          label="Vistas totales"
          value={resumen?.vistasTotales ?? 0}
          icon={Eye}
          delta={deltaSemanal}
          deltaLabel={resumen ? deltaLabel : undefined}
        />
        <MetricaOverview
          label="Vistas (7 días)"
          value={resumen?.vistasUltimaSemana ?? 0}
          icon={TrendingUp}
          sublabel="Última semana"
        />
      </div>

      {/* 2 columnas: tabs + sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
        <div className="min-w-0">
          <Tabs defaultValue={initialTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 max-w-xl">
              <TabsTrigger value="servicios" className="gap-2">
                <span className="truncate">Servicios contratados</span>
                {serviciosCount > 0 && (
                  <Badge variant="secondary" className="h-5 px-1.5">
                    {serviciosCount}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="activos" className="gap-2">
                <span className="truncate">Activos en venta</span>
                {activosPublicadosCount > 0 && (
                  <Badge variant="secondary" className="h-5 px-1.5">
                    {activosPublicadosCount}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="servicios" className="mt-6">
              <ServiciosList onComprar={irAComprar} />
            </TabsContent>
            <TabsContent value="activos" className="mt-6">
              <MisActivosTab />
            </TabsContent>
          </Tabs>
        </div>

        <aside className="space-y-4">
          <ProximoPasoCard
            onComprar={irAComprar}
            onPublicar={() => setPublicarOpen(true)}
          />
          <ActividadRecientePanel />
        </aside>
      </div>

      <PublicarActivoDialog open={publicarOpen} onOpenChange={setPublicarOpen} />
    </div>
  );
};

const MisEngagements = () => (
  <PortalProtectedRoute>
    <PortalClienteLayout>
      <PortalHomeInner />
    </PortalClienteLayout>
  </PortalProtectedRoute>
);

export default MisEngagements;
