import { useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  MoreVertical,
  ExternalLink,
  Eye,
  EyeOff,
  History,
  StickyNote,
  Archive,
  Pencil,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import EstadoEntregableBadge from "./EstadoEntregableBadge";
import TipoEntregableIcon from "./TipoEntregableIcon";
import type { Entregable } from "@/hooks/useEntregablesEngagement";
import { useActualizarEntregable } from "@/hooks/useActualizarEntregable";
import { useNuevaVersionEntregable } from "@/hooks/useNuevaVersionEntregable";
import { useFirmarUrlEntregable } from "@/hooks/useFirmarUrlEntregable";

interface Props {
  entregable: Entregable;
}

const formatTamano = (bytes: number | null) => {
  if (!bytes) return null;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const formatFecha = (iso: string) =>
  new Date(iso).toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

const TIPO_LABELS: Record<Entregable["tipo"], string> = {
  informe_final_pdf: "Informe Final PDF",
  presentacion_gamma: "Presentación",
  informe_area: "Informe por área",
  documento_soporte: "Documento soporte",
  otro: "Otro",
};

const EntregableItem = ({ entregable: e }: Props) => {
  const actualizar = useActualizarEntregable();
  const nuevaVersion = useNuevaVersionEntregable();
  const { firmar } = useFirmarUrlEntregable();
  const fileRef = useRef<HTMLInputElement>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [notasEdit, setNotasEdit] = useState(e.notas ?? "");
  const [archivarOpen, setArchivarOpen] = useState(false);
  const [abriendo, setAbriendo] = useState(false);

  const tamano = formatTamano(e.tamano_bytes);
  const isArchivado = e.estado === "archivado";
  const isPublicado = e.estado === "publicado";

  const handleVer = async () => {
    try {
      setAbriendo(true);
      const url = await firmar(e.id);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (err: any) {
      toast.error(err?.message ?? "No se pudo abrir");
    } finally {
      setAbriendo(false);
    }
  };

  const togglePublicar = () => {
    actualizar.mutate({
      entregableId: e.id,
      engagementId: e.engagement_id,
      cambios: { estado: isPublicado ? "borrador" : "publicado" },
    });
  };

  const handleArchivar = () => {
    actualizar.mutate({
      entregableId: e.id,
      engagementId: e.engagement_id,
      cambios: { estado: "archivado" },
    });
    setArchivarOpen(false);
  };

  const handleNuevaVersion = (file: File | null) => {
    if (!file) return;
    if (file.size > 25 * 1024 * 1024) {
      toast.error("El archivo supera el máximo de 25MB");
      return;
    }
    nuevaVersion.mutate({ entregableAnteriorId: e.id, archivo: file });
  };

  const handleGuardarNotas = () => {
    actualizar.mutate(
      {
        entregableId: e.id,
        engagementId: e.engagement_id,
        cambios: { notas: notasEdit.trim() || null },
      },
      { onSuccess: () => setEditOpen(false) },
    );
  };

  return (
    <>
      <Card
        className={`flex items-start gap-3 p-3 sm:gap-4 sm:p-4 ${
          isArchivado ? "opacity-60" : ""
        } ${isPublicado ? "border-l-4 border-l-emerald-500" : ""}`}
      >
        <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
          <TipoEntregableIcon tipo={e.tipo} size={20} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <p className="truncate font-semibold text-foreground">
              {e.nombre}{" "}
              <span className="font-normal text-muted-foreground">(v{e.version})</span>
            </p>
            {e.url_externa && (
              <ExternalLink size={14} className="text-muted-foreground" />
            )}
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {TIPO_LABELS[e.tipo]}
            {tamano && ` · ${tamano}`}
            {" · Subido por "}
            {e.subido_por_perfil?.nombre ?? "—"}
            {" el "}
            {formatFecha(e.created_at)}
          </p>
          {e.notas && (
            <p className="mt-1 flex items-start gap-1 text-xs text-muted-foreground">
              <StickyNote size={12} className="mt-0.5 shrink-0" />
              <span>{e.notas}</span>
            </p>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <EstadoEntregableBadge estado={e.estado} />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical size={16} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuItem onClick={handleVer} disabled={abriendo}>
                {abriendo ? (
                  <Loader2 className="mr-2 animate-spin" size={14} />
                ) : (
                  <Eye className="mr-2" size={14} />
                )}
                Ver / Descargar
              </DropdownMenuItem>
              {!isArchivado && (
                <DropdownMenuItem onClick={togglePublicar}>
                  {isPublicado ? (
                    <>
                      <EyeOff className="mr-2" size={14} /> Despublicar
                    </>
                  ) : (
                    <>
                      <Eye className="mr-2" size={14} /> Publicar
                    </>
                  )}
                </DropdownMenuItem>
              )}
              {e.storage_path && !isArchivado && (
                <DropdownMenuItem onClick={() => fileRef.current?.click()}>
                  <History className="mr-2" size={14} /> Subir nueva versión
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => { setNotasEdit(e.notas ?? ""); setEditOpen(true); }}>
                <Pencil className="mr-2" size={14} /> Editar notas
              </DropdownMenuItem>
              {!isArchivado && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => setArchivarOpen(true)}
                    className="text-destructive"
                  >
                    <Archive className="mr-2" size={14} /> Archivar
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
          <input
            ref={fileRef}
            type="file"
            accept="application/pdf,image/*"
            className="hidden"
            onChange={(ev) => {
              handleNuevaVersion(ev.target.files?.[0] ?? null);
              ev.target.value = "";
            }}
          />
        </div>
      </Card>

      <AlertDialog open={archivarOpen} onOpenChange={setArchivarOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Archivar este entregable?</AlertDialogTitle>
            <AlertDialogDescription>
              Quedará oculto para el cliente y para futuras consultas activas.
              Puedes seguir viéndolo en el historial.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleArchivar}>Archivar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar notas</DialogTitle>
          </DialogHeader>
          <Textarea
            value={notasEdit}
            onChange={(ev) => setNotasEdit(ev.target.value)}
            rows={4}
            placeholder="Notas internas (no las ve el cliente)"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleGuardarNotas} disabled={actualizar.isPending}>
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default EntregableItem;
