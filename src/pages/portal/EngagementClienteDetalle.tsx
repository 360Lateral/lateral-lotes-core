import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import PortalClienteLayout from "@/components/portal/PortalClienteLayout";
import PortalProtectedRoute from "@/components/portal/PortalProtectedRoute";
import TarjetasMaestrosCliente from "@/components/portal/TarjetasMaestrosCliente";
import TimelineProcesoEngagement, {
  type PasoTimeline,
} from "@/components/portal/TimelineProcesoEngagement";
import SidebarStickyEngagement from "@/components/portal/SidebarStickyEngagement";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import TipoEntregableIcon from "@/components/entregables/TipoEntregableIcon";
import type { TipoEntregable } from "@/hooks/useEntregablesEngagement";
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
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const TIPOS_MAESTROS = new Set(["diagnostico_inmobiliario", "presentacion_diagnostico"]);

const formatoFecha = (fecha?: string | null) => {
  if (!fecha) return "—";
  return new Date(fecha).toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
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

// Mapeo tipo_codigo → icono y label visible
const AREA_META: Record<string, { label: string; icon: LucideIcon }> = {
  juridico: { label: "Análisis Jurídico", icon: Scale },
  ambiental: { label: "Análisis Ambiental", icon: Leaf },
  arquitectonico: { label: "Análisis Arquitectónico", icon: Building2 },
  financiero: { label: "Modelo Financiero", icon: Coins },
  geotecnico: { label: "Análisis de Suelos", icon: Mountain },
  mercado: { label: "Análisis de Mercado", icon: TrendingUp },
  normativo: { label: "Análisis Normativo", icon: Layers },
  sspp: { label: "Servicios Públicos", icon: Droplets },
  valoracion_referencial: { label: "Valoración referencial", icon: Coins },
  score_viabilidad: { label: "Score de viabilidad", icon: TrendingUp },
};

const mapEstadoTareaToArea = (estado: string): AreaAcordeon["estado"] => {
  if (estado === "entregado" || estado === "aprobado") return "listo";
  if (estado === "en_progreso" || estado === "en_revision") return "en_revision";
  return "pendiente";
};

// 4 pasos honestos al enum real (prospecto, activo, en_revision, entregado/cerrado)
const ESTADOS_ENGAGEMENT_ORDEN = ["prospecto", "activo", "en_revision", "entregado"];

const buildTimeline = (
  estado: string,
  fechaInicio?: string | null,
  fechaEntrega?: string | null,
  fechaSla?: string | null,
): PasoTimeline[] => {
  const idxActual =
    estado === "cerrado" ? 3 : ESTADOS_ENGAGEMENT_ORDEN.indexOf(estado);
  const labels = ["Iniciado", "En análisis", "En revisión", "Entregado"];
  return labels.map((label, i) => {
    let est: PasoTimeline["estado"] = "pendiente";
    if (idxActual < 0) est = "pendiente";
    else if (i < idxActual) est = "completado";
    else if (i === idxActual) est = "actual";
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
                  ✓ Disponible · v{entregable!.version}
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

const EngagementClienteDetalleInner = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data, isLoading } = useEngagementCliente(id);
  const { data: actividad } = useActividadEngagement(id);
  const [contactoOpen, setContactoOpen] = useState(false);

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
    return tareas
      .map((t) => {
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
  const pasos = buildTimeline(
    engagement.estado,
    engagement.fecha_inicio,
    (engagement as any).fecha_entrega,
    engagement.fecha_sla,
  );

  return (
    <div className="space-y-6">
      <Button
        variant="ghost"
        onClick={() => navigate("/portal")}
        className="-ml-3"
      >
        <ArrowLeft className="mr-2 h-4 w-4" /> Volver a mis diagnósticos
      </Button>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        {/* Columna principal */}
        <div className="min-w-0 space-y-6">
          {/* Hero compacto + timeline */}
          <Card>
            <CardContent className="space-y-6 p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 space-y-1">
                  <h1 className="text-2xl font-semibold tracking-tight">
                    {lote?.nombre_lote ?? "Lote sin nombre"}
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

          {/* Tarjetas maestras destacadas */}
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
        <SidebarStickyEngagement
          asesor={asesor ? { nombre: asesor.nombre, email: asesor.email } : null}
          fechaInicio={engagement.fecha_inicio ? formatoFecha(engagement.fecha_inicio) : null}
          fechaEntregaEstimada={engagement.fecha_sla ? formatoFecha(engagement.fecha_sla) : null}
          avancePct={engagement.avance_pct ?? 0}
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
