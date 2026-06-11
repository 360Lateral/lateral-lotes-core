import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertTriangle } from "lucide-react";
import { useMarcarComisionPagada } from "@/hooks/useMarcarComisionPagada";
import type { ComisionRow } from "@/types/finanzas";

export const formatCOP = (n: number | null | undefined) =>
  n == null
    ? "—"
    : new Intl.NumberFormat("es-CO", {
        style: "currency",
        currency: "COP",
        maximumFractionDigits: 0,
      }).format(Number(n));

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  comision: ComisionRow | null;
}

const METODOS = [
  "Transferencia bancaria",
  "Nequi",
  "Daviplata",
  "Efectivo",
  "Otro",
];

export default function MarcarComisionPagadaDialog({
  open,
  onOpenChange,
  comision,
}: Props) {
  const [metodo, setMetodo] = useState("");
  const [referencia, setReferencia] = useState("");
  const [notas, setNotas] = useState("");
  const mutation = useMarcarComisionPagada();

  useEffect(() => {
    if (open) {
      setMetodo("");
      setReferencia("");
      setNotas("");
    }
  }, [open]);

  if (!comision) return null;

  const onConfirm = () => {
    if (!metodo) return;
    mutation.mutate(
      {
        id: comision.id,
        metodo_pago: metodo,
        referencia_pago: referencia.trim() || undefined,
        notas: notas.trim() || undefined,
      },
      { onSuccess: () => onOpenChange(false) }
    );
  };

  const comisionista = comision.comisionista?.nombre ?? comision.comisionista?.email ?? "—";
  const lote = comision.lote?.nombre_lote ?? "—";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Registrar pago de comisión</DialogTitle>
          <DialogDescription>
            Confirma los datos del pago realizado al comisionista.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 text-sm">
          <div className="rounded-md border bg-muted/30 p-3 space-y-1">
            <div className="flex justify-between gap-3">
              <span className="text-xs text-muted-foreground">Comisionista</span>
              <span className="text-foreground text-right">{comisionista}</span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-xs text-muted-foreground">Lote</span>
              <span className="text-foreground text-right">{lote}</span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-xs text-muted-foreground">Base / %</span>
              <span className="text-foreground text-right">
                {formatCOP(Number(comision.base_calculo))} · {Number(comision.comision_pct)}%
              </span>
            </div>
            <div className="flex items-center justify-between gap-3 border-t pt-2">
              <span className="text-xs text-muted-foreground">Monto comisión</span>
              <span className="font-display text-lg font-semibold text-foreground">
                {formatCOP(Number(comision.comision_monto))}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="metodo">
              Método de pago <span className="text-destructive">*</span>
            </Label>
            <Select value={metodo} onValueChange={setMetodo}>
              <SelectTrigger id="metodo">
                <SelectValue placeholder="Selecciona un método" />
              </SelectTrigger>
              <SelectContent>
                {METODOS.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="referencia">Referencia / comprobante</Label>
            <Input
              id="referencia"
              value={referencia}
              onChange={(e) => setReferencia(e.target.value)}
              placeholder="Nº de transferencia, comprobante..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notas">Notas</Label>
            <Textarea
              id="notas"
              rows={2}
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
            />
          </div>

          <div className="flex items-start gap-2 rounded-md border border-amber-300 bg-amber-50 p-3 text-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <p className="text-xs">
              Confirma que YA realizaste la transferencia de{" "}
              <strong>{formatCOP(Number(comision.comision_monto))}</strong> al
              comisionista antes de marcar como pagada.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={mutation.isPending}
          >
            Cancelar
          </Button>
          <Button onClick={onConfirm} disabled={!metodo || mutation.isPending}>
            {mutation.isPending ? "Registrando..." : "Confirmar pago"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
