import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import PortalClienteLayout from "@/components/portal/PortalClienteLayout";
import PortalProtectedRoute from "@/components/portal/PortalProtectedRoute";
import { useEngagementCliente, TareaAvance, EntregablePublicado } from "@/hooks/cliente/useEngagementCliente";
import { useDescargarEntregable } from "@/hooks/cliente/useDescargarEntregable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import TipoEntregableIcon from "@/components/entregables/TipoEntregableIcon";
import type { TipoEntregable } from "@/hooks/useEntregablesEngagement";
import {
  ArrowLeft,
  Calendar,
  CalendarCheck,
  Mail,
  MapPin,
  StickyNote,
  Download,
  ExternalLink,
  Loader2,
  FileText,
  User as UserIcon,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

const formatoFecha = (fecha: string | null) => {
  if (!fecha) return "—";
  return new Date(fecha).toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const planVariant = (codigo?: string | null) => {
  const c = (codigo || "").toLowerCase();
  if (c.includes("premium")) return { className: "bg-amber-500 hover:bg-amber-600 text-white" };
  if (c.includes("pro")) return { className: "" };
  if (c.includes("basico") || c.includes("básico")) return { className: "" };
  return { className: "" };
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

const estadoTareaPill = (estado: string) => {
  const map: Record<string, { label: string; cls: string }> = {
    pendiente: { label: "Por iniciar", cls: "bg-muted text-muted-foreground" },
    en_progreso: { label: "En proceso", cls: "bg-primary text-primary-foreground" },
    en_revision: { label: "En revisión", cls: "bg-amber-500 text-white" },
    aprobado: { label: "Aprobado por revisión", cls: "border border-emerald-600 text-emerald-700 bg-transparent" },
    entregado: { label: "Entregado", cls: "bg-emerald-600 text-white" },
    rechazado: { label: "Requiere ajustes", cls: "bg-destructive text-destructive-foreground" },
    no_aplica: { label: "No aplica", cls: "bg-muted text-muted-foreground" },
  };
  const info = map[estado] || { label: estado, cls: "bg-muted text-muted-foreground" };
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${info.cls}`}>
      {info.label}
    </span>
  );
};

const EntregableRow = ({ ent }: { ent: EntregablePublicado }) => {
  const { descargar } = useDescargarEntregable();
  const [loading, setLoading] = useState(false);
  const esExterno = !!ent.url_externa;
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
    <div className="flex items-start gap-4 p-4 rounded-lg border border-border bg-card">
      <div className="h-12 w-12 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0">
        <TipoEntregableIcon tipo={ent.tipo as TipoEntregable} size={24} />
      </div>
      <div className="flex-1 min-w-0 space-y-1">
        <h4 className="font-medium truncate">{ent.nombre}</h4>
        <p className="text-xs text-muted-foreground">
          Versión {ent.version} · publicado {formatoFecha(ent.created_at)}
        </p>
        {ent.notas && ent.notas.trim() !== "" && (
          <p className="text-xs text-muted-foreground flex items-start gap-1.5 mt-2">
            <StickyNote className="h-3.5 w-3.5 mt-0.5 shrink-0" />
            <span>{ent.notas}</span>
          </p>
        )}
      </div>
      <Button onClick={handleClick} disabled={loading} className="shrink-0">
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : esExterno ? (
          <ExternalLink className="h-4 w-4 mr-2" />
        ) : (
          <Download className="h-4 w-4 mr-2" />
        )}
        {!loading && (esExterno ? "Abrir" : "Descargar")}
      </Button>
    </div>
  );
};

const EngagementClienteDetalleInner = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data, isLoading, isError } = useEngagementCliente(id);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <Card>
        <CardContent className="py-16 text-center space-y-4">
          <h2 className="text-xl font-semibold">No encontramos este diagnóstico</h2>
          <p className="text-muted-foreground">
            No tienes acceso a él, o el enlace es incorrecto.
          </p>
          <Button onClick={() => navigate("/portal")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a mis diagnósticos
          </Button>
        </CardContent>
      </Card>
    );
  }

  const { engagement, lote, plan, asesor, avance, entregables_publicados } = data;
  const planUI = planVariant(plan?.codigo);

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={() => navigate("/portal")} className="-ml-3">
        <ArrowLeft className="h-4 w-4 mr-2" /> Volver a mis diagnósticos
      </Button>

      {/* Bloque 1: encabezado */}
      <Card>
        <CardContent className="p-6 space-y-6">
          <div className="space-y-1.5">
            <h1 className="text-2xl font-semibold tracking-tight">
              {lote?.nombre_lote || "Lote sin nombre"}
            </h1>
            <p className="text-muted-foreground flex items-center gap-1.5">
              <MapPin className="h-4 w-4" />
              {[lote?.direccion, lote?.ciudad].filter(Boolean).join(", ") || "Ubicación no disponible"}
            </p>
          </div>

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <span className="text-xs uppercase tracking-wider text-muted-foreground">Plan contratado</span>
              <div>
                {plan?.nombre ? (
                  <Badge className={planUI.className}>{plan.nombre}</Badge>
                ) : (
                  <span className="text-sm">—</span>
                )}
              </div>
            </div>
            <div className="space-y-1">
              <span className="text-xs uppercase tracking-wider text-muted-foreground">Asesor asignado</span>
              {asesor ? (
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary/10 text-primary text-xs">
                      {iniciales(asesor.nombre, asesor.email)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{asesor.nombre || "Asesor"}</p>
                    {asesor.email && (
                      <p className="text-xs text-muted-foreground truncate">{asesor.email}</p>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Por asignar</p>
              )}
            </div>
            <div className="space-y-1">
              <span className="text-xs uppercase tracking-wider text-muted-foreground">Fecha de inicio</span>
              <p className="text-sm flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                {formatoFecha(engagement.fecha_inicio)}
              </p>
            </div>
            <div className="space-y-1">
              <span className="text-xs uppercase tracking-wider text-muted-foreground">Fecha estimada de entrega</span>
              <p className="text-sm flex items-center gap-1.5">
                <CalendarCheck className="h-4 w-4 text-muted-foreground" />
                {formatoFecha(engagement.fecha_sla)}
              </p>
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Avance</span>
              <span className="text-sm font-semibold">{Math.round(engagement.avance_pct ?? 0)}%</span>
            </div>
            <Progress value={engagement.avance_pct ?? 0} className="h-3" />
            <div>
              <Badge variant="secondary" className="capitalize">
                {engagement.estado.replace(/_/g, " ")}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bloque 2: avance detallado */}
      {avance?.mostrar_detalle && (
        <Card>
          <CardHeader>
            <CardTitle>Avance detallado de tus análisis</CardTitle>
            <p className="text-sm text-muted-foreground">
              Sigue en tiempo real cómo va cada parte de tu diagnóstico.
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            {(avance.tareas || []).length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Aún no hay análisis configurados.
              </p>
            ) : (
              avance.tareas.map((t: TareaAvance) => (
                <div
                  key={t.id}
                  className="flex items-center gap-4 p-3 rounded-lg border border-border bg-card"
                >
                  <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center shrink-0">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{t.nombre}</p>
                  </div>
                  {estadoTareaPill(t.estado)}
                </div>
              ))
            )}
          </CardContent>
        </Card>
      )}

      {/* Bloque 3: entregables */}
      <Card>
        <CardHeader>
          <CardTitle>Entregables disponibles</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {(entregables_publicados || []).length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Tu asesor aún no ha publicado entregables. Te avisaremos cuando estén listos.
            </p>
          ) : (
            <>
              {entregables_publicados.map((e) => (
                <EntregableRow key={e.id} ent={e} />
              ))}
              <p className="text-xs text-muted-foreground pt-2">
                Los enlaces de descarga son temporales y se generan en cada click.
              </p>
            </>
          )}
        </CardContent>
      </Card>

      {/* Bloque 4: contacto asesor */}
      {asesor && (
        <Card>
          <CardContent className="p-6 flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
            <div className="flex items-center gap-3">
              <UserIcon className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">¿Tienes preguntas?</p>
                <p className="text-sm text-muted-foreground">
                  Escribe a {asesor.nombre || "tu asesor"}
                  {asesor.email && (
                    <>
                      {" — "}
                      <a href={`mailto:${asesor.email}`} className="text-primary hover:underline">
                        {asesor.email}
                      </a>
                    </>
                  )}
                </p>
              </div>
            </div>
            {asesor.email && (
              <Button asChild>
                <a href={`mailto:${asesor.email}`}>
                  <Mail className="h-4 w-4 mr-2" /> Enviar email
                </a>
              </Button>
            )}
          </CardContent>
        </Card>
      )}
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
