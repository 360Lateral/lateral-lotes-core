import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail, FileText, Check, X, TrendingUp } from "lucide-react";
import type { NivelUsuario } from "@/hooks/useLoteDetalle";
import { formatCOP } from "@/lib/format-moneda";

interface Props {
  precioEstimado: number | null | undefined;
  nivel: NivelUsuario;
  ndaFirmado: boolean;
  accesoCompleto: boolean;
  onSolicitarContacto: () => void;
  onGenerarPdf: () => void;
  puedeSolicitar: boolean;
  solicitudPendiente?: boolean;
}

const labelNivel: Record<NivelUsuario, string> = {
  gratuito: "Gratuito",
  basico: "Básico",
  profesional: "Profesional",
  premium: "Premium",
};

export const SidebarStickyLote = ({
  precioEstimado,
  nivel,
  ndaFirmado,
  accesoCompleto,
  onSolicitarContacto,
  onGenerarPdf,
  puedeSolicitar,
  solicitudPendiente,
}: Props) => {
  const verPrecio = accesoCompleto || (nivel === "premium" && ndaFirmado);

  return (
    <div className="lg:sticky lg:top-24">
      <Card className="p-5 space-y-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground font-medium">
            Precio estimado
          </p>
          <p className="text-3xl font-bold text-secondary mt-1">
            {verPrecio ? formatCOP(precioEstimado ?? null) : "—"}
          </p>
          {verPrecio && precioEstimado != null && (
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              <TrendingUp className="h-3 w-3" /> Valoración premium 360°
            </p>
          )}
          {!verPrecio && (
            <p className="text-xs text-muted-foreground mt-1">
              Precio disponible con plan Premium + NDA
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Button
            className="w-full"
            onClick={onSolicitarContacto}
            disabled={!puedeSolicitar || solicitudPendiente}
          >
            <Mail className="h-4 w-4 mr-2" />
            {solicitudPendiente ? "Solicitud pendiente" : "Solicitar contacto"}
          </Button>
          <Button variant="outline" className="w-full" onClick={onGenerarPdf}>
            <FileText className="h-4 w-4 mr-2" />
            Ver ficha PDF
          </Button>
        </div>

        <div className="border-t pt-3 space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Tu nivel</span>
            <span className="font-medium capitalize">{labelNivel[nivel]}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">NDA firmado</span>
            <span className="font-medium flex items-center gap-1">
              {ndaFirmado ? (
                <>
                  <Check className="h-3.5 w-3.5 text-green-600" /> Sí
                </>
              ) : (
                <>
                  <X className="h-3.5 w-3.5 text-muted-foreground" /> No
                </>
              )}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Acceso</span>
            <span className="font-medium">{accesoCompleto ? "Completo" : "Parcial"}</span>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default SidebarStickyLote;
