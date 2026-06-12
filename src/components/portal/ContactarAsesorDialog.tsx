import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { useEnviarMensajeAsesor } from "@/hooks/cliente/useEnviarMensajeAsesor";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  engagementId: string;
  asesorId: string | null;
  asesorNombre: string | null;
}

const MAX_TEMA = 120;
const MAX_MENSAJE = 2000;

const ContactarAsesorDialog = ({
  open,
  onOpenChange,
  engagementId,
  asesorId,
  asesorNombre,
}: Props) => {
  const [tema, setTema] = useState("");
  const [mensaje, setMensaje] = useState("");
  const enviar = useEnviarMensajeAsesor();

  const handleEnviar = async () => {
    const m = mensaje.trim();
    if (!m) return;
    try {
      await enviar.mutateAsync({
        engagementId,
        destinatarioId: asesorId,
        tema: tema.trim().slice(0, MAX_TEMA),
        mensaje: m.slice(0, MAX_MENSAJE),
      });
      setTema("");
      setMensaje("");
      onOpenChange(false);
    } catch {
      /* toast manejado en el hook */
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Contactar a {asesorNombre ?? "tu asesor"}</DialogTitle>
          <DialogDescription>
            Tu mensaje queda registrado en el engagement. Te responderemos por este canal o por correo.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="tema">Tema (opcional)</Label>
            <Input
              id="tema"
              value={tema}
              onChange={(e) => setTema(e.target.value)}
              maxLength={MAX_TEMA}
              placeholder="Ej. Duda sobre el análisis ambiental"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="mensaje">Mensaje</Label>
            <Textarea
              id="mensaje"
              value={mensaje}
              onChange={(e) => setMensaje(e.target.value)}
              maxLength={MAX_MENSAJE}
              placeholder="Escribe tu consulta aquí..."
              rows={5}
            />
            <p className="text-right text-xs text-muted-foreground">
              {mensaje.length}/{MAX_MENSAJE}
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={enviar.isPending}>
            Cancelar
          </Button>
          <Button onClick={handleEnviar} disabled={enviar.isPending || !mensaje.trim()}>
            {enviar.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {enviar.isPending ? "Enviando..." : "Enviar mensaje"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ContactarAsesorDialog;
