import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertTriangle } from "lucide-react";
import { useMarcarLiquidacionPagada } from "@/hooks/useMarcarLiquidacionPagada";
import type { LiquidacionRow } from "@/types/finanzas";

export const formatCOP = (n: number | null | undefined) =>
  n == null
    ? "—"
    : new Intl.NumberFormat("es-CO", {
        style: "currency",
        currency: "COP",
        maximumFractionDigits: 0,
      }).format(n);

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  liquidacion: LiquidacionRow | null;
}

const METODOS = [
  "Transferencia bancaria",
  "Nequi",
  "Daviplata",
  "Efectivo",
  "Otro",
];

export default function MarcarLiquidacionPagadaDialog({
  open,
  onOpenChange,
  liquidacion,
}: Props) {
  const [metodo, setMetodo] = useState<string>("");
  const [referencia, setReferencia] = useState("");
  const [notas, setNotas] = useState("");
  const mutation = useMarcarLiquidacionPagada();

  useEffect(() => {
    if (open) {
      setMetodo("");
      setReferencia("");
      setNotas("");
    }
  }, [open]);

  if (!liquidacion) return null;

  const onConfirm = () => {
    if (!metodo) return;
    mutation.mutate(
      {
        id: liquidacion.id,
        metodo_pago: metodo,
        referencia_pago: referencia.trim() || undefined,
        notas: notas.trim() || undefined,
      },
      {
        onSuccess: () => onOpenChange(false),
      }
    );
  };

  const lote = liquidacion.orden?.lotes?.nombre_lote ?? "—";
  const tipo = liquidacion.tipo?.nombre ?? "—";
  const experto = liquidacion.experto?.nombre ?? "—";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Registrar pago de liquidación</DialogTitle>
          <DialogDescription>
            Confirma los datos del pago realizado al experto.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 font-body text-sm">
          <div className="rounded-md border bg-muted/30 p-3 space-y-1">
            <div className="flex justify-between gap-3">
              <span className="text-xs text-muted-foreground">Experto</span>
              <span className="text-foreground">{experto}</span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-xs text-muted-foreground">Lote / análisis</span>
              <span className="text-right text-foreground">{lote} · {tipo}</span>
            </div>
            <div className="flex items-center justify-between gap-3 border-t pt-2">
              <span className="text-xs text-muted-foreground">Neto a pagar</span>
              <span className="font-display text-lg font-semibold text-foreground">
                {formatCOP(Number(liquidacion.monto_neto))}
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
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              rows={2}
              placeholder="Observaciones opcionales..."
            />
          </div>

          <div className="flex items-start gap-2 rounded-md border border-amber-300 bg-amber-50 p-3 text-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <p className="text-xs">
              Confirma que YA realizaste la transferencia de{" "}
              <strong>{formatCOP(Number(liquidacion.monto_neto))}</strong> al
              experto antes de marcar como pagada. Esta acción registra el pago
              y notifica al experto.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={mutation.isPending}>
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
