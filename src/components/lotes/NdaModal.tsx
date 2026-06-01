import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { NDA_CONTENIDO } from "@/lib/nda";
import { useFirmarNda } from "@/hooks/useFirmarNda";

interface NdaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loteId: string;
}

const NdaModal = ({ open, onOpenChange, loteId }: NdaModalProps) => {
  const [acepta, setAcepta] = useState(false);
  const { mutate, isPending } = useFirmarNda();

  const handleFirmar = () => {
    mutate(loteId, {
      onSuccess: () => {
        onOpenChange(false);
        setAcepta(false);
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Acuerdo de Confidencialidad y No Elusión — 360Lateral</DialogTitle>
          <DialogDescription>
            Lee y acepta los términos para ver la información identificable de este activo.
            Incluye la obligación de tramitar cualquier negocio exclusivamente a través de 360Lateral.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-72 rounded-md border p-4 bg-muted/30">
          <p className="text-sm whitespace-pre-wrap font-body leading-relaxed">{NDA_CONTENIDO}</p>
        </ScrollArea>

        <div className="flex items-start gap-2 pt-2">
          <Checkbox
            id="acepta-nda"
            checked={acepta}
            onCheckedChange={(v) => setAcepta(v === true)}
          />
          <label htmlFor="acepta-nda" className="text-sm leading-tight cursor-pointer">
            He leído y acepto el Acuerdo de Confidencialidad y No Elusión, incluyendo la
            obligación de tramitar cualquier negocio exclusivamente a través de 360Lateral.
          </label>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            Cancelar
          </Button>
          <Button onClick={handleFirmar} disabled={!acepta || isPending}>
            {isPending ? "Firmando..." : "Aceptar y firmar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default NdaModal;
