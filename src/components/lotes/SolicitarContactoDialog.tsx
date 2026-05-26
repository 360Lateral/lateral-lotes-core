import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useCrearSolicitudContacto } from "@/hooks/useCrearSolicitudContacto";

const MIN_CHARS = 30;
const MAX_CHARS = 1000;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loteId: string;
  codigoAnonimo: string;
}

const SolicitarContactoDialog = ({ open, onOpenChange, loteId, codigoAnonimo }: Props) => {
  const [mensaje, setMensaje] = useState("");
  const { mutate, isPending } = useCrearSolicitudContacto();

  const handleSend = () => {
    mutate(
      { lote_id: loteId, mensaje: mensaje.trim() },
      {
        onSuccess: () => {
          setMensaje("");
          onOpenChange(false);
        },
      },
    );
  };

  const trimmedLength = mensaje.trim().length;
  const valido = trimmedLength >= MIN_CHARS && trimmedLength <= MAX_CHARS;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Solicitar contacto con el propietario</DialogTitle>
          <DialogDescription>
            360Lateral hará la intermediación con el propietario del lote{" "}
            <span className="font-mono font-semibold">{codigoAnonimo}</span>. Escribe un mensaje
            breve explicando tu interés (qué buscas hacer en el activo, plazo aproximado, datos de
            contacto que prefieres compartir).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Textarea
            placeholder="Hola, estoy interesado en este lote para un proyecto de..."
            value={mensaje}
            onChange={(e) => setMensaje(e.target.value.slice(0, MAX_CHARS))}
            rows={6}
            maxLength={MAX_CHARS}
          />
          <p className="text-xs text-muted-foreground text-right">
            {trimmedLength < MIN_CHARS
              ? `${MIN_CHARS - trimmedLength} caracteres mínimos restantes`
              : `${trimmedLength}/${MAX_CHARS} caracteres`}
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            Cancelar
          </Button>
          <Button onClick={handleSend} disabled={!valido || isPending}>
            {isPending ? "Enviando..." : "Enviar solicitud"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SolicitarContactoDialog;
