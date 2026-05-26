import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookOpen, Presentation, ExternalLink, Plus, Loader2 } from "lucide-react";
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
        subtitulo="Slides del diagnóstico (Gamma)"
        icono={<Presentation className="h-6 w-6" />}
        ctaTexto="Agregar link Gamma"
      />
    </div>
  );
};

export default TarjetasMaestros;
