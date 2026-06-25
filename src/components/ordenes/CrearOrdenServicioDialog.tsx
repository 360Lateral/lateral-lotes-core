import { useEffect, useMemo, useState } from "react";
import { useForm, Controller } from "react-hook-form";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Loader2 } from "lucide-react";
import { useTiposAnalisis } from "@/hooks/useTiposAnalisis";
import { useContratosMarco } from "@/hooks/useContratosMarco";
import { useExpertosList } from "@/hooks/useExpertosList";
import { useCrearOrdenServicio } from "@/hooks/useCrearOrdenServicio";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatCOP } from "@/lib/format-moneda";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  loteId: string;
  engagementId?: string | null;
}

const schema = z.object({
  tipo_analisis_id: z.string().min(1, "Selecciona un tipo"),
  fecha_limite_propuestas: z.string().min(1, "Selecciona fecha"),
  visibilidad: z.enum(["publica", "invitacion"]),
  expertos_invitados: z.array(z.string()).optional(),
  notas_admin: z.string().max(500).optional(),
});

type FormData = z.infer<typeof schema>;

const today = new Date();
const minDate = new Date(today.getTime() + 24 * 3600 * 1000).toISOString().slice(0, 10);
const maxDate = new Date(today.getTime() + 60 * 24 * 3600 * 1000).toISOString().slice(0, 10);
const defaultDate = new Date(today.getTime() + 7 * 24 * 3600 * 1000).toISOString().slice(0, 10);

const CrearOrdenServicioDialog = ({ open, onOpenChange, loteId, engagementId }: Props) => {
  const tiposQ = useTiposAnalisis();
  const tipos = (tiposQ.data ?? []).filter((t: any) => t.activo);
  const { data: contratos = [] } = useContratosMarco();
  const { data: expertos = [] } = useExpertosList();
  const crear = useCrearOrdenServicio();

  const { data: lote } = useQuery({
    queryKey: ["lote-mini", loteId],
    enabled: open && !!loteId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lotes")
        .select("nombre_lote, ciudad")
        .eq("id", loteId)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      tipo_analisis_id: "",
      fecha_limite_propuestas: defaultDate,
      visibilidad: "publica",
      expertos_invitados: [],
      notas_admin: "",
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        tipo_analisis_id: "",
        fecha_limite_propuestas: defaultDate,
        visibilidad: "publica",
        expertos_invitados: [],
        notas_admin: "",
      });
    }
  }, [open, reset]);

  const tipoId = watch("tipo_analisis_id");
  const visibilidad = watch("visibilidad");
  const invitados = watch("expertos_invitados") ?? [];

  const contratoActivo = useMemo(
    () => contratos.find((c: any) => c.tipo_analisis_id === tipoId && c.activo),
    [contratos, tipoId],
  );

  const sinContrato = tipoId && !contratoActivo;
  const submitDisabled =
    !tipoId ||
    !contratoActivo ||
    (visibilidad === "invitacion" && invitados.length === 0) ||
    crear.isPending;

  const onSubmit = (data: FormData) => {
    if (!contratoActivo) return;
    const fechaISO = new Date(data.fecha_limite_propuestas + "T23:59:59").toISOString();
    crear.mutate(
      {
        lote_id: loteId,
        tipo_analisis_id: data.tipo_analisis_id,
        contrato_marco_id: contratoActivo.id,
        engagement_id: engagementId ?? null,
        fecha_limite_propuestas: fechaISO,
        visibilidad: data.visibilidad,
        expertos_invitados: data.visibilidad === "invitacion" ? data.expertos_invitados : [],
        notas_admin: data.notas_admin || null,
      },
      { onSuccess: () => onOpenChange(false) },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Crear orden de servicio</DialogTitle>
          <DialogDescription>
            {lote?.nombre_lote ?? "Lote"}
            {engagementId ? ` · para engagement #${engagementId.slice(0, 8)}` : ""}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label>Tipo de análisis *</Label>
            <Controller
              control={control}
              name="tipo_analisis_id"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {tipos.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.tipo_analisis_id && (
              <p className="text-xs text-destructive mt-1">{errors.tipo_analisis_id.message}</p>
            )}
          </div>

          {contratoActivo && (
            <div className="rounded-md border border-border bg-muted/40 p-3 text-xs">
              <p className="font-semibold text-foreground">
                Contrato vigente: v{contratoActivo.version}
              </p>
              <p className="text-muted-foreground">
                Precio: {formatCOP(Number(contratoActivo.precio_min))} – {formatCOP(Number(contratoActivo.precio_max))} · Plazo:{" "}
                {contratoActivo.plazo_min_dias}–{contratoActivo.plazo_max_dias} días
              </p>
            </div>
          )}

          {sinContrato && (
            <div className="rounded-md border border-destructive bg-destructive/10 p-3 text-xs text-destructive flex gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>
                No hay contrato marco vigente para este tipo. Crea uno en /dashboard/contratos-marco antes de continuar.
              </span>
            </div>
          )}

          <div>
            <Label>Fecha límite para recibir propuestas *</Label>
            <Input
              type="date"
              min={minDate}
              max={maxDate}
              {...register("fecha_limite_propuestas")}
            />
          </div>

          <div>
            <Label>Visibilidad *</Label>
            <Controller
              control={control}
              name="visibilidad"
              render={({ field }) => (
                <RadioGroup value={field.value} onValueChange={field.onChange} className="mt-2 space-y-2">
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="publica" id="vis-pub" />
                    <Label htmlFor="vis-pub" className="font-normal cursor-pointer">
                      Pública — notificar a todos los expertos
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="invitacion" id="vis-inv" />
                    <Label htmlFor="vis-inv" className="font-normal cursor-pointer">
                      Solo por invitación — elegir expertos específicos
                    </Label>
                  </div>
                </RadioGroup>
              )}
            />
          </div>

          {visibilidad === "invitacion" && (
            <div>
              <Label>Expertos invitados *</Label>
              <Controller
                control={control}
                name="expertos_invitados"
                render={({ field }) => (
                  <div className="mt-2 max-h-48 overflow-y-auto rounded-md border border-border p-2 space-y-1">
                    {expertos.length === 0 && (
                      <p className="text-xs text-muted-foreground p-2">No hay expertos registrados.</p>
                    )}
                    {expertos.map((e) => {
                      const checked = (field.value ?? []).includes(e.id);
                      return (
                        <label
                          key={e.id}
                          className="flex items-center gap-2 p-2 hover:bg-muted/50 rounded cursor-pointer text-sm"
                        >
                          <Checkbox
                            checked={checked}
                            onCheckedChange={(c) => {
                              const cur = field.value ?? [];
                              field.onChange(c ? [...cur, e.id] : cur.filter((x) => x !== e.id));
                            }}
                          />
                          <span>{e.nombre || e.email || e.id.slice(0, 8)}</span>
                          {e.email && <span className="text-xs text-muted-foreground">({e.email})</span>}
                        </label>
                      );
                    })}
                  </div>
                )}
              />
              {invitados.length === 0 && (
                <p className="text-xs text-destructive mt-1">Selecciona al menos 1 experto.</p>
              )}
            </div>
          )}

          <div>
            <Label>Notas (opcional)</Label>
            <Textarea maxLength={500} rows={3} {...register("notas_admin")} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={submitDisabled}>
              {crear.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Crear orden
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CrearOrdenServicioDialog;
