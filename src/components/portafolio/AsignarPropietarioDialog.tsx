import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  usePropietariosList,
  useAsignarPropietario,
} from "@/hooks/useAsignarPropietario";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  loteId: string | null;
  loteName?: string;
}

const AsignarPropietarioDialog = ({ open, onOpenChange, loteId, loteName }: Props) => {
  const { data: propietarios = [], isLoading } = usePropietariosList();
  const asignar = useAsignarPropietario();
  const [sel, setSel] = useState<string>("");

  const onConfirm = () => {
    if (!loteId || !sel) return;
    asignar.mutate(
      { lote_id: loteId, propietario_id: sel },
      {
        onSuccess: () => {
          setSel("");
          onOpenChange(false);
        },
      }
    );
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o);
        if (!o) setSel("");
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Asignar propietario</DialogTitle>
          <DialogDescription>
            {loteName ? `Lote: ${loteName}` : "Selecciona el propietario para este lote."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Select value={sel} onValueChange={setSel} disabled={isLoading}>
            <SelectTrigger>
              <SelectValue placeholder={isLoading ? "Cargando…" : "Selecciona un propietario"} />
            </SelectTrigger>
            <SelectContent>
              {propietarios.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.nombre || p.email || p.id}
                  {p.email && p.nombre ? (
                    <span className="text-muted-foreground"> — {p.email}</span>
                  ) : null}
                </SelectItem>
              ))}
              {!isLoading && propietarios.length === 0 && (
                <div className="px-3 py-2 text-sm text-muted-foreground">
                  No hay usuarios con rol propietario.
                </div>
              )}
            </SelectContent>
          </Select>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={onConfirm} disabled={!sel || asignar.isPending}>
            {asignar.isPending ? "Asignando…" : "Asignar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AsignarPropietarioDialog;
