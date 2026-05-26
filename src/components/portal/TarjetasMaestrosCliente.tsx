import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  FileText,
  Presentation,
  ExternalLink,
  Loader2,
  Hourglass,
} from "lucide-react";
import type { EntregablePublicado } from "@/hooks/cliente/useEngagementCliente";
import { useDescargarEntregable } from "@/hooks/cliente/useDescargarEntregable";
import { toast } from "@/hooks/use-toast";

interface Props {
  diagnostico?: EntregablePublicado;
  presentacion?: EntregablePublicado;
}

const formatoFecha = (fecha?: string | null) => {
  if (!fecha) return "—";
  return new Date(fecha).toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

interface TarjetaProps {
  entregable?: EntregablePublicado;
  titulo: string;
  subtitulo: string;
  ctaTexto: string;
  icono: React.ReactNode;
}

const Tarjeta = ({ entregable, titulo, subtitulo, ctaTexto, icono }: TarjetaProps) => {
  const { descargar } = useDescargarEntregable();
  const [loading, setLoading] = useState(false);

  const handleAbrir = async () => {
    if (!entregable) return;
    setLoading(true);
    try {
      const url = await descargar(entregable.id);
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
    <Card className="h-full">
      <CardContent className="flex h-full flex-col gap-4 p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            {icono}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-lg font-semibold tracking-tight">{titulo}</h3>
            <p className="text-sm text-muted-foreground">{subtitulo}</p>
          </div>
        </div>

        <div className="mt-auto space-y-2">
          {entregable ? (
            <>
              <Button
                onClick={handleAbrir}
                disabled={loading}
                size="lg"
                className="w-full"
                aria-label={ctaTexto}
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ExternalLink className="h-4 w-4" />
                )}
                {ctaTexto}
              </Button>
              <p className="text-xs text-muted-foreground">
                Entregado el {formatoFecha(entregable.updated_at ?? entregable.created_at)}
              </p>
            </>
          ) : (
            <div className="flex items-start gap-2 rounded-md border border-dashed border-border bg-muted/30 p-3 text-sm text-muted-foreground">
              <Hourglass className="mt-0.5 h-4 w-4 shrink-0" />
              <span>Aún no está disponible. Te avisaremos cuando esté listo.</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

const TarjetasMaestrosCliente = ({ diagnostico, presentacion }: Props) => {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <Tarjeta
        entregable={diagnostico}
        titulo="Diagnóstico Inmobiliario"
        subtitulo="Tu informe integrador"
        ctaTexto="Abrir Diagnóstico"
        icono={<FileText className="h-7 w-7" />}
      />
      <Tarjeta
        entregable={presentacion}
        titulo="Presentación del Diagnóstico"
        subtitulo="Slides resumen"
        ctaTexto="Abrir Presentación"
        icono={<Presentation className="h-7 w-7" />}
      />
    </div>
  );
};

export default TarjetasMaestrosCliente;
