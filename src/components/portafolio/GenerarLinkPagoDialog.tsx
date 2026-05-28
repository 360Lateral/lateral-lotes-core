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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useGenerarPagoWompi } from "@/hooks/useGenerarPagoWompi";
import { usePlanesConPrecio } from "@/hooks/usePlanesConPrecio";
import { toast } from "sonner";
import { Copy, ExternalLink, Info, Loader2, CheckCircle2 } from "lucide-react";

interface EngagementLike {
  id: string;
  plan_id: string | null;
  estado_activacion: string | null;
  lote: { nombre_lote: string | null } | null;
  plan: { nombre: string; codigo?: string } | null;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  engagement: EngagementLike;
}

const formatCOP = (n: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(n);

export default function GenerarLinkPagoDialog({ open, onOpenChange, engagement }: Props) {
  const { data: planes } = usePlanesConPrecio();
  const generar = useGenerarPagoWompi();
  const [resultado, setResultado] = useState<{ url: string; reused?: boolean } | null>(null);

  const plan = planes?.find((p) => p.id === engagement.plan_id);
  const estado = engagement.estado_activacion ?? "activo";
  const yaActivo = estado === "activo";

  const handleGenerar = async () => {
    try {
      const data = await generar.mutateAsync(engagement.id);
      setResultado({ url: data.payment_url, reused: data.reused });
    } catch {
      // toast handled by hook
    }
  };

  const handleCopy = async () => {
    if (!resultado?.url) return;
    await navigator.clipboard.writeText(resultado.url);
    toast.success("URL copiada al portapapeles");
  };

  const handleClose = () => {
    setResultado(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => (v ? onOpenChange(v) : handleClose())}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Generar link de pago</DialogTitle>
          <DialogDescription>
            {engagement.lote?.nombre_lote ?? "Lote"} · {plan?.nombre ?? "Plan"}
            {plan ? ` · ${formatCOP(plan.precio_cop_actual)}` : ""}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-md border bg-muted/30 p-4 font-body text-sm">
            <h4 className="mb-2 font-semibold">Resumen</h4>
            <dl className="space-y-1 text-muted-foreground">
              <div className="flex justify-between gap-2">
                <dt>Lote</dt>
                <dd className="text-right text-foreground">
                  {engagement.lote?.nombre_lote ?? "—"}
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt>Plan</dt>
                <dd className="text-right text-foreground">
                  {plan?.nombre ?? engagement.plan?.nombre ?? "—"}
                  {plan ? ` (${plan.precio_smlmv} SMLMV)` : ""}
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt>Precio</dt>
                <dd className="text-right text-foreground">
                  {plan ? formatCOP(plan.precio_cop_actual) : "—"}
                  {plan ? (
                    <span className="ml-1 text-xs text-muted-foreground">
                      (SMLMV {plan.smlmv_anio})
                    </span>
                  ) : null}
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt>SLA al activar</dt>
                <dd className="text-right text-foreground">
                  {plan ? `${plan.dias_sla} días` : "—"}
                </dd>
              </div>
            </dl>
          </div>

          {yaActivo ? (
            <div className="flex items-start gap-2 rounded-md border border-green-300 bg-green-50 p-3 text-sm text-green-900 dark:bg-green-950/30 dark:text-green-200">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
              <p>Este engagement ya está activo. No requiere pago.</p>
            </div>
          ) : !resultado ? (
            <Button
              className="w-full"
              onClick={handleGenerar}
              disabled={generar.isPending || !plan}
            >
              {generar.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Generar link de pago Wompi
            </Button>
          ) : (
            <div className="space-y-3">
              {resultado.reused && (
                <div className="flex items-start gap-2 rounded-md border border-blue-300 bg-blue-50 p-3 text-xs text-blue-900 dark:bg-blue-950/30 dark:text-blue-200">
                  <Info className="mt-0.5 h-4 w-4 shrink-0" />
                  <p>Ya había un link pendiente para este engagement — reutilizando el mismo.</p>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="payment-url">URL de pago</Label>
                <div className="flex gap-2">
                  <Input
                    id="payment-url"
                    readOnly
                    value={resultado.url}
                    onFocus={(e) => e.currentTarget.select()}
                    className="font-mono text-xs"
                  />
                  <Button type="button" variant="outline" size="icon" onClick={handleCopy} title="Copiar">
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => window.open(resultado.url, "_blank")}
                    title="Abrir en pestaña nueva"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Envíaselo al propietario por WhatsApp o email. Cuando pague, el engagement
                se activará automáticamente.
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
