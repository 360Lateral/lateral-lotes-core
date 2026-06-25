import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import PortalClienteLayout from "@/components/portal/PortalClienteLayout";
import PortalProtectedRoute from "@/components/portal/PortalProtectedRoute";
import TimelineProcesoEngagement, {
  type PasoTimeline,
} from "@/components/portal/TimelineProcesoEngagement";
import AnalisisPorAreaAcordeon, {
  type AreaAcordeon,
} from "@/components/portal/AnalisisPorAreaAcordeon";
import ContactarAsesorDialog from "@/components/portal/ContactarAsesorDialog";
import {
  useEngagementCliente,
  type EntregablePublicado,
  type TareaAvance,
} from "@/hooks/cliente/useEngagementCliente";
import { useActividadEngagement } from "@/hooks/cliente/useActividadEngagement";
import { useDescargarEntregable } from "@/hooks/cliente/useDescargarEntregable";
import { useAnalisisPorPlan } from "@/hooks/useAnalisisPorPlan";
import { useAnalisisUnificadoEngagement } from "@/hooks/useAnalisisUnificadoEngagement";
import { useGenerarPagoWompi } from "@/hooks/useGenerarPagoWompi";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import TipoEntregableIcon from "@/components/entregables/TipoEntregableIcon";
import type { TipoEntregable } from "@/hooks/useEntregablesEngagement";
import {
  nombreLoteMostrable,
  computeSlaConfig,
  calcularPasoStepper,
} from "@/lib/portal-display";
import { formatRelativeDate } from "@/lib/formatRelativeDate";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  Download,
  ExternalLink,
  FileText,
  Loader2,
  MapPin,
  Scale,
  Leaf,
  Building2,
  Coins,
  Mountain,
  TrendingUp,
  Layers,
  Droplets,
  StickyNote,
  Clock,
  Sparkles,
  PartyPopper,
  AlertTriangle,
  CreditCard,
  CheckCircle2,
  Mail,
  Calendar,
  CalendarCheck,
  Activity,
  MessageSquare,
  Target,
  DollarSign,
  type LucideIcon,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

const TIPOS_MAESTROS = new Set([
  "diagnostico_inmobiliario",
  "presentacion_diagnostico",
]);

const formatoFecha = (fecha?: string | null) => {
  if (!fecha) return "—";
  return new Date(fecha).toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatCOP = (n: number | null | undefined) => {
  if (n == null || !Number.isFinite(n)) return "—";
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(n);
};

const formatCOPCompact = (n: number | null | undefined) => {
  if (n == null || !Number.isFinite(n)) return "—";
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(0)}M`;
  return formatCOP(n);
};

const iniciales = (nombre?: string | null, email?: string | null) => {
  const s = nombre || email || "?";
  return s
    .split(/\s+/)
    .map((p) => p.charAt(0))
    .slice(0, 2)
    .join("")
    .toUpperCase();
};

const AREA_META: Record<string, { label: string; icon: LucideIcon }> = {
  juridico: { label: "Análisis Jurídico", icon: Scale },
  ambiental: { label: "Análisis Ambiental", icon: Leaf },
  arquitectonico: { label: "Análisis Arquitectónico", icon: Building2 },
  financiero: { label: "Modelo Financiero", icon: Coins },
  geotecnico: { label: "Análisis de Suelos", icon: Mountain },
  mercado: { label: "Análisis de Mercado", icon: TrendingUp },
  normativo: { label: "Análisis Normativo", icon: Layers },
  sspp: { label: "Servicios Públicos", icon: Droplets },
};

const TODOS_LOS_ANALISIS = Object.keys(AREA_META);

const mapEstadoTareaToArea = (estado: string): AreaAcordeon["estado"] => {
  if (estado === "entregado" || estado === "aprobado") return "listo";
  if (estado === "en_progreso" || estado === "en_revision") return "en_revision";
  return "pendiente";
};

const estadoLabelCorto = (codigo: string | null | undefined): string => {
  switch (codigo) {
    case "entregado":
    case "aprobado":
    case "listo":
      return "Listo";
    case "en_progreso":
    case "en_revision":
      return "En proceso";
    case "rechazado":
      return "Rechazado";
    case "no_aplica":
    case null:
    case undefined:
      return "Pendiente";
    default:
      return "Pendiente";
  }
};

const estadoVariant = (
  codigo: string,
): "default" | "secondary" | "outline" | "destructive" => {
  if (codigo === "Listo") return "default";
  if (codigo === "En proceso") return "secondary";
  if (codigo === "Rechazado") return "destructive";
  return "outline";
};

const buildTimeline = (
  pasoActual: number,
  fechaInicio?: string | null,
  fechaEntrega?: string | null,
  fechaSla?: string | null,
): PasoTimeline[] => {
  const labels = ["Iniciado", "En análisis", "En revisión", "Entregado"];
  return labels.map((label, i) => {
    let est: PasoTimeline["estado"] = "pendiente";
    if (pasoActual < 0) est = "pendiente";
    else if (i < pasoActual) est = "completado";
    else if (i === pasoActual) est = "actual";
    let fecha: string | null = null;
    if (i === 0) fecha = formatoFecha(fechaInicio);
    if (i === 3) fecha = formatoFecha(fechaEntrega ?? fechaSla);
    if (fecha === "—") fecha = null;
    return { key: `step-${i}`, label, fecha, estado: est };
  });
};

const TarjetaMaestraGrande = ({
  entregable,
  titulo,
  subtitulo,
  icon: Icon,
}: {
  entregable?: EntregablePublicado;
  titulo: string;
  subtitulo: string;
  icon: LucideIcon;
}) => {
  const { descargar } = useDescargarEntregable();
  const [loading, setLoading] = useState(false);
  const disponible = !!entregable;
  const esExterno = !!entregable?.tiene_url_externa;

  const handleClick = async () => {
    if (!entregable) return;
    setLoading(true);
    try {
      const url = await descargar(entregable.id);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (e: any) {
      toast({
        title: "No pudimos abrir el archivo",
        description: e?.message || "Intenta de nuevo en unos minutos.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="h-full">
      <CardContent className="flex h-full flex-col gap-4 p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Icon className="h-7 w-7" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-lg font-semibold tracking-tight">{titulo}</h3>
            <p className="text-sm text-muted-foreground">{subtitulo}</p>
            <div className="mt-1.5">
              {disponible ? (
                <Badge className="bg-emerald-600 text-white hover:bg-emerald-600">
                  ✓ Listo · v{entregable!.version}
                </Badge>
              ) : (
                <Badge variant="secondary">En proceso</Badge>
              )}
            </div>
          </div>
        </div>
        <div className="mt-auto">
          {disponible ? (
            <Button onClick={handleClick} disabled={loading} className="w-full" size="lg">
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : esExterno ? (
                <ExternalLink className="mr-2 h-4 w-4" />
              ) : (
                <Download className="mr-2 h-4 w-4" />
              )}
              {esExterno ? "Abrir" : "Descargar PDF"}
            </Button>
          ) : (
            <p className="text-xs text-muted-foreground">
              Te avisaremos cuando esté disponible.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

const EntregableSueltoRow = ({ ent }: { ent: EntregablePublicado }) => {
  const { descargar } = useDescargarEntregable();
  const [loading, setLoading] = useState(false);
  const esExterno = !!ent.tiene_url_externa;

  const handleClick = async () => {
    setLoading(true);
    try {
      const url = await descargar(ent.id);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (e: any) {
      toast({
        title: "No pudimos generar el enlace",
        description: e?.message || "Intenta de nuevo en unos minutos.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-start gap-4 rounded-lg border border-border bg-card p-4">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
        <TipoEntregableIcon tipo={ent.tipo as TipoEntregable} size={22} />
      </div>
      <div className="min-w-0 flex-1 space-y-1">
        <h4 className="truncate font-medium">{ent.nombre}</h4>
        <p className="text-xs text-muted-foreground">
          Versión {ent.version} · publicado {formatoFecha(ent.created_at)}
        </p>
        {ent.notas && ent.notas.trim() !== "" && (
          <p className="mt-2 flex items-start gap-1.5 text-xs text-muted-foreground">
            <StickyNote className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>{ent.notas}</span>
          </p>
        )}
      </div>
      <Button onClick={handleClick} disabled={loading} className="shrink-0">
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : esExterno ? (
          <ExternalLink className="mr-2 h-4 w-4" />
        ) : (
          <Download className="mr-2 h-4 w-4" />
        )}
        {!loading && (esExterno ? "Abrir" : "Descargar")}
      </Button>
    </div>
  );
};

// C.3 — Sección "Análisis incluidos en tu plan"
const AnalisisIncluidosSection = ({
  planId,
  planCodigo,
  planNombre,
  loteId,
  loteIdParaCta,
  tareas,
}: {
  planId: string;
  planCodigo: string | null;
  planNombre: string | null;
  loteId: string | null | undefined;
  loteIdParaCta: string | null | undefined;
  tareas: TareaAvance[];
}) => {
  const { data: analisisPorPlan = [] } = useAnalisisPorPlan();
  const incluidos = useMemo(
    () =>
      new Set(
        analisisPorPlan.filter((a) => a.plan_id === planId).map((a) => a.codigo),
      ),
    [analisisPorPlan, planId],
  );

  const estadoPorCodigo = useMemo(() => {
    const map = new Map<string, string>();
    for (const t of tareas) {
      const c = (t.tipo_codigo ?? "").toLowerCase();
      if (c) map.set(c, t.estado);
    }
    return map;
  }, [tareas]);

  const esPremium = (planCodigo ?? "").toLowerCase() === "premium";
  const totalIncluidos = TODOS_LOS_ANALISIS.filter((c) => incluidos.has(c)).length;

  return (
    <Card>
      <CardContent className="p-4 sm:p-6 space-y-4">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <h2 className="font-display text-lg font-semibold">
            Análisis incluidos en tu plan
          </h2>
          {planNombre && <Badge variant="secondary">{planNombre}</Badge>}
        </div>
        <p className="text-sm text-muted-foreground">
          Tu plan {planNombre ?? ""} incluye {totalIncluidos} de {TODOS_LOS_ANALISIS.length} análisis técnicos disponibles.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {TODOS_LOS_ANALISIS.map((codigo) => {
            const meta = AREA_META[codigo];
            const Icon = meta.icon;
            const incluido = incluidos.has(codigo);
            const estado = incluido
              ? estadoLabelCorto(estadoPorCodigo.get(codigo))
              : "No incluido";

            return (
              <div
                key={codigo}
                className={cn(
                  "flex items-center gap-3 p-2.5 rounded-md border",
                  incluido ? "bg-background" : "bg-muted/30 opacity-60",
                )}
              >
                <Icon
                  className={cn(
                    "h-5 w-5 shrink-0",
                    incluido ? "text-primary" : "text-muted-foreground",
                  )}
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{meta.label}</p>
                  {!incluido && (
                    <p className="text-[10px] text-muted-foreground">
                      Disponible en plan superior
                    </p>
                  )}
                </div>
                {incluido && (
                  <Badge
                    variant={estadoVariant(estado)}
                    className="text-[10px] shrink-0"
                  >
                    {estado}
                  </Badge>
                )}
              </div>
            );
          })}
        </div>

        {!esPremium && (
          <div className="mt-2 pt-3 border-t flex items-center justify-between gap-3 flex-wrap">
            <p className="text-sm text-muted-foreground">
              ¿Quieres análisis adicionales? Mejora a un plan superior.
            </p>
            <Button asChild size="sm">
              <Link
                to={loteIdParaCta ? `/planes?lote_id=${loteIdParaCta}` : "/planes"}
              >
                <Sparkles className="mr-1 h-3.5 w-3.5" />
                Mejorar plan
              </Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// C.7 — Resumen de resultados (engagement entregado)
const ResumenResultadosCard = ({
  engagementId,
  loteId,
}: {
  engagementId: string;
  loteId: string | null | undefined;
}) => {
  const { valoracionEstimada, scorePromedio } = useAnalisisUnificadoEngagement(
    engagementId,
    loteId ?? undefined,
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Resumen de resultados</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="rounded-lg border bg-card p-4 text-center">
            <div className="flex items-center justify-center mb-1 text-muted-foreground">
              <DollarSign className="h-4 w-4" />
            </div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
              Valoración estimada
            </p>
            <p className="font-display font-bold text-xl mt-1">
              {valoracionEstimada != null
                ? formatCOPCompact(valoracionEstimada)
                : "—"}
            </p>
          </div>
          <div className="rounded-lg border bg-card p-4 text-center">
            <div className="flex items-center justify-center mb-1 text-muted-foreground">
              <Target className="h-4 w-4" />
            </div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
              Score 360°
            </p>
            <p className="font-display font-bold text-xl mt-1">
              {scorePromedio != null ? `${scorePromedio.toFixed(1)}/10` : "—"}
            </p>
          </div>
          <div className="rounded-lg border bg-card p-4 text-center">
            <div className="flex items-center justify-center mb-1 text-muted-foreground">
              <TrendingUp className="h-4 w-4" />
            </div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
              Viabilidad
            </p>
            <p className="font-display font-bold text-xl mt-1">
              {scorePromedio != null ? `${scorePromedio.toFixed(1)}/10` : "—"}
            </p>
          </div>
        </div>

        {loteId && (
          <Button asChild className="w-full">
            <Link to={`/lotes/${loteId}/ficha`}>
              Ver ficha técnica completa →
            </Link>
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

// Sidebar enriquecido (C.5, C.6)
const SidebarEngagement = ({
  asesor,
  asesorId,
  asesorEspecialidad,
  fechaInicio,
  fechaEntregaEstimada,
  diasParaSla,
  esEntregado,
  avancePct,
  planCodigo,
  loteIdParaCta,
  onContactarAsesor,
  iniciales: ini,
  actividad,
}: {
  asesor: { nombre: string | null; email?: string | null } | null;
  asesorId?: string | null;
  asesorEspecialidad?: string | null;
  fechaInicio?: string | null;
  fechaEntregaEstimada?: string | null;
  diasParaSla?: number | null;
  esEntregado: boolean;
  avancePct: number;
  planCodigo?: string | null;
  loteIdParaCta?: string | null;
  onContactarAsesor: () => void;
  iniciales: string;
  actividad: Array<{
    id: string;
    tipo: string;
    titulo: string;
    fecha: string;
  }>;
}) => {
  const slaCfg = computeSlaConfig({
    dias: diasParaSla,
    esEntregado,
    fechaEntrega: fechaEntregaEstimada,
  });
  const esPremium = (planCodigo ?? "").toLowerCase() === "premium";

  return (
    <aside className="space-y-4 lg:sticky lg:top-20">
      {/* Asesor */}
      <div className="rounded-lg border border-border bg-card p-4">
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Tu asesor asignado
        </h3>
        {asesor ? (
          <>
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                <AvatarFallback className="bg-primary/10 text-primary">
                  {ini}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="truncate font-medium">{asesor.nombre ?? "Experto"}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {asesorEspecialidad ?? "Experto 360Lateral"}
                </p>
              </div>
            </div>
            <Button onClick={onContactarAsesor} className="mt-4 w-full">
              <Mail className="mr-2 h-4 w-4" /> Contactar asesor
            </Button>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">Por asignar</p>
        )}
      </div>

      {/* Resumen del proceso + SLA countdown */}
      <div className="rounded-lg border border-border bg-card p-4">
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Resumen del proceso
        </h3>
        <div className="space-y-3 text-sm">
          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" /> Inicio
            </span>
            <span className="font-medium">{fechaInicio ?? "—"}</span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <CalendarCheck className="h-3.5 w-3.5" /> Entrega
            </span>
            <span className="font-medium">{fechaEntregaEstimada ?? "—"}</span>
          </div>

          {/* SLA countdown destacado siempre visible */}
          <div
            className={cn(
              "rounded-md border p-2 text-center text-sm font-semibold flex items-center justify-center gap-1.5",
              slaCfg.bgClass,
              slaCfg.textClass,
            )}
          >
            <Clock className="h-4 w-4" />
            {slaCfg.text}
          </div>

          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Avance</span>
              <span className="font-semibold">{Math.round(avancePct)}%</span>
            </div>
            <Progress value={avancePct} className="h-2" />
          </div>
        </div>
      </div>

      {/* CTA Mejorar plan */}
      {!esPremium && (
        <Card className="bg-primary/5 border-primary/30">
          <CardContent className="pt-4 space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <h3 className="font-semibold text-sm">Mejora tu análisis</h3>
            </div>
            <p className="text-xs text-muted-foreground">
              Con un plan superior accedes a más análisis técnicos para tu lote.
            </p>
            <Button size="sm" className="w-full" asChild>
              <Link
                to={loteIdParaCta ? `/planes?lote_id=${loteIdParaCta}` : "/planes"}
              >
                Ver planes superiores
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Actividad reciente */}
      <div className="rounded-lg border border-border bg-card p-4">
        <h3 className="mb-3 flex items-center gap-1.5 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          <Activity className="h-3.5 w-3.5" /> Actividad reciente
        </h3>
        {actividad.length === 0 ? (
          <div className="text-sm text-muted-foreground space-y-2">
            <p className="text-xs">Aquí verás cuando:</p>
            <ul className="space-y-1 text-xs list-disc pl-4">
              <li>Tu asesor avance en un análisis</li>
              <li>Se publique un nuevo entregable</li>
              <li>Recibas un mensaje del equipo</li>
            </ul>
          </div>
        ) : (
          <ul className="space-y-3">
            {actividad.slice(0, 5).map((ev) => (
              <li key={ev.id} className="flex items-start gap-2.5">
                <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  {ev.tipo === "entregable_publicado" ? (
                    <FileText className="h-3.5 w-3.5" />
                  ) : ev.tipo === "tarea_completada" ? (
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  ) : (
                    <MessageSquare className="h-3.5 w-3.5" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs leading-snug text-foreground">
                    {ev.titulo}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {formatRelativeDate(ev.fecha)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
};

const EngagementClienteDetalleInner = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data, isLoading } = useEngagementCliente(id);
  const { data: actividad } = useActividadEngagement(id);
  const [contactoOpen, setContactoOpen] = useState(false);
  const generarPago = useGenerarPagoWompi();

  const { diagnostico, presentacion, soportesPorTarea, sueltos } = useMemo(() => {
    const ent = data?.entregables_publicados ?? [];
    const diag = ent.find((e) => e.tipo === "diagnostico_inmobiliario");
    const pres = ent.find((e) => e.tipo === "presentacion_diagnostico");
    const soportes: Record<string, EntregablePublicado[]> = {};
    const otros: EntregablePublicado[] = [];
    for (const e of ent) {
      if (TIPOS_MAESTROS.has(e.tipo)) continue;
      if (e.tipo_analisis_id) {
        (soportes[e.tipo_analisis_id] ||= []).push(e);
      } else {
        otros.push(e);
      }
    }
    return {
      diagnostico: diag,
      presentacion: pres,
      soportesPorTarea: soportes,
      sueltos: otros,
    };
  }, [data]);

  const areas: AreaAcordeon[] = useMemo(() => {
    const tareas: TareaAvance[] = data?.avance?.tareas ?? [];
    return tareas.map((t) => {
      const codigo = (t.tipo_codigo ?? "").toLowerCase();
      const meta = AREA_META[codigo] ?? { label: t.nombre, icon: FileText };
      const entregablesArea = t.tipo_analisis_id
        ? (soportesPorTarea[t.tipo_analisis_id] ?? []).map((e) => ({
            id: e.id,
            nombre: e.nombre,
            tipo: e.tipo,
            tiene_url_externa: e.tiene_url_externa,
          }))
        : [];
      return {
        key: t.id,
        label: meta.label,
        icon: meta.icon,
        score: null,
        estado: mapEstadoTareaToArea(t.estado),
        entregables: entregablesArea,
      } as AreaAcordeon;
    });
  }, [data, soportesPorTarea]);

  const totalListos = areas.filter((a) => a.estado === "listo").length;

  // SLA dias (calculado client-side desde fecha_sla)
  const diasParaSla = useMemo(() => {
    if (!data?.engagement?.fecha_sla) return null;
    const f = new Date(data.engagement.fecha_sla).getTime();
    const hoy = Date.now();
    return Math.ceil((f - hoy) / (1000 * 60 * 60 * 24));
  }, [data?.engagement?.fecha_sla]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-40" />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
          <div className="space-y-4">
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardContent className="space-y-4 py-16 text-center">
          <h2 className="text-xl font-semibold">No encontramos este diagnóstico</h2>
          <p className="text-muted-foreground">
            No tienes acceso a él, o el enlace es incorrecto.
          </p>
          <Button onClick={() => navigate("/portal")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a mis diagnósticos
          </Button>
        </CardContent>
      </Card>
    );
  }

  const { engagement, lote, plan, asesor } = data;
  const estadoEng = engagement.estado;
  const avancePct = engagement.avance_pct ?? 0;
  const esEntregado = estadoEng === "entregado" || estadoEng === "cerrado";
  const esBorrador = estadoEng === "borrador" || estadoEng === "prospecto";
  const esAtrasado =
    !esEntregado && diasParaSla != null && diasParaSla < 0;

  const pasoActual = calcularPasoStepper(estadoEng, avancePct);
  const pasos = buildTimeline(
    pasoActual,
    engagement.fecha_inicio,
    (engagement as any).fecha_entrega,
    engagement.fecha_sla,
  );

  const tituloLote = nombreLoteMostrable(
    lote?.nombre_lote,
    lote?.direccion,
    lote?.ciudad,
  );

  const handleCompletarPago = async () => {
    try {
      const d = await generarPago.mutateAsync(engagement.id);
      if (d.payment_url) window.location.href = d.payment_url;
    } catch {
      /* toast handled */
    }
  };

  return (
    <div className="space-y-6">
      <Button
        variant="ghost"
        onClick={() => navigate("/portal")}
        className="-ml-3"
      >
        <ArrowLeft className="mr-2 h-4 w-4" /> Volver a mis diagnósticos
      </Button>

      {/* C.7 — Banner entregado */}
      {esEntregado && (
        <Card className="border-emerald-300 bg-emerald-50 dark:bg-emerald-950/30">
          <CardContent className="pt-4 flex flex-col sm:flex-row sm:items-center gap-3">
            <PartyPopper className="h-6 w-6 text-emerald-600 shrink-0" />
            <div className="flex-1 min-w-0">
              <h2 className="font-display font-bold text-base sm:text-lg">
                ¡Tu análisis está listo!
              </h2>
              <p className="text-sm text-muted-foreground">
                Entregado el {formatoFecha((engagement as any).fecha_entrega ?? engagement.fecha_sla)}.
              </p>
            </div>
            {lote?.id && (
              <Button asChild className="shrink-0">
                <Link to={`/lotes/${lote.id}/ficha`}>Ver ficha técnica</Link>
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* C.8 — Estado borrador / pago pendiente */}
      {esBorrador && (
        <Card className="border-amber-300 bg-amber-50 dark:bg-amber-950/30">
          <CardContent className="pt-4 flex flex-col sm:flex-row sm:items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1 space-y-1">
              <h3 className="font-semibold text-sm">
                Tu análisis aún no ha iniciado
              </h3>
              <p className="text-sm text-muted-foreground">
                Completa el pago de tu plan {plan?.nombre ?? ""} para que iniciemos el análisis.
              </p>
            </div>
            <Button
              onClick={handleCompletarPago}
              disabled={generarPago.isPending}
              className="shrink-0"
            >
              {generarPago.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <CreditCard className="mr-2 h-4 w-4" />
              )}
              Completar pago
            </Button>
          </CardContent>
        </Card>
      )}

      {/* C.8 — Estado atrasado */}
      {esAtrasado && (
        <Card className="border-red-300 bg-red-50 dark:bg-red-950/30">
          <CardContent className="pt-4 flex flex-col sm:flex-row sm:items-start gap-3">
            <Clock className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
            <div className="flex-1 space-y-1">
              <h3 className="font-semibold text-sm">Tu entrega está atrasada</h3>
              <p className="text-sm text-muted-foreground">
                Tu análisis lleva {Math.abs(diasParaSla ?? 0)} día(s) de retraso. Estamos trabajando en finalizarlo.
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => setContactoOpen(true)}
              className="shrink-0"
            >
              <Mail className="mr-2 h-4 w-4" />
              Contactar asesor
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        {/* Columna principal */}
        <div className="min-w-0 space-y-6">
          {/* Hero + timeline */}
          <Card>
            <CardContent className="space-y-6 p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 space-y-1">
                  <h1 className="text-2xl font-semibold tracking-tight">
                    {tituloLote}
                  </h1>
                  <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4 shrink-0" />
                    <span className="truncate">
                      {[lote?.direccion, lote?.ciudad].filter(Boolean).join(" · ") ||
                        "Ubicación no disponible"}
                    </span>
                  </p>
                </div>
                {plan?.nombre && (
                  <Badge variant="secondary" className="shrink-0">
                    {plan.nombre}
                  </Badge>
                )}
              </div>
              <TimelineProcesoEngagement pasos={pasos} />
            </CardContent>
          </Card>

          {/* C.7 — Resumen de resultados (engagement entregado) */}
          {esEntregado && (
            <ResumenResultadosCard engagementId={engagement.id} loteId={lote?.id} />
          )}

          {/* C.3 — Análisis incluidos en tu plan */}
          {plan?.id && (
            <AnalisisIncluidosSection
              planId={plan.id}
              planCodigo={plan.codigo}
              planNombre={plan.nombre}
              loteId={lote?.id}
              loteIdParaCta={lote?.id}
              tareas={data.avance?.tareas ?? []}
            />
          )}

          {/* Tarjetas maestras */}
          <div className="space-y-3">
            <div>
              <h2 className="text-lg font-semibold">Entregables maestros</h2>
              <p className="text-sm text-muted-foreground">
                Abre tu Diagnóstico y tu Presentación con un solo clic.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <TarjetaMaestraGrande
                entregable={diagnostico}
                titulo="Diagnóstico Inmobiliario"
                subtitulo="Tu informe integrador"
                icon={FileText}
              />
              <TarjetaMaestraGrande
                entregable={presentacion}
                titulo="Presentación del Diagnóstico"
                subtitulo="Slides resumen"
                icon={FileText}
              />
            </div>
          </div>

          {/* Análisis por área en acordeón */}
          {data.avance?.mostrar_detalle && areas.length > 0 && (
            <AnalisisPorAreaAcordeon
              areas={areas}
              totalListos={totalListos}
              total={areas.length}
            />
          )}

          {/* Otros documentos sueltos */}
          {sueltos.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-lg font-semibold">Otros documentos</h2>
              <div className="space-y-3">
                {sueltos.map((e) => (
                  <EntregableSueltoRow key={e.id} ent={e} />
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Los enlaces de descarga son temporales y se generan en cada click.
              </p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <SidebarEngagement
          asesor={asesor ? { nombre: asesor.nombre, email: asesor.email } : null}
          asesorId={asesor?.id ?? null}
          fechaInicio={
            engagement.fecha_inicio ? formatoFecha(engagement.fecha_inicio) : null
          }
          fechaEntregaEstimada={
            engagement.fecha_sla ? formatoFecha(engagement.fecha_sla) : null
          }
          diasParaSla={diasParaSla}
          esEntregado={esEntregado}
          avancePct={avancePct}
          planCodigo={plan?.codigo}
          loteIdParaCta={lote?.id}
          onContactarAsesor={() => setContactoOpen(true)}
          iniciales={iniciales(asesor?.nombre, asesor?.email)}
          actividad={actividad ?? []}
        />
      </div>

      <ContactarAsesorDialog
        open={contactoOpen}
        onOpenChange={setContactoOpen}
        engagementId={engagement.id}
        asesorId={asesor?.id ?? null}
        asesorNombre={asesor?.nombre ?? null}
      />
    </div>
  );
};

const EngagementClienteDetalle = () => (
  <PortalProtectedRoute>
    <PortalClienteLayout>
      <EngagementClienteDetalleInner />
    </PortalClienteLayout>
  </PortalProtectedRoute>
);

export default EngagementClienteDetalle;
