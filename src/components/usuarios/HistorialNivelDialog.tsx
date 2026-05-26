import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Loader2, History } from "lucide-react";
import { useHistorialNivel } from "@/hooks/useHistorialNivel";
import { NIVEL_BADGE_CLASS } from "./CambiarNivelDialog";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  usuario: { id: string; nombre: string | null; email: string } | null;
}

const ORIGEN_LABEL: Record<string, string> = {
  admin_manual: "Admin manual",
  wompi_webhook: "Pago Wompi",
  sistema: "Sistema",
};

const HistorialNivelDialog = ({ open, onOpenChange, usuario }: Props) => {
  const { data, isLoading } = useHistorialNivel(usuario?.id);

  if (!usuario) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Historial de cambios de nivel</DialogTitle>
          <DialogDescription>
            {usuario.nombre || "Sin nombre"} · {usuario.email}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : !data || data.length === 0 ? (
          <div className="flex flex-col items-center py-12 text-muted-foreground">
            <History className="mb-2 h-8 w-8" />
            <p className="text-sm">No hay cambios registrados todavía</p>
          </div>
        ) : (
          <div className="space-y-3">
            {data.map((entry) => (
              <div key={entry.id} className="rounded-lg border border-border p-3 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-sm">
                    {entry.nivel_anterior ? (
                      <Badge variant="outline" className={NIVEL_BADGE_CLASS[entry.nivel_anterior]}>
                        {entry.nivel_anterior}
                      </Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                    <span className="text-muted-foreground">→</span>
                    <Badge variant="outline" className={NIVEL_BADGE_CLASS[entry.nivel_nuevo]}>
                      {entry.nivel_nuevo}
                    </Badge>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(entry.created_at).toLocaleString("es-CO")}
                  </span>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  <span>
                    <strong>Por:</strong>{" "}
                    {entry.cambiado_por_perfil?.nombre || entry.cambiado_por_perfil?.email || "Sistema"}
                  </span>
                  <span>
                    <strong>Origen:</strong> {ORIGEN_LABEL[entry.origen] ?? entry.origen}
                  </span>
                </div>
                {entry.motivo && (
                  <p className="text-xs text-foreground/80 italic">"{entry.motivo}"</p>
                )}
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default HistorialNivelDialog;
