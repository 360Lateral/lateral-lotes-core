import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
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
import { AlertTriangle, Handshake, Info } from "lucide-react";
import { useCerrarVenta } from "@/hooks/useCerrarVenta";

export const formatCOP = (n: number | null | undefined) =>
  n == null || isNaN(Number(n))
    ? "—"
    : new Intl.NumberFormat("es-CO", {
        style: "currency",
        currency: "COP",
        maximumFractionDigits: 0,
      }).format(Number(n));

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  negociacion: {
    id: string;
    lote_id: string;
    lote_nombre?: string | null;
    developer_nombre?: string | null;
  } | null;
  onSuccess?: () => void;
}

export default function CerrarVentaDialog({
  open,
  onOpenChange,
  negociacion,
  onSuccess,
}: Props) {
  const [precio, setPrecio] = useState<string>("");
  const [feePct, setFeePct] = useState<string>("2");
  const [compradorExterno, setCompradorExterno] = useState("");
  const [notas, setNotas] = useState("");

  const cerrar = useCerrarVenta();

  useEffect(() => {
    if (open) {
      setPrecio("");
      setFeePct("2");
      setCompradorExterno("");
      setNotas("");
    }
  }, [open]);

  const { data: autorizacionActiva } = useQuery({
    queryKey: ["autorizacion-activa-lote", negociacion?.lote_id],
    enabled: !!negociacion?.lote_id && open,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("autorizaciones_comisionista")
        .select(
          "id, comision_pct, comisionista:perfiles!autorizaciones_comisionista_comisionista_id_fkey(nombre, email)"
        )
        .eq("lote_id", negociacion!.lote_id)
        .eq("estado", "activa")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) return null;
      return data;
    },
  });

  const precioNum = useMemo(() => Number(precio.replace(/\./g, "")) || 0, [precio]);
  const feeNum = useMemo(() => Number(feePct) || 0, [feePct]);
  const feeMonto = useMemo(() => (precioNum * feeNum) / 100, [precioNum, feeNum]);
  const comisionMonto = useMemo(
    () => (autorizacionActiva ? (precioNum * Number(autorizacionActiva.comision_pct)) / 100 : 0),
    [precioNum, autorizacionActiva]
  );

  if (!negociacion) return null;

  const onConfirm = () => {
    if (!precioNum || precioNum <= 0) return;
    cerrar.mutate(
      {
        negociacion_id: negociacion.id,
        precio_venta_final: precioNum,
        fee_360_pct: feeNum,
        comprador_externo: compradorExterno.trim() || undefined,
        notas: notas.trim() || undefined,
      },
      {
        onSuccess: () => {
          onOpenChange(false);
          onSuccess?.();
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Handshake className="h-5 w-5" /> Cerrar venta del lote
          </DialogTitle>
          <DialogDescription>
            Registra el cierre formal de esta negociación.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 text-sm">
          <div className="rounded-md border bg-muted/30 p-3 space-y-1">
            <div className="flex justify-between gap-3">
              <span className="text-xs text-muted-foreground">Lote</span>
              <span className="text-foreground text-right">
                {negociacion.lote_nombre ?? "—"}
              </span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-xs text-muted-foreground">Comprador (developer)</span>
              <span className="text-foreground text-right">
                {negociacion.developer_nombre ?? "—"}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="precio">
              Precio de venta final (COP) <span className="text-destructive">*</span>
            </Label>
            <Input
              id="precio"
              inputMode="numeric"
              placeholder="1000000000"
              value={precio}
              onChange={(e) => setPrecio(e.target.value.replace(/[^0-9]/g, ""))}
            />
            {precioNum > 0 && (
              <p className="text-xs text-muted-foreground">
                = {formatCOP(precioNum)}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="fee">
              Fee 360Lateral (%) <span className="text-destructive">*</span>
            </Label>
            <Input
              id="fee"
              type="number"
              step="0.1"
              min="0"
              max="100"
              value={feePct}
              onChange={(e) => setFeePct(e.target.value)}
            />
            <p className="text-xs">
              Fee 360Lateral:{" "}
              <span className="font-semibold text-foreground">{formatCOP(feeMonto)}</span>
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="comprador-ext">Comprador externo (opcional)</Label>
            <Input
              id="comprador-ext"
              placeholder="Nombre del comprador si no es un developer registrado"
              value={compradorExterno}
              onChange={(e) => setCompradorExterno(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notas-cierre">Notas del cierre</Label>
            <Textarea
              id="notas-cierre"
              rows={2}
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              placeholder="Observaciones opcionales..."
            />
          </div>

          {autorizacionActiva && (
            <div className="flex items-start gap-2 rounded-md border border-primary/30 bg-primary/5 p-3 text-xs">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <div className="space-y-1">
                <p className="text-foreground">
                  Este lote tiene un comisionista autorizado (
                  <strong>{Number(autorizacionActiva.comision_pct)}%</strong> de comisión).
                  Se generará su comisión sobre el precio final.
                </p>
                {precioNum > 0 && (
                  <p className="text-muted-foreground">
                    Comisión estimada:{" "}
                    <strong className="text-foreground">{formatCOP(comisionMonto)}</strong>
                    {" "}para {autorizacionActiva.comisionista?.nombre ?? "—"}
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="flex items-start gap-2 rounded-md border border-amber-300 bg-amber-50 p-3 text-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <p className="text-xs">
              Al cerrar la venta: se registra el negocio, se retira el lote del mercado,
              y si hay un comisionista autorizado se genera su comisión automáticamente.
              El pago del lote ocurre por fuera (notaría) — esto solo registra el cierre.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={cerrar.isPending}
          >
            Cancelar
          </Button>
          <Button
            onClick={onConfirm}
            disabled={!precioNum || precioNum <= 0 || cerrar.isPending}
          >
            {cerrar.isPending ? "Cerrando..." : "Confirmar cierre"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
