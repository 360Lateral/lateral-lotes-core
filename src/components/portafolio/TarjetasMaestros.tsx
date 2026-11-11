import { useRef, useState } from "react";
import { toast } from "sonner";
import { useNuevaVersionEntregable } from "@/hooks/useNuevaVersionEntregable";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookOpen, Presentation, ExternalLink, Plus, Loader2, FileUp } from "lucide-react";
import type { Entregable, TipoEntregable } from "@/hooks/useEntregablesEngagement";
import { useActualizarEntregable } from "@/hooks/useActualizarEntregable";
import SubirEntregableDialog from "@/components/entregables/SubirEntregableDialog";

interface Props {
  engagementId: string;
  diagnostico?: Entregable;
  presentacion?: Entregable;
  puedeSubir: boolean;
}

const fmtFechaRelativa = (iso: string) => {
  const diffMs = Date.now() - new Date(iso).getTime();
  const dias = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (dias <= 0) return "hoy";
  if (dias === 1) return "ayer";
  if (dias < 30) return `hace ${dias} días`;
  const meses = Math.floor(dias / 30);
  if (meses === 1) return "hace 1 mes";
  return `hace ${meses} meses`;
};

interface TarjetaProps {
  engagementId: string;
  entregable?: Entregable;
  puedeSubir: boolean;
  tipo: TipoEntregable;
  titulo: string;
  subtitulo: string;
  icono: React.ReactNode;
  ctaTexto: string;
}

const TarjetaMaestro = ({
  engagementId,
  entregable,
  puedeSubir,
  tipo,
  titulo,
  subtitulo,
  icono,
  ctaTexto,
}: TarjetaProps) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const actualizar = useActualizarEntregable();
  const nuevaVersion = useNuevaVersionEntregable();
  const fileRef = useRef<HTMLInputElement>(null);
  const [abriendo, setAbriendo] = useState(false);

  // Nombre legible del archivo: quita la carpeta y el prefijo de fecha.
  const nombreArchivo = entregable?.storage_path
    ? entregable.storage_path.split("/").pop()!.replace(/^\d+_/, "")
    : null;

  const abrirArchivo = async () => {
    if (!entregable?.storage_path) return;
    // Abre la pestaña de inmediato para que el navegador no la bloquee.
    const pestana = window.open("", "_blank");
    try {
      setAbriendo(true);
      // Enlace firmado de 10 minutos. El almacenamiento solo lo permite al
      // equipo interno (los clientes solo acceden a entregables publicados).
      const { data, error } = await supabase.storage
        .from("entregables-clientes")
        .createSignedUrl(entregable.storage_path, 600);
      if (error || !data?.signedUrl) throw error ?? new Error("sin enlace");
      if (pestana) {
        pestana.opener = null;
        pestana.location.href = data.signedUrl;
      } else {
        window.open(data.signedUrl, "_blank", "noopener,noreferrer");
      }
    } catch {
      pestana?.close();
      toast.error("No se pudo abrir el archivo. Verifica tu sesión e inténtalo de nuevo.");
    } finally {
      setAbriendo(false);
    }
  };

  const handleReemplazar = (file: File | null) => {
    if (!file || !entregable) return;
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      toast.error("Solo se permiten archivos PDF");
      return;
    }
    if (file.size > 25 * 1024 * 1024) {
      toast.error("El archivo supera el máximo de 25MB");
      return;
    }
    // Nueva versión en borrador; la anterior queda archivada (no se borra).
    nuevaVersion.mutate({ entregableAnteriorId: entregable.id, archivo: file, publicar: false });
  };

  const publicado = entregable && entregable.estado === "publicado";
  const borrador = entregable && entregable.estado === "borrador";

  const handlePublicar = () => {
    if (!entregable) return;
    actualizar.mutate({
      entregableId: entregable.id,
      engagementId,
      cambios: { estado: "publicado" },
    });
  };

  const abrirEnDrive = () => {
    if (entregable?.url_externa) {
      window.open(entregable.url_externa, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <>
      <Card className="flex flex-col gap-4 p-5">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
            {icono}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-display text-base font-semibold text-foreground">
              {titulo}
            </h3>
            <p className="font-body text-xs text-muted-foreground">{subtitulo}</p>
          </div>
          {publicado && (
            <Badge className="bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/15 border border-emerald-500/30">
              Publicado
            </Badge>
          )}
          {borrador && (
            <Badge className="bg-yellow-500/15 text-yellow-700 hover:bg-yellow-500/15 border border-yellow-500/30">
              Borrador
            </Badge>
          )}
          {!entregable && (
            <Badge variant="outline" className="text-muted-foreground">
              Pendiente
            </Badge>
          )}
        </div>

        {entregable && (
          <p className="font-body text-xs text-muted-foreground">
            {publicado ? "Publicado" : "Subido"} por{" "}
            {entregable.subido_por_perfil?.nombre ?? "—"} ·{" "}
            {fmtFechaRelativa(entregable.updated_at ?? entregable.created_at)}
          </p>
        )}

        {borrador && nombreArchivo && (
          <p className="break-all font-body text-sm text-foreground">
            {nombreArchivo}{" "}
            <span className="text-muted-foreground">(v{entregable!.version})</span>
          </p>
        )}

        {borrador && (
          <p className="font-body text-xs text-yellow-700">
            No visible para el cliente hasta publicar.
          </p>
        )}

        <div className="mt-auto flex flex-wrap items-center gap-2 pt-2">
          {entregable && entregable.url_externa && (
            <Button
              variant={publicado ? "default" : "outline"}
              size="sm"
              onClick={abrirEnDrive}
              aria-label={`Abrir ${titulo} en Drive`}
            >
              <ExternalLink className="h-4 w-4" />
              Abrir en Drive
            </Button>
          )}
          {borrador && nombreArchivo && (
            <Button
              size="sm"
              variant="outline"
              onClick={abrirArchivo}
              disabled={abriendo}
              aria-label={`Abrir archivo de ${titulo}`}
            >
              {abriendo ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ExternalLink className="h-4 w-4" />
              )}
              Abrir archivo
            </Button>
          )}
          {borrador && (
            <Button
              size="sm"
              onClick={handlePublicar}
              disabled={actualizar.isPending}
              aria-label={`Publicar ${titulo}`}
            >
              {actualizar.isPending && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              Publicar
            </Button>
          )}
          {borrador && puedeSubir && (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={() => fileRef.current?.click()}
                disabled={nuevaVersion.isPending}
                aria-label={`Reemplazar ${titulo} por archivo`}
              >
                {nuevaVersion.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <FileUp className="h-4 w-4" />
                )}
                Reemplazar por archivo
              </Button>
              <input
                ref={fileRef}
                type="file"
                accept="application/pdf,.pdf"
                className="hidden"
                onChange={(ev) => {
                  handleReemplazar(ev.target.files?.[0] ?? null);
                  ev.target.value = "";
                }}
              />
            </>
          )}
          {!entregable && puedeSubir && (
            <Button
              size="sm"
              onClick={() => setDialogOpen(true)}
              aria-label={`Agregar ${titulo}`}
            >
              <Plus className="h-4 w-4" />
              {ctaTexto}
            </Button>
          )}
          {!entregable && !puedeSubir && (
            <p className="font-body text-xs text-muted-foreground">
              Aún no se ha entregado.
            </p>
          )}
        </div>
      </Card>

      {puedeSubir && (
        <SubirEntregableDialog
          engagementId={engagementId}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          tipoForzado={tipo}
          tabInicial="url"
        />
      )}
    </>
  );
};

const TarjetasMaestros = ({
  engagementId,
  diagnostico,
  presentacion,
  puedeSubir,
}: Props) => {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <TarjetaMaestro
        engagementId={engagementId}
        entregable={diagnostico}
        puedeSubir={puedeSubir}
        tipo="diagnostico_inmobiliario"
        titulo="Diagnóstico Inmobiliario"
        subtitulo="Informe integrador del análisis del lote"
        icono={<BookOpen className="h-6 w-6" />}
        ctaTexto="Agregar link Drive"
      />
      <TarjetaMaestro
        engagementId={engagementId}
        entregable={presentacion}
        puedeSubir={puedeSubir}
        tipo="presentacion_diagnostico"
        titulo="Presentación del Diagnóstico"
        subtitulo="Página web con la presentación del activo (Gamma, Canva, Google Slides, etc.)"
        icono={<Presentation className="h-6 w-6" />}
        ctaTexto="Agregar link de la presentación"
      />
    </div>
  );
};

export default TarjetasMaestros;
