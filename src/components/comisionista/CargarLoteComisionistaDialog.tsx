import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { usePropietariosList } from "@/hooks/useAsignarPropietario";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";

const BUCKET = "documentos-comisionistas";

const schema = z.object({
  propietario_id: z.string().uuid({ message: "Selecciona un propietario" }),
  nombre_lote: z.string().trim().min(2, "Mínimo 2 caracteres").max(120),
  ciudad: z.string().trim().min(2).max(80),
  barrio: z.string().trim().max(80).optional().or(z.literal("")),
  area_total_m2: z.coerce.number().positive("Área debe ser > 0"),
  tipo_lote: z.string().trim().max(60).optional().or(z.literal("")),
  precio_venta_estimado: z.coerce.number().nonnegative().optional(),
  comision_pct: z.coerce
    .number()
    .min(0.1, "Mínimo 0.1%")
    .max(20, "Máximo 20%"),
  notas: z.string().max(500).optional().or(z.literal("")),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export default function CargarLoteComisionistaDialog({ open, onOpenChange }: Props) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data: propietarios = [], isLoading: loadingProps } = usePropietariosList();
  const [documento, setDocumento] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      propietario_id: "",
      nombre_lote: "",
      ciudad: "",
      barrio: "",
      area_total_m2: 0,
      tipo_lote: "",
      precio_venta_estimado: undefined,
      comision_pct: 3,
      notas: "",
    },
  });

  const reset = () => {
    form.reset();
    setDocumento(null);
  };

  const onSubmit = async (values: FormValues) => {
    if (!user) return;
    if (!documento) {
      toast.error("Documento de aceptación del dueño es obligatorio");
      return;
    }
    setSubmitting(true);
    try {
      // 1) Crear lote
      const { data: lote, error: loteErr } = await supabase
        .from("lotes")
        .insert({
          nombre_lote: values.nombre_lote,
          ciudad: values.ciudad,
          barrio: values.barrio || null,
          area_total_m2: values.area_total_m2,
          tipo_lote: values.tipo_lote || null,
          precio_venta_estimado: values.precio_venta_estimado ?? null,
          propietario_id: values.propietario_id,
          publicado_venta: true,
        })
        .select("id")
        .single();
      if (loteErr) throw loteErr;

      // 2) Subir documento
      const path = `${lote.id}/${Date.now()}_${documento.name}`;
      const { error: upErr } = await supabase.storage
        .from(BUCKET)
        .upload(path, documento, { contentType: documento.type });
      if (upErr) throw upErr;

      // 3) Crear autorización
      const { error: autorizErr } = await supabase
        .from("autorizaciones_comisionista")
        .insert({
          lote_id: lote.id,
          propietario_id: values.propietario_id,
          comisionista_id: user.id,
          comision_pct: values.comision_pct,
          documento_url: path,
          notas: values.notas || null,
          creada_por: user.id,
        });
      if (autorizErr) {
        await supabase.storage.from(BUCKET).remove([path]).catch(() => {});
        throw autorizErr;
      }

      toast.success(
        "Lote cargado. Pasará por validación de 360Lateral antes de publicarse en el mercado."
      );
      qc.invalidateQueries({ queryKey: ["mis-autorizaciones"] });
      onOpenChange(false);
      reset();
    } catch (e: any) {
      toast.error("No se pudo cargar el lote", { description: e?.message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (!v) reset();
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Cargar lote de propietario</DialogTitle>
          <DialogDescription>
            Sube el lote que representas. 360Lateral lo revisará antes de publicarlo.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label>Propietario *</Label>
            <Select
              value={form.watch("propietario_id")}
              onValueChange={(v) => form.setValue("propietario_id", v, { shouldValidate: true })}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={loadingProps ? "Cargando..." : "Selecciona el propietario"}
                />
              </SelectTrigger>
              <SelectContent>
                {propietarios.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.nombre || p.email || p.id}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {propietarios.length === 0 && !loadingProps && (
              <p className="mt-1 text-xs text-muted-foreground">
                ¿No ves al propietario? Pídele a 360Lateral que lo cree como usuario.
              </p>
            )}
            {form.formState.errors.propietario_id && (
              <p className="mt-1 text-xs text-destructive">
                {form.formState.errors.propietario_id.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <Label>Nombre del lote *</Label>
              <Input {...form.register("nombre_lote")} />
              {form.formState.errors.nombre_lote && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.nombre_lote.message}
                </p>
              )}
            </div>
            <div>
              <Label>Ciudad *</Label>
              <Input {...form.register("ciudad")} />
              {form.formState.errors.ciudad && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.ciudad.message}
                </p>
              )}
            </div>
            <div>
              <Label>Barrio</Label>
              <Input {...form.register("barrio")} />
            </div>
            <div>
              <Label>Área total m² *</Label>
              <Input type="number" step="0.01" {...form.register("area_total_m2")} />
              {form.formState.errors.area_total_m2 && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.area_total_m2.message}
                </p>
              )}
            </div>
            <div>
              <Label>Tipo / uso</Label>
              <Input
                placeholder="urbano / rural / industrial..."
                {...form.register("tipo_lote")}
              />
            </div>
            <div>
              <Label>Precio venta estimado (COP)</Label>
              <Input type="number" step="1" {...form.register("precio_venta_estimado")} />
            </div>
            <div>
              <Label>Comisión pactada (%) *</Label>
              <Input type="number" step="0.1" {...form.register("comision_pct")} />
              {form.formState.errors.comision_pct && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.comision_pct.message}
                </p>
              )}
            </div>
            <div>
              <Label>Documento de aceptación del dueño *</Label>
              <Input
                type="file"
                accept="application/pdf,image/*"
                onChange={(e) => setDocumento(e.target.files?.[0] ?? null)}
              />
              {documento && (
                <p className="mt-1 truncate text-xs text-muted-foreground">{documento.name}</p>
              )}
            </div>
          </div>

          <div>
            <Label>Notas (opcional)</Label>
            <Textarea rows={2} {...form.register("notas")} />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Cargar lote
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
