import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useCrearPropuesta } from "@/hooks/useCrearPropuesta";
import { formatCOP } from "@/lib/format-moneda";

interface Contrato {
  version: string;
  precio_min: number;
  precio_max: number;
  plazo_min_dias: number;
  plazo_max_dias: number;
  moneda: string;
  contenido_legal?: string;
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  orden: any;
  contratoCompleto?: Contrato;
}

const PostularmeDialog = ({ open, onOpenChange, orden, contratoCompleto }: Props) => {
  const contrato: Contrato = contratoCompleto ?? orden?.contrato ?? {};
  const [aceptado, setAceptado] = useState(false);
  const [legalOpen, setLegalOpen] = useState(false);
  const crear = useCrearPropuesta();

  const schema = useMemo(() => {
    const pmin = Number(contrato.precio_min ?? 0);
    const pmax = Number(contrato.precio_max ?? Number.MAX_SAFE_INTEGER);
    const dmin = Number(contrato.plazo_min_dias ?? 0);
    const dmax = Number(contrato.plazo_max_dias ?? 365);
    return z.object({
      precio_propuesto: z
        .number({ invalid_type_error: "Ingresa un precio" })
        .min(pmin, `Mínimo ${formatCOP(pmin)}`)
        .max(pmax, `Máximo ${formatCOP(pmax)}`),
      plazo_propuesto_dias: z
        .number({ invalid_type_error: "Ingresa un plazo" })
        .int("Debe ser un número entero")
        .min(dmin, `Mínimo ${dmin} días`)
        .max(dmax, `Máximo ${dmax} días`),
      mensaje_experto: z.string().max(500, "Máx. 500 caracteres").optional(),
    });
  }, [contrato]);

  type FormVals = z.infer<typeof schema>;

  const form = useForm<FormVals>({
    resolver: zodResolver(schema),
    mode: "onChange",
    defaultValues: {
      precio_propuesto: undefined as any,
      plazo_propuesto_dias: undefined as any,
      mensaje_experto: "",
    },
  });

  const onSubmit = async (values: FormVals) => {
    await crear.mutateAsync({
      orden_id: orden.id,
      precio_propuesto: values.precio_propuesto,
      plazo_propuesto_dias: values.plazo_propuesto_dias,
      mensaje_experto: values.mensaje_experto || undefined,
    });
    form.reset();
    setAceptado(false);
    onOpenChange(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={(v) => { if (!v) { form.reset(); setAceptado(false); } onOpenChange(v); }}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Postularme a esta orden</DialogTitle>
            <DialogDescription>
              {orden?.tipo?.nombre ?? "Análisis"} · lote {orden?.lote?.nombre_lote ?? "—"}
              {orden?.lote?.ciudad ? ` · ${orden.lote.ciudad}` : ""}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            {/* Sección 1: Contrato marco */}
            <section className="rounded-md border bg-muted/40 p-3 space-y-1.5 text-sm">
              <p className="font-semibold text-foreground">Contrato marco aplicable</p>
              <p>Versión: <strong>{contrato.version ?? "—"}</strong></p>
              <p>
                Precio permitido:{" "}
                <strong>
                  {formatCOP(Number(contrato.precio_min ?? 0))} a {formatCOP(Number(contrato.precio_max ?? 0))}
                </strong>{" "}
                {contrato.moneda ?? "COP"}
              </p>
              <p>
                Plazo permitido:{" "}
                <strong>
                  {contrato.plazo_min_dias} a {contrato.plazo_max_dias} días
                </strong>
              </p>
              {contrato.contenido_legal && (
                <Button
                  type="button"
                  variant="link"
                  size="sm"
                  className="h-auto px-0"
                  onClick={() => setLegalOpen(true)}
                >
                  Ver términos legales completos
                </Button>
              )}
            </section>

            {/* Sección 2: Tu propuesta */}
            <section className="space-y-3">
              <p className="font-semibold text-foreground text-sm">Tu propuesta</p>

              <div>
                <Label htmlFor="precio">Precio propuesto (COP)</Label>
                <Input
                  id="precio"
                  type="number"
                  inputMode="numeric"
                  {...form.register("precio_propuesto", { valueAsNumber: true })}
                />
                {form.formState.errors.precio_propuesto && (
                  <p className="text-xs text-destructive mt-1">
                    {form.formState.errors.precio_propuesto.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="plazo">Plazo propuesto (días)</Label>
                <Input
                  id="plazo"
                  type="number"
                  inputMode="numeric"
                  {...form.register("plazo_propuesto_dias", { valueAsNumber: true })}
                />
                {form.formState.errors.plazo_propuesto_dias && (
                  <p className="text-xs text-destructive mt-1">
                    {form.formState.errors.plazo_propuesto_dias.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="mensaje">Mensaje (opcional)</Label>
                <Textarea
                  id="mensaje"
                  rows={3}
                  maxLength={500}
                  placeholder="Explica brevemente tu enfoque, experiencia previa con este tipo de análisis, etc."
                  {...form.register("mensaje_experto")}
                />
                {form.formState.errors.mensaje_experto && (
                  <p className="text-xs text-destructive mt-1">
                    {form.formState.errors.mensaje_experto.message}
                  </p>
                )}
              </div>
            </section>

            {/* Sección 3: Aceptación */}
            <section className="flex items-start gap-2 rounded-md border p-3">
              <Checkbox
                id="aceptar"
                checked={aceptado}
                onCheckedChange={(v) => setAceptado(v === true)}
                className="mt-0.5"
              />
              <Label htmlFor="aceptar" className="text-xs leading-relaxed font-normal cursor-pointer">
                Acepto los términos del contrato marco <strong>{contrato.version ?? ""}</strong> y entiendo que al ser
                adjudicado debo entregar dentro del plazo propuesto al precio acordado.
              </Label>
            </section>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={!form.formState.isValid || !aceptado || crear.isPending}
              >
                {crear.isPending ? "Enviando..." : "Enviar propuesta"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={legalOpen} onOpenChange={setLegalOpen}>
        <AlertDialogContent className="max-w-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Contrato marco {contrato.version}</AlertDialogTitle>
            <AlertDialogDescription>Términos legales aplicables a esta postulación.</AlertDialogDescription>
          </AlertDialogHeader>
          <ScrollArea className="max-h-[60vh] rounded-md border p-4">
            <pre className="whitespace-pre-wrap text-xs font-body text-foreground">
              {contrato.contenido_legal ?? "Contenido no disponible."}
            </pre>
          </ScrollArea>
          <AlertDialogFooter>
            <AlertDialogCancel>Cerrar</AlertDialogCancel>
            <AlertDialogAction onClick={() => setLegalOpen(false)}>Entendido</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default PostularmeDialog;
