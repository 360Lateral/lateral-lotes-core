import { useEffect, useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import type { NivelSuscripcion } from "@/hooks/useNivelSuscripcion";
import { useCambiarNivelSuscripcion } from "@/hooks/useCambiarNivelSuscripcion";

const NIVELES: { value: NivelSuscripcion; label: string }[] = [
  { value: "gratuito", label: "Gratuito" },
  { value: "basico", label: "Básico" },
  { value: "profesional", label: "Profesional" },
  { value: "premium", label: "Premium" },
];

export const NIVEL_BADGE_CLASS: Record<string, string> = {
  gratuito: "bg-muted text-muted-foreground border-muted",
  basico: "bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-950 dark:text-blue-300",
  profesional: "bg-green-100 text-green-700 border-green-300 dark:bg-green-950 dark:text-green-300",
  premium: "bg-amber-100 text-amber-800 border-amber-400 dark:bg-amber-950 dark:text-amber-300",
};

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  usuario: {
    id: string;
    nombre: string | null;
    email: string;
    nivel_suscripcion: NivelSuscripcion;
  } | null;
}

const CambiarNivelDialog = ({ open, onOpenChange, usuario }: Props) => {
  const [nivelSel, setNivelSel] = useState<NivelSuscripcion>("gratuito");
  const [motivo, setMotivo] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const mut = useCambiarNivelSuscripcion();

  useEffect(() => {
    if (open && usuario) {
      setNivelSel(usuario.nivel_suscripcion);
      setMotivo("");
    }
  }, [open, usuario]);

  if (!usuario) return null;

  const cambio = nivelSel !== usuario.nivel_suscripcion;

  const handleConfirm = async () => {
    try {
      await mut.mutateAsync({
        desarrollador_id: usuario.id,
        nivel_nuevo: nivelSel,
        motivo: motivo.trim() || undefined,
      });
      setConfirmOpen(false);
      onOpenChange(false);
    } catch {
      setConfirmOpen(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Cambiar nivel de suscripción</DialogTitle>
            <DialogDescription>
              {usuario.nombre || "Sin nombre"} · {usuario.email}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Nivel actual:</span>
              <Badge variant="outline" className={NIVEL_BADGE_CLASS[usuario.nivel_suscripcion]}>
                {usuario.nivel_suscripcion}
              </Badge>
            </div>

            <div className="space-y-2">
              <Label>Nuevo nivel</Label>
              <Select value={nivelSel} onValueChange={(v) => setNivelSel(v as NivelSuscripcion)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {NIVELES.map((n) => (
                    <SelectItem key={n.value} value={n.value}>{n.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Motivo (opcional)</Label>
              <Textarea
                maxLength={200}
                placeholder="Ej: Pago recibido por transferencia 23/05/2026"
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
              />
              <p className="text-[10px] text-muted-foreground text-right">{motivo.length}/200</p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button
              disabled={!cambio || mut.isPending}
              onClick={() => setConfirmOpen(true)}
            >
              Guardar cambio
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar cambio de nivel</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Confirmas cambiar el nivel de <strong>{usuario.nombre || usuario.email}</strong> de{" "}
              <strong>{usuario.nivel_suscripcion}</strong> a <strong>{nivelSel}</strong>?
              Esto le notificará por mensaje in-app.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={mut.isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={(e) => { e.preventDefault(); handleConfirm(); }} disabled={mut.isPending}>
              {mut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sí, cambiar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default CambiarNivelDialog;
