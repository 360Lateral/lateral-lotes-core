import { useState, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ChevronLeft, ChevronDown, FileText, ExternalLink } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useOrdenDetalle } from "@/hooks/useOrdenDetalle";
import { usePropuestasDeOrden } from "@/hooks/usePropuestasDeOrden";
import { useAdjudicarPropuesta } from "@/hooks/useAdjudicarPropuesta";
import { useCancelarOrdenServicio } from "@/hooks/useCancelarOrdenServicio";
import PropuestaComparativaCard from "@/components/ordenes/PropuestaComparativaCard";

const fmtCOP = (n: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(n);

const fmtFecha = (d?: string | null) =>
  d ? new Date(d).toLocaleDateString("es-CO") : "—";

const estadoOrdenBadge = (estado: string) => {
  const variants: Record<string, { cls: string; label: string }> = {
    abierta: { cls: "bg-blue-600 text-white", label: "Abierta" },
    adjudicada: { cls: "bg-emerald-600 text-white", label: "Adjudicada" },
    en_ejecucion: { cls: "bg-amber-600 text-white", label: "En ejecución" },
    completada: { cls: "bg-emerald-700 text-white", label: "Completada" },
    cancelada: { cls: "bg-destructive text-destructive-foreground", label: "Cancelada" },
  };
  const v = variants[estado] ?? { cls: "bg-muted text-foreground", label: estado };
  return <Badge className={`${v.cls} text-sm py-1 px-3`}>{v.label}</Badge>;
};

const DashboardOrdenServicioDetalle = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { roles } = useAuth();
  const isAdmin = roles.some((r) => ["admin", "super_admin"].includes(r));

  const { data: orden, isLoading, error } = useOrdenDetalle(id);
  const { data: propuestas = [], isLoading: loadingProps } = usePropuestasDeOrden(id);
  const adjudicar = useAdjudicarPropuesta();
  const cancelar = useCancelarOrdenServicio();

  const [motivoCancel, setMotivoCancel] = useState("");
  const [notasOpen, setNotasOpen] = useState(false);

  const propuestasOrdenadas = useMemo(
    () =>
      [...(propuestas as any[])].sort(
        (a, b) => Number(a.precio_propuesto) - Number(b.precio_propuesto),
      ),
    [propuestas],
  );

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="max-w-5xl mx-auto space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </DashboardLayout>
    );
  }

  if (error || !orden) {
    return (
      <DashboardLayout>
        <Card>
          <CardContent className="p-12 text-center space-y-3">
            <p className="text-muted-foreground">Orden no encontrada.</p>
            <Button onClick={() => navigate("/dashboard/ordenes-servicio")}>
              Volver a órdenes
            </Button>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  const ordenAny = orden as any;
  const contrato = ordenAny.contrato;
  const fechaLimite = ordenAny.fecha_limite_propuestas
    ? new Date(ordenAny.fecha_limite_propuestas)
    : null;
  const diasRest = fechaLimite
    ? Math.ceil((fechaLimite.getTime() - Date.now()) / (1000 * 3600 * 24))
    : null;

  const puedeAdjudicar = ordenAny.estado === "abierta" && isAdmin;
  const puedeCancelar = isAdmin && ["abierta", "adjudicada"].includes(ordenAny.estado);
  const shortId = ordenAny.id.slice(0, 8);

  const handleCancelar = () => {
    cancelar.mutate({
      orden_id: ordenAny.id,
      motivo: motivoCancel.trim() || undefined,
    });
    setMotivoCancel("");
  };

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-4">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2"
            onClick={() => navigate("/dashboard/ordenes-servicio")}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Órdenes de servicio
          </Button>
          <span>›</span>
          <span className="font-mono text-xs">#{shortId}</span>
        </div>

        {/* Header card */}
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  {estadoOrdenBadge(ordenAny.estado)}
                  <Badge variant={ordenAny.visibilidad === "publica" ? "default" : "outline"}>
                    {ordenAny.visibilidad === "publica" ? "Pública" : "Invitación"}
                  </Badge>
                </div>
                <h1 className="font-display text-2xl font-semibold text-foreground mt-2">
                  Análisis {ordenAny.tipo?.nombre ?? "—"} · Lote{" "}
                  {ordenAny.lote?.nombre_lote ?? "—"}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {ordenAny.lote?.ciudad ?? "—"}
                  {ordenAny.lote?.barrio ? ` · ${ordenAny.lote.barrio}` : ""}
                </p>
                {ordenAny.engagement_id && (
                  <Link
                    to={`/dashboard/engagements/${ordenAny.engagement_id}`}
                    className="inline-flex items-center gap-1 text-sm text-primary hover:underline mt-1"
                  >
                    <ExternalLink className="h-3 w-3" />
                    Ver engagement
                  </Link>
                )}
              </div>

              {isAdmin && (
                <div>
                  {puedeCancelar ? (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm">
                          Cancelar orden
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>¿Cancelar esta orden?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Se notificará a todos los expertos que ya postularon. Puedes
                            registrar un motivo (opcional).
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <div className="space-y-2">
                          <Label htmlFor="motivo">Motivo (opcional)</Label>
                          <Textarea
                            id="motivo"
                            rows={3}
                            value={motivoCancel}
                            onChange={(e) => setMotivoCancel(e.target.value)}
                            placeholder="Ej: el lote fue retirado del inventario."
                          />
                        </div>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Volver</AlertDialogCancel>
                          <AlertDialogAction onClick={handleCancelar}>
                            Cancelar orden
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  ) : (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span>
                            <Button variant="destructive" size="sm" disabled>
                              Cancelar orden
                            </Button>
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>
                          Solo se pueden cancelar órdenes abiertas o adjudicadas.
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>
              )}
            </div>

            {/* Datos del contrato y orden */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm border-t pt-4">
              {contrato && (
                <>
                  <div>
                    <p className="text-xs text-muted-foreground">Contrato</p>
                    <p className="font-semibold">v{contrato.version}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Precio permitido</p>
                    <p className="font-semibold text-xs">
                      {fmtCOP(Number(contrato.precio_min))}–{fmtCOP(Number(contrato.precio_max))}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Plazo permitido</p>
                    <p className="font-semibold">
                      {contrato.plazo_min_dias}–{contrato.plazo_max_dias} días
                    </p>
                  </div>
                </>
              )}
              <div>
                <p className="text-xs text-muted-foreground">Fecha límite</p>
                <p className="font-semibold">{fmtFecha(ordenAny.fecha_limite_propuestas)}</p>
                {ordenAny.estado === "abierta" && diasRest !== null && (
                  <p
                    className={`text-xs ${
                      diasRest <= 2 ? "text-destructive" : "text-muted-foreground"
                    }`}
                  >
                    {diasRest > 0 ? `Vence en ${diasRest} días` : "vencida"}
                  </p>
                )}
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Creado por</p>
                <p className="font-semibold">{ordenAny.creador?.nombre ?? "—"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Creado el</p>
                <p className="font-semibold">{fmtFecha(ordenAny.created_at)}</p>
              </div>
            </div>

            {/* Invitados */}
            {ordenAny.visibilidad === "invitacion" &&
              Array.isArray(ordenAny.invitaciones) &&
              ordenAny.invitaciones.length > 0 && (
                <div className="border-t pt-4">
                  <p className="text-xs text-muted-foreground mb-2">Expertos invitados</p>
                  <div className="flex flex-wrap gap-2">
                    {ordenAny.invitaciones.map((inv: any) => (
                      <Badge key={inv.experto_id} variant="outline">
                        {inv.experto?.nombre ?? inv.experto?.email ?? "Experto"}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
          </CardContent>
        </Card>

        {/* Propuestas */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-semibold text-foreground">
              Propuestas recibidas
            </h2>
            <Badge variant="secondary">{propuestasOrdenadas.length}</Badge>
          </div>

          {loadingProps ? (
            <div className="space-y-3">
              {Array.from({ length: 2 }).map((_, i) => (
                <Skeleton key={i} className="h-40 w-full" />
              ))}
            </div>
          ) : propuestasOrdenadas.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center text-muted-foreground space-y-2">
                <FileText className="h-10 w-10 mx-auto" />
                <p>
                  Aún no se han recibido propuestas.
                  {fechaLimite && (
                    <> La orden vence el {fmtFecha(ordenAny.fecha_limite_propuestas)}.</>
                  )}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {propuestasOrdenadas.map((p: any) => (
                <PropuestaComparativaCard
                  key={p.id}
                  propuesta={p}
                  contrato={contrato}
                  orden={ordenAny}
                  puedeAdjudicar={puedeAdjudicar}
                  adjudicando={adjudicar.isPending}
                  onAdjudicar={(propId) =>
                    adjudicar.mutate({ orden_id: ordenAny.id, propuesta_id: propId })
                  }
                />
              ))}
            </div>
          )}
        </div>

        {/* Notas internas (solo admin) */}
        {isAdmin && ordenAny.notas_admin && (
          <Card>
            <CardContent className="p-4">
              <Collapsible open={notasOpen} onOpenChange={setNotasOpen}>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="w-full justify-between">
                    <span>Notas internas del admin</span>
                    <ChevronDown
                      className={`h-4 w-4 transition-transform ${notasOpen ? "rotate-180" : ""}`}
                    />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <pre className="whitespace-pre-wrap text-sm text-muted-foreground bg-muted/40 rounded p-3 mt-2">
                    {ordenAny.notas_admin}
                  </pre>
                </CollapsibleContent>
              </Collapsible>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default DashboardOrdenServicioDetalle;
