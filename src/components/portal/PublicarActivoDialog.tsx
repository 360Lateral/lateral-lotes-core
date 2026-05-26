import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { usePublicarActivo } from "@/hooks/usePublicarActivo";

const schema = z.object({
  nombre_lote: z.string().trim().min(4, "Mínimo 4 caracteres").max(120),
  ciudad: z.string().trim().min(2, "Requerido").max(80),
  barrio: z.string().trim().max(80).optional().or(z.literal("")),
  area_total_m2: z
    .coerce.number({ invalid_type_error: "Número requerido" })
    .positive("Debe ser mayor a 0"),
  precio_venta_estimado: z
    .coerce.number({ invalid_type_error: "Número requerido" })
    .positive("Debe ser mayor a 0"),
  uso_actual: z.string().trim().max(200).optional().or(z.literal("")),
  descripcion_propietario: z.string().trim().max(1000).optional().or(z.literal("")),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PublicarActivoDialog = ({ open, onOpenChange }: Props) => {
  const publicar = usePublicarActivo();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      nombre_lote: "",
      ciudad: "",
      barrio: "",
      uso_actual: "",
      descripcion_propietario: "",
    },
  });

  const onSubmit = (values: FormValues) => {
    publicar.mutate(
      {
        nombre_lote: values.nombre_lote,
        ciudad: values.ciudad,
        barrio: values.barrio || undefined,
        area_total_m2: values.area_total_m2,
        precio_venta_estimado: values.precio_venta_estimado,
        uso_actual: values.uso_actual || undefined,
        descripcion_propietario: values.descripcion_propietario || undefined,
      },
      {
        onSuccess: () => {
          reset();
          onOpenChange(false);
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) reset(); }}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Publicar un activo</DialogTitle>
          <DialogDescription>
            Cuéntanos lo básico de tu activo. 360Lateral lo revisará antes de
            mostrarlo a desarrolladores.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="nombre_lote">Nombre del activo *</Label>
            <Input id="nombre_lote" {...register("nombre_lote")} />
            {errors.nombre_lote && (
              <p className="text-xs text-destructive">{errors.nombre_lote.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="ciudad">Ciudad *</Label>
              <Input id="ciudad" {...register("ciudad")} placeholder="Ej: Medellín" />
              {errors.ciudad && (
                <p className="text-xs text-destructive">{errors.ciudad.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="barrio">Barrio</Label>
              <Input id="barrio" {...register("barrio")} placeholder="Ej: El Poblado" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="area_total_m2">Área (m²) *</Label>
              <Input
                id="area_total_m2"
                type="number"
                step="0.01"
                {...register("area_total_m2")}
              />
              {errors.area_total_m2 && (
                <p className="text-xs text-destructive">{errors.area_total_m2.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="precio_venta_estimado">Precio sugerido (COP) *</Label>
              <Input
                id="precio_venta_estimado"
                type="number"
                step="1"
                {...register("precio_venta_estimado")}
              />
              {errors.precio_venta_estimado && (
                <p className="text-xs text-destructive">{errors.precio_venta_estimado.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="uso_actual">Uso actual</Label>
            <Input
              id="uso_actual"
              {...register("uso_actual")}
              placeholder="Ej: lote sin construcción, casa antigua…"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="descripcion_propietario">Cuéntanos más</Label>
            <Textarea
              id="descripcion_propietario"
              rows={4}
              {...register("descripcion_propietario")}
              placeholder="Características, historia, lo que un comprador debería saber…"
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting || publicar.isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting || publicar.isPending}>
              {publicar.isPending ? "Enviando…" : "Enviar para validación"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default PublicarActivoDialog;
