import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertTriangle } from "lucide-react";
import { ContratoMarco } from "@/hooks/useContratosMarco";
import { useCrearVersionContrato } from "@/hooks/useCrearVersionContrato";

const schema = z
  .object({
    version_explicita: z.string().optional(),
    contenido_legal: z.string().min(50, "Mínimo 50 caracteres"),
    precio_min: z.coerce.number().min(0),
    precio_max: z.coerce.number().min(0),
    plazo_min_dias: z.coerce.number().int().min(1),
    plazo_max_dias: z.coerce.number().int().min(1),
    moneda: z.string().min(1),
  })
  .refine((d) => d.precio_max >= d.precio_min, {
    message: "Precio máx debe ser >= mín",
    path: ["precio_max"],
  })
  .refine((d) => d.plazo_max_dias >= d.plazo_min_dias, {
    message: "Plazo máx debe ser >= mín",
    path: ["plazo_max_dias"],
  });

type FormVals = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  contratoActual: ContratoMarco;
}

function bumpMinor(v: string) {
  const m = v.match(/^v(\d+)\.(\d+)$/);
  if (!m) return "";
  return `v${m[1]}.${parseInt(m[2], 10) + 1}`;
}

const NuevaVersionContratoDialog = ({ open, onOpenChange, contratoActual }: Props) => {
  const mut = useCrearVersionContrato();
  const nombre = contratoActual.tipos_analisis?.nombre ?? "Tipo de análisis";

  const form = useForm<FormVals>({
    resolver: zodResolver(schema),
    defaultValues: {
      version_explicita: bumpMinor(contratoActual.version),
      contenido_legal: contratoActual.contenido_legal,
      precio_min: Number(contratoActual.precio_min),
      precio_max: Number(contratoActual.precio_max),
      plazo_min_dias: contratoActual.plazo_min_dias,
      plazo_max_dias: contratoActual.plazo_max_dias,
      moneda: contratoActual.moneda || "COP",
    },
  });

  const onSubmit = (vals: FormVals) => {
    mut.mutate(
      {
        contrato_id_actual: contratoActual.id,
        contenido_legal: vals.contenido_legal,
        precio_min: vals.precio_min,
        precio_max: vals.precio_max,
        plazo_min_dias: vals.plazo_min_dias,
        plazo_max_dias: vals.plazo_max_dias,
        moneda: vals.moneda,
        version_explicita: vals.version_explicita?.trim() || undefined,
      },
      { onSuccess: () => onOpenChange(false) },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nueva versión del contrato marco — {nombre}</DialogTitle>
          <DialogDescription>
            Versión actual: <strong>{contratoActual.version}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-start gap-2 rounded-md border border-yellow-300 bg-yellow-50 p-3 text-sm text-yellow-900">
          <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
          <p>
            Estás creando una nueva versión. La versión actual ({contratoActual.version}) quedará
            inactiva y se preservará en historial. Las propuestas firmadas con la versión anterior
            NO se alteran.
          </p>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
          <div>
            <Label>Versión nueva (opcional, se autocalcula si está vacía)</Label>
            <Input {...form.register("version_explicita")} placeholder="v1.1" />
          </div>
          <div>
            <Label>Contenido legal</Label>
            <Textarea
              {...form.register("contenido_legal")}
              rows={10}
              className="font-mono text-xs"
            />
            {form.formState.errors.contenido_legal && (
              <p className="text-xs text-destructive mt-1">
                {form.formState.errors.contenido_legal.message}
              </p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Precio mínimo</Label>
              <Input type="number" {...form.register("precio_min")} />
            </div>
            <div>
              <Label>Precio máximo</Label>
              <Input type="number" {...form.register("precio_max")} />
              {form.formState.errors.precio_max && (
                <p className="text-xs text-destructive mt-1">
                  {form.formState.errors.precio_max.message}
                </p>
              )}
            </div>
            <div>
              <Label>Plazo mín (días)</Label>
              <Input type="number" {...form.register("plazo_min_dias")} />
            </div>
            <div>
              <Label>Plazo máx (días)</Label>
              <Input type="number" {...form.register("plazo_max_dias")} />
              {form.formState.errors.plazo_max_dias && (
                <p className="text-xs text-destructive mt-1">
                  {form.formState.errors.plazo_max_dias.message}
                </p>
              )}
            </div>
            <div className="col-span-2">
              <Label>Moneda</Label>
              <Select
                value={form.watch("moneda")}
                onValueChange={(v) => form.setValue("moneda", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="COP">COP</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={mut.isPending}>
              {mut.isPending ? "Creando..." : "Crear nueva versión"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default NuevaVersionContratoDialog;
