import { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
} from "@/components/ui/alert-dialog";
import { Loader2, Lock, MessageSquare, ChevronDown, Send } from "lucide-react";
import { formatRelativeDate } from "@/lib/formatRelativeDate";
import { useFeedbackDetalle } from "@/hooks/feedback/useFeedbackDetalle";
import { useActualizarEstadoFeedback } from "@/hooks/feedback/useActualizarEstadoFeedback";
import { useAsignarFeedback } from "@/hooks/feedback/useAsignarFeedback";
import { useAgregarComentarioFeedback } from "@/hooks/feedback/useAgregarComentarioFeedback";
import { useAsesoresList } from "@/hooks/useAsesoresList";
import {
  ESTADO_LABEL,
  ESTADO_TONO,
  SEVERIDAD_LABEL,
  SEVERIDAD_TONO,
  TIPO_LABEL,
  type EstadoFeedback,
  type SeveridadFeedback,
} from "@/lib/feedback-transitions";
import { cn } from "@/lib/utils";

interface Props {
  ticketId: string | null;
  onClose: () => void;
  modoAdmin?: boolean;
}

const FeedbackDetalle = ({ ticketId, onClose, modoAdmin = false }: Props) => {
  const { data, isLoading } = useFeedbackDetalle(ticketId ?? undefined);
  const actualizarEstado = useActualizarEstadoFeedback();
  const asignar = useAsignarFeedback();
  const agregar = useAgregarComentarioFeedback();
  const { data: asesores = [] } = useAsesoresList();

  const [nuevoMensaje, setNuevoMensaje] = useState("");
  const [visibleUsuario, setVisibleUsuario] = useState(true);
  const [confirmEstado, setConfirmEstado] =
    useState<EstadoFeedback | null>(null);
  const [razonDescarte, setRazonDescarte] = useState("");
  const [duplicadoDe, setDuplicadoDe] = useState("");

  useEffect(() => {
    setNuevoMensaje("");
    setVisibleUsuario(true);
    setRazonDescarte("");
    setDuplicadoDe("");
  }, [ticketId]);

  if (!ticketId) return null;

  const ticket = data?.ticket;
  const comentarios = data?.comentarios ?? [];

  const handleEnviarComentario = () => {
    if (nuevoMensaje.trim().length < 1) return;
    agregar.mutate(
      {
        ticketId,
        mensaje: nuevoMensaje,
        visibleParaUsuario: modoAdmin ? visibleUsuario : true,
      },
      {
        onSuccess: () => {
          setNuevoMensaje("");
        },
      },
    );
  };

  const handleCambiarEstado = (e: EstadoFeedback) => {
    if (e === "descartado" || e === "duplicado" || e === "resuelto") {
      setConfirmEstado(e);
      return;
    }
    actualizarEstado.mutate({ ticketId, estado: e });
  };

  const confirmarCambioEstado = () => {
    if (!confirmEstado) return;
    actualizarEstado.mutate({
      ticketId,
      estado: confirmEstado,
      razon_descarte: confirmEstado === "descartado" ? razonDescarte : null,
      duplicado_de: confirmEstado === "duplicado" ? duplicadoDe || null : null,
    });
    setConfirmEstado(null);
    setRazonDescarte("");
    setDuplicadoDe("");
  };

  return (
    <>
      <Sheet open={!!ticketId} onOpenChange={(v) => !v && onClose()}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-2xl overflow-y-auto"
        >
          <SheetHeader>
            <SheetTitle className="pr-8">
              {isLoading ? "Cargando..." : ticket?.titulo}
            </SheetTitle>
          </SheetHeader>

          {isLoading || !ticket ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="mt-4 space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline">{TIPO_LABEL[ticket.tipo as keyof typeof TIPO_LABEL]}</Badge>
                <Badge className={cn("border-0", SEVERIDAD_TONO[ticket.severidad as SeveridadFeedback])}>
                  {SEVERIDAD_LABEL[ticket.severidad as SeveridadFeedback]}
                </Badge>
                <Badge className={cn("border-0", ESTADO_TONO[ticket.estado as EstadoFeedback])}>
                  {ESTADO_LABEL[ticket.estado as EstadoFeedback]}
                </Badge>
                <span className="text-xs text-muted-foreground ml-auto">
                  {formatRelativeDate(ticket.created_at)}
                </span>
              </div>

              <p className="text-xs text-muted-foreground">
                Reportado por{" "}
                <span className="font-medium text-foreground">
                  {ticket.autor?.nombre ?? "—"}
                </span>
                {ticket.autor?.email ? ` · ${ticket.autor.email}` : ""}
              </p>

              <Tabs defaultValue="info">
                <TabsList>
                  <TabsTrigger value="info">Información</TabsTrigger>
                  <TabsTrigger value="conv">
                    Conversación{" "}
                    <span className="ml-1 text-[10px] text-muted-foreground">
                      ({comentarios.length})
                    </span>
                  </TabsTrigger>
                  {modoAdmin && (
                    <TabsTrigger value="admin">Gestión</TabsTrigger>
                  )}
                </TabsList>

                <TabsContent value="info" className="space-y-3 pt-4">
                  <div>
                    <Label className="text-xs">Descripción</Label>
                    <p className="mt-1 whitespace-pre-wrap rounded-md border bg-muted/30 p-3 text-sm">
                      {ticket.descripcion}
                    </p>
                  </div>
                  {ticket.url_origen && (
                    <div>
                      <Label className="text-xs">URL origen</Label>
                      <a
                        href={ticket.url_origen}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1 block break-all text-xs text-primary hover:underline"
                      >
                        {ticket.url_origen}
                      </a>
                    </div>
                  )}
                  {ticket.info_tecnica && (
                    <Collapsible>
                      <CollapsibleTrigger className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                        <ChevronDown className="h-3 w-3" /> Información técnica
                      </CollapsibleTrigger>
                      <CollapsibleContent className="mt-2">
                        <pre className="overflow-x-auto rounded-md border border-border/60 bg-muted/30 p-2 text-[11px]">
                          {JSON.stringify(ticket.info_tecnica, null, 2)}
                        </pre>
                      </CollapsibleContent>
                    </Collapsible>
                  )}
                  {ticket.razon_descarte && (
                    <div>
                      <Label className="text-xs">Razón de descarte</Label>
                      <p className="mt-1 rounded-md border bg-muted/30 p-2 text-xs">
                        {ticket.razon_descarte}
                      </p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="conv" className="space-y-3 pt-4">
                  <div className="space-y-3 max-h-[40vh] overflow-y-auto pr-1">
                    {comentarios.length === 0 ? (
                      <p className="text-center text-xs text-muted-foreground py-6">
                        Aún no hay comentarios.
                      </p>
                    ) : (
                      comentarios.map((c: any) => (
                        <div
                          key={c.id}
                          className={cn(
                            "rounded-md border p-2 text-sm",
                            c.visible_para_usuario
                              ? "bg-background"
                              : "bg-amber-500/5 border-amber-500/30",
                          )}
                        >
                          <div className="flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
                            <span className="font-medium text-foreground">
                              {c.autor?.nombre ?? "—"}
                            </span>
                            <span className="flex items-center gap-2">
                              {!c.visible_para_usuario && (
                                <span className="inline-flex items-center gap-1 text-amber-700">
                                  <Lock className="h-3 w-3" /> Interno
                                </span>
                              )}
                              {formatRelativeDate(c.created_at)}
                            </span>
                          </div>
                          <p className="mt-1 whitespace-pre-wrap">{c.mensaje}</p>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="space-y-2 border-t pt-3">
                    <Textarea
                      rows={3}
                      value={nuevoMensaje}
                      onChange={(e) => setNuevoMensaje(e.target.value)}
                      placeholder="Escribe una respuesta..."
                    />
                    <div className="flex items-center justify-between gap-2">
                      {modoAdmin ? (
                        <label className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Checkbox
                            checked={visibleUsuario}
                            onCheckedChange={(v) =>
                              setVisibleUsuario(v === true)
                            }
                          />
                          Visible para el usuario
                        </label>
                      ) : (
                        <span className="text-[11px] text-muted-foreground">
                          El equipo recibirá una notificación.
                        </span>
                      )}
                      <Button
                        size="sm"
                        onClick={handleEnviarComentario}
                        disabled={
                          nuevoMensaje.trim().length < 1 || agregar.isPending
                        }
                      >
                        {agregar.isPending ? (
                          <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                        ) : (
                          <Send className="mr-2 h-3 w-3" />
                        )}
                        Enviar
                      </Button>
                    </div>
                  </div>
                </TabsContent>

                {modoAdmin && (
                  <TabsContent value="admin" className="space-y-3 pt-4">
                    <div className="space-y-1">
                      <Label className="text-xs">Estado</Label>
                      <Select
                        value={ticket.estado}
                        onValueChange={(v) =>
                          handleCambiarEstado(v as EstadoFeedback)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {(Object.keys(ESTADO_LABEL) as EstadoFeedback[]).map(
                            (e) => (
                              <SelectItem key={e} value={e}>
                                {ESTADO_LABEL[e]}
                              </SelectItem>
                            ),
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs">Asignado a</Label>
                      <Select
                        value={ticket.asignado_a ?? "__none__"}
                        onValueChange={(v) =>
                          asignar.mutate({
                            ticketId,
                            asignadoA: v === "__none__" ? null : v,
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sin asignar" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__">Sin asignar</SelectItem>
                          {asesores.map((a) => (
                            <SelectItem key={a.id} value={a.id}>
                              {a.nombre}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {ticket.duplicado_de && (
                      <p className="text-xs text-muted-foreground">
                        Duplicado de:{" "}
                        <code className="text-[10px]">
                          {ticket.duplicado_de}
                        </code>
                      </p>
                    )}
                  </TabsContent>
                )}
              </Tabs>
            </div>
          )}
        </SheetContent>
      </Sheet>

      <AlertDialog
        open={!!confirmEstado}
        onOpenChange={(v) => !v && setConfirmEstado(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              ¿Marcar como {confirmEstado ? ESTADO_LABEL[confirmEstado] : ""}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmEstado === "descartado" &&
                "Indica brevemente por qué se descarta este feedback."}
              {confirmEstado === "duplicado" &&
                "Pega el ID del ticket original (opcional)."}
              {confirmEstado === "resuelto" &&
                "Confirma que el feedback fue atendido y resuelto."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {confirmEstado === "descartado" && (
            <Textarea
              value={razonDescarte}
              onChange={(e) => setRazonDescarte(e.target.value)}
              placeholder="Razón (visible para el usuario)"
              rows={3}
            />
          )}
          {confirmEstado === "duplicado" && (
            <Input
              value={duplicadoDe}
              onChange={(e) => setDuplicadoDe(e.target.value)}
              placeholder="UUID del ticket original"
            />
          )}
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmarCambioEstado}>
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default FeedbackDetalle;
