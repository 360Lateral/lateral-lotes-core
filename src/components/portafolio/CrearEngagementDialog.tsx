import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useCrearEngagement, useEngagementsPorLote } from "@/hooks/useEngagements";
import { toast } from "sonner";

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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertTriangle, Loader2 } from "lucide-react";
import { formatCOP } from "@/lib/format-moneda";

const schema = z.object({
  plan_id: z.string().uuid({ message: "Selecciona un plan" }),
  tipo_cliente: z.enum(["lead", "perfil", "sin_cliente"]),
  cliente_id: z.string().uuid().optional().or(z.literal("")),
  asesor_asignado_id: z.string().uuid({ message: "Selecciona un asesor" }),
  gerente_id: z.string().uuid().optional().or(z.literal("")),
  fecha_inicio: z.string().optional().or(z.literal("")),
  precio_cobrado: z.coerce.number().nonnegative().optional().or(z.nan()),
  moneda: z.string().default("COP"),
  notas: z.string().max(2000).optional().or(z.literal("")),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  loteId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (engagementId: string) => void;
}

const ESTADOS_VIGENTES = ["prospecto", "activo", "en_revision", "entregado"];

const CrearEngagementDialog = ({ loteId, open, onOpenChange, onCreated }: Props) => {
  const { user, roles } = useAuth();
  const isAsesor = roles.some((r) => ["experto", "admin", "super_admin"].includes(r));
  const [confirmDup, setConfirmDup] = useState(false);
  const crear = useCrearEngagement();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      plan_id: "",
      tipo_cliente: "lead",
      cliente_id: "",
      asesor_asignado_id: isAsesor && user ? user.id : "",
      gerente_id: "",
      fecha_inicio: "",
      precio_cobrado: undefined as any,
      moneda: "COP",
      notas: "",
    },
  });

  const tipoCliente = form.watch("tipo_cliente");
  const planId = form.watch("plan_id");

  // Lote info
  const { data: lote } = useQuery({
    queryKey: ["lote-min", loteId],
    enabled: open && !!loteId,
    queryFn: async () => {
      const { data } = await supabase
        .from("lotes")
        .select("id, nombre_lote, ciudad, barrio")
        .eq("id", loteId)
        .maybeSingle();
      return data;
    },
  });

  // Planes
  const { data: planes = [] } = useQuery({
    queryKey: ["planes-diagnostico-activos"],
    enabled: open,
    queryFn: async () => {
      const { data } = await supabase
        .from("planes_diagnostico")
        .select("*")
        .eq("activo", true)
        .order("orden", { ascending: true });
      return data ?? [];
    },
  });

  const planSel = useMemo(() => planes.find((p: any) => p.id === planId), [planes, planId]);

  // Tareas count for selected plan
  const { data: tareasPlan = 0 } = useQuery({
    queryKey: ["plan-tareas-count", planId],
    enabled: open && !!planId,
    queryFn: async () => {
      const { count } = await supabase
        .from("planes_analisis")
        .select("id", { count: "exact", head: true })
        .eq("plan_id", planId)
        .eq("incluido", true);
      return count ?? 0;
    },
  });

  // Leads
  const { data: leads = [] } = useQuery({
    queryKey: ["leads-min"],
    enabled: open && tipoCliente === "lead",
    queryFn: async () => {
      const { data } = await supabase
        .from("leads")
        .select("id, nombre, email")
        .order("created_at", { ascending: false })
        .limit(200);
      return data ?? [];
    },
  });

  // Perfiles
  const { data: perfiles = [] } = useQuery({
    queryKey: ["perfiles-min"],
    enabled: open && tipoCliente === "perfil",
    queryFn: async () => {
      const { data } = await supabase
        .from("perfiles")
        .select("id, nombre, email")
        .eq("activo", true)
        .order("nombre", { ascending: true })
        .limit(500);
      return data ?? [];
    },
  });

  // Asesores / admins
  const { data: asesores = [] } = useQuery({
    queryKey: ["asesores-min"],
    enabled: open,
    queryFn: async () => {
      const { data: rolesData } = await supabase
        .from("user_roles")
        .select("user_id, role")
        .in("role", ["experto", "admin", "super_admin"] as any);
      const ids = Array.from(new Set((rolesData ?? []).map((r: any) => r.user_id)));
      if (ids.length === 0) return [];
      const { data: perfs } = await supabase
        .from("perfiles")
        .select("id, nombre, email")
        .in("id", ids);
      return perfs ?? [];
    },
  });

  // Existing engagements
  const { data: existentes = [] } = useEngagementsPorLote(open ? loteId : undefined);
  const vigente = (existentes as any[]).find((e) => ESTADOS_VIGENTES.includes(e.estado));

  // Pre-fill precio/moneda when plan changes
  useEffect(() => {
    if (planSel) {
      form.setValue("moneda", planSel.moneda ?? "COP");
      if (planSel.precio_cop != null && !form.getValues("precio_cobrado")) {
        form.setValue("precio_cobrado", Number(planSel.precio_cop));
      }
    }
  }, [planSel?.id]);

  // Reset on open
  useEffect(() => {
    if (open) {
      setConfirmDup(false);
    } else {
      form.reset();
    }
  }, [open]);

  const onSubmit = async (values: FormValues) => {
    if (vigente && !confirmDup) {
      toast.warning("Debes confirmar que quieres crear un engagement adicional.");
      return;
    }
    try {
      const result = await crear.mutateAsync({
        lote_id: loteId,
        plan_id: values.plan_id,
        tipo_cliente: values.tipo_cliente === "sin_cliente" ? "perfil" : values.tipo_cliente,
        cliente_id:
          values.tipo_cliente === "sin_cliente" || !values.cliente_id
            ? null
            : values.cliente_id,
        asesor_asignado_id: values.asesor_asignado_id,
        gerente_id: values.gerente_id || null,
        fecha_inicio: values.fecha_inicio || null,
        precio_cobrado:
          values.precio_cobrado != null && !Number.isNaN(values.precio_cobrado as any)
            ? Number(values.precio_cobrado)
            : null,
        moneda: values.moneda || "COP",
        notas: values.notas || null,
        dias_sla: planSel?.dias_sla ?? null,
      });
      toast.success("Engagement creado en borrador", {
        description:
          "Pendiente de activación por un Super Admin. Las tareas se generarán al activarlo.",
      });
      onOpenChange(false);
      if (result?.id) onCreated?.(result.id);
    } catch {
      /* handled in hook */
    }
  };

  const formInvalid = !form.formState.isValid || (!!vigente && !confirmDup);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Crear engagement</DialogTitle>
          <DialogDescription>
            Asigna un plan, cliente y asesor. Las tareas de análisis se generarán automáticamente.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Lote */}
          <div className="space-y-1">
            <Label>Lote</Label>
            <div className="rounded-md border bg-muted/40 px-3 py-2 text-sm">
              <div className="font-medium">{lote?.nombre_lote ?? "—"}</div>
              <div className="text-xs text-muted-foreground">
                {[lote?.ciudad, lote?.barrio].filter(Boolean).join(" · ") || "Sin ubicación"}
              </div>
            </div>
          </div>

          {vigente && (
            <div className="rounded-md border border-yellow-400 bg-yellow-50 p-3 text-sm dark:bg-yellow-950/30">
              <div className="flex items-start gap-2 text-yellow-900 dark:text-yellow-200">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <div className="flex-1">
                  <p>
                    Este lote ya tiene un engagement activo creado el{" "}
                    <strong>{new Date(vigente.created_at).toLocaleDateString("es-CO")}</strong>
                    {vigente.planes_diagnostico?.nombre && (
                      <> con plan <strong>{vigente.planes_diagnostico.nombre}</strong></>
                    )}
                    . ¿Seguro que quieres crear uno nuevo?
                  </p>
                  <label className="mt-2 flex items-center gap-2">
                    <Checkbox
                      checked={confirmDup}
                      onCheckedChange={(v) => setConfirmDup(!!v)}
                    />
                    <span className="text-xs">Sí, crear otro engagement</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Plan */}
          <div className="space-y-1">
            <Label>Plan *</Label>
            <Select
              value={form.watch("plan_id")}
              onValueChange={(v) => form.setValue("plan_id", v, { shouldValidate: true })}
            >
              <SelectTrigger><SelectValue placeholder="Selecciona un plan" /></SelectTrigger>
              <SelectContent>
                {planes.map((p: any) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.nombre}
                    {p.precio_cop ? ` · ${formatCOP(Number(p.precio_cop))} ${p.moneda}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {planSel && (
              <p className="text-xs text-muted-foreground">
                Incluye {tareasPlan} análisis · SLA {planSel.dias_sla ?? 0} días
              </p>
            )}
          </div>

          {/* Tipo cliente */}
          <div className="space-y-2">
            <Label>Tipo de cliente</Label>
            <RadioGroup
              value={tipoCliente}
              onValueChange={(v) => {
                form.setValue("tipo_cliente", v as any);
                form.setValue("cliente_id", "");
              }}
              className="flex gap-4"
            >
              <label className="flex items-center gap-2 text-sm">
                <RadioGroupItem value="lead" /> Lead existente
              </label>
              <label className="flex items-center gap-2 text-sm">
                <RadioGroupItem value="perfil" /> Cliente registrado
              </label>
              <label className="flex items-center gap-2 text-sm">
                <RadioGroupItem value="sin_cliente" /> Sin cliente todavía
              </label>
            </RadioGroup>
          </div>

          {tipoCliente === "sin_cliente" && (
            <div className="rounded-md border border-blue-300 bg-blue-50 p-3 text-sm dark:bg-blue-950/30">
              <p className="text-blue-900 dark:text-blue-200">
                💡 El engagement se creará sin cliente. Después podrás asignar un cliente desde
                "/dashboard/usuarios → Agregar cliente" o editando el engagement.
              </p>
            </div>
          )}

          {/* Cliente */}
          {tipoCliente !== "sin_cliente" && (
            <div className="space-y-1">
              <Label>{tipoCliente === "lead" ? "Lead" : "Cliente"} *</Label>
              <Select
                value={form.watch("cliente_id")}
                onValueChange={(v) => form.setValue("cliente_id", v, { shouldValidate: true })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={tipoCliente === "lead" ? "Selecciona un lead" : "Selecciona un cliente"} />
                </SelectTrigger>
                <SelectContent>
                  {(tipoCliente === "lead" ? leads : perfiles).map((c: any) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.nombre ?? "Sin nombre"}{c.email ? ` · ${c.email}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Asesor */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <Label>Asesor asignado *</Label>
              <Select
                value={form.watch("asesor_asignado_id")}
                onValueChange={(v) => form.setValue("asesor_asignado_id", v, { shouldValidate: true })}
              >
                <SelectTrigger><SelectValue placeholder="Selecciona un asesor" /></SelectTrigger>
                <SelectContent>
                  {asesores.map((a: any) => (
                    <SelectItem key={a.id} value={a.id}>{a.nombre ?? a.email}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Gerente (opcional)</Label>
              <Select
                value={form.watch("gerente_id") || ""}
                onValueChange={(v) => form.setValue("gerente_id", v)}
              >
                <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                <SelectContent>
                  {asesores.map((a: any) => (
                    <SelectItem key={a.id} value={a.id}>{a.nombre ?? a.email}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Fecha inicio */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1 sm:col-span-1">
              <Label>Fecha de inicio</Label>
              <Input type="date" {...form.register("fecha_inicio")} />
            </div>
            <div className="space-y-1 sm:col-span-1">
              <Label>Precio cobrado</Label>
              <Input type="number" min={0} step={1000} {...form.register("precio_cobrado")} />
            </div>
            <div className="space-y-1 sm:col-span-1">
              <Label>Moneda</Label>
              <Select
                value={form.watch("moneda")}
                onValueChange={(v) => form.setValue("moneda", v)}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="COP">COP</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Notas */}
          <div className="space-y-1">
            <Label>Notas internas</Label>
            <Textarea rows={3} {...form.register("notas")} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={formInvalid || crear.isPending}>
              {crear.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Crear engagement
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CrearEngagementDialog;
