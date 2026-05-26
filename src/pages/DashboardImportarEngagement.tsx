import { useEffect, useMemo } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useAsesoresList } from "@/hooks/useAsesoresList";
import { useImportarEngagementHistorico } from "@/hooks/useImportarEngagementHistorico";

const schema = z.object({
  lote_id: z.string().uuid({ message: "Selecciona un lote" }),
  plan_id: z.string().uuid({ message: "Selecciona un plan" }),
  cliente_id: z.string().uuid().optional().or(z.literal("")),
  asesor_id: z.string().uuid({ message: "Selecciona un asesor" }),
  fecha_entrega: z.string().min(1, "Requerido"),
  link_diagnostico: z.string().regex(/^https:\/\//i, "Debe iniciar con https://"),
  link_presentacion: z.string().regex(/^https:\/\//i, "Debe iniciar con https://"),
  precio_cobrado: z.coerce.number().nonnegative().optional().or(z.nan()),
  notas: z.string().max(2000).optional().or(z.literal("")),
  tareas_no_aplica: z.array(z.string().uuid()).default([]),
});

type FormValues = z.infer<typeof schema>;

const DashboardImportarEngagement = () => {
  const navigate = useNavigate();
  const { isSuperAdmin, loading } = useAuth();
  const importar = useImportarEngagementHistorico();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      lote_id: "",
      plan_id: "",
      cliente_id: "",
      asesor_id: "",
      fecha_entrega: "",
      link_diagnostico: "",
      link_presentacion: "",
      precio_cobrado: undefined as any,
      notas: "",
      tareas_no_aplica: [],
    },
  });

  const planId = form.watch("plan_id");
  const tareasNoAplica = form.watch("tareas_no_aplica") ?? [];

  const { data: lotes = [] } = useQuery({
    queryKey: ["importar-lotes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lotes")
        .select("id, nombre_lote, ciudad, barrio")
        .order("nombre_lote", { ascending: true })
        .limit(1000);
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: planes = [] } = useQuery({
    queryKey: ["planes-diagnostico-activos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("planes_diagnostico")
        .select("id, codigo, nombre, moneda, precio_cop")
        .eq("activo", true)
        .order("orden", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: clientes = [] } = useQuery({
    queryKey: ["importar-clientes-inversor"],
    queryFn: async () => {
      const { data: rolesData } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "inversor" as any);
      const ids = Array.from(new Set((rolesData ?? []).map((r: any) => r.user_id)));
      if (ids.length === 0) return [];
      const { data } = await supabase
        .from("perfiles")
        .select("id, nombre, email")
        .in("id", ids)
        .order("nombre", { ascending: true });
      return data ?? [];
    },
  });

  const { data: asesores = [] } = useAsesoresList();

  const { data: tareasPlan = [] } = useQuery({
    queryKey: ["plan-tareas-full", planId],
    enabled: !!planId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("planes_analisis")
        .select("tipo_analisis_id, tipos_analisis(nombre, orden)")
        .eq("plan_id", planId)
        .eq("incluido", true);
      if (error) throw error;
      const rows = (data ?? []) as any[];
      rows.sort((a, b) => (a.tipos_analisis?.orden ?? 0) - (b.tipos_analisis?.orden ?? 0));
      return rows.map((r) => ({
        tipo_analisis_id: r.tipo_analisis_id as string,
        nombre: (r.tipos_analisis?.nombre as string) ?? "Análisis",
      }));
    },
  });

  // Reset tareas_no_aplica al cambiar plan
  useEffect(() => {
    form.setValue("tareas_no_aplica", []);
  }, [planId]);

  const planSel = useMemo(
    () => (planes as any[]).find((p) => p.id === planId),
    [planes, planId],
  );

  useEffect(() => {
    if (planSel?.precio_cop != null && !form.getValues("precio_cobrado")) {
      form.setValue("precio_cobrado", Number(planSel.precio_cop));
    }
  }, [planSel?.id]);

  if (loading) {
    return (
      <DashboardLayout>
        <p className="text-muted-foreground font-body">Cargando...</p>
      </DashboardLayout>
    );
  }

  if (!isSuperAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  const toggleNoAplica = (id: string, checked: boolean) => {
    const cur = form.getValues("tareas_no_aplica") ?? [];
    form.setValue(
      "tareas_no_aplica",
      checked ? Array.from(new Set([...cur, id])) : cur.filter((x) => x !== id),
    );
  };

  const onSubmit = async (values: FormValues) => {
    try {
      const id = await importar.mutateAsync({
        lote_id: values.lote_id,
        plan_id: values.plan_id,
        cliente_id: values.cliente_id ? values.cliente_id : null,
        asesor_id: values.asesor_id,
        fecha_entrega: new Date(values.fecha_entrega).toISOString(),
        link_diagnostico: values.link_diagnostico,
        link_presentacion: values.link_presentacion,
        tareas_no_aplica: values.tareas_no_aplica ?? [],
        precio_cobrado:
          values.precio_cobrado != null && !Number.isNaN(values.precio_cobrado as any)
            ? Number(values.precio_cobrado)
            : null,
        notas: values.notas || null,
      });
      navigate(`/dashboard/engagements/${id}`);
    } catch {
      /* manejado en hook */
    }
  };

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="font-body text-xl font-bold text-foreground">
          Importar engagement histórico
        </h1>
        <p className="mt-1 font-body text-sm text-muted-foreground">
          Carga un diagnóstico ya entregado al cliente. Quedará cerrado, con los
          dos entregables maestros publicados y las tareas marcadas como
          entregadas.
        </p>
      </div>

      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="max-w-3xl space-y-5 rounded-md border bg-card p-6"
      >
        <div className="space-y-1">
          <Label>Lote *</Label>
          <Select
            value={form.watch("lote_id")}
            onValueChange={(v) => form.setValue("lote_id", v, { shouldValidate: true })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecciona un lote" />
            </SelectTrigger>
            <SelectContent>
              {(lotes as any[]).map((l) => (
                <SelectItem key={l.id} value={l.id}>
                  {l.nombre_lote}
                  {l.ciudad ? ` · ${l.ciudad}` : ""}
                  {l.barrio ? ` · ${l.barrio}` : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {form.formState.errors.lote_id && (
            <p className="text-xs text-destructive">{form.formState.errors.lote_id.message}</p>
          )}
        </div>

        <div className="space-y-1">
          <Label>Plan *</Label>
          <Select
            value={form.watch("plan_id")}
            onValueChange={(v) => form.setValue("plan_id", v, { shouldValidate: true })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecciona un plan" />
            </SelectTrigger>
            <SelectContent>
              {(planes as any[]).map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.nombre ?? p.codigo}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {form.formState.errors.plan_id && (
            <p className="text-xs text-destructive">{form.formState.errors.plan_id.message}</p>
          )}
        </div>

        <div className="space-y-1">
          <Label>Propietario / Cliente</Label>
          <Select
            value={form.watch("cliente_id") || "__none__"}
            onValueChange={(v) =>
              form.setValue("cliente_id", v === "__none__" ? "" : v, { shouldValidate: true })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Sin cliente todavía" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">Sin cliente todavía</SelectItem>
              {(clientes as any[]).map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.nombre ?? c.email ?? c.id}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label>Asesor responsable *</Label>
          <Select
            value={form.watch("asesor_id")}
            onValueChange={(v) => form.setValue("asesor_id", v, { shouldValidate: true })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecciona un asesor" />
            </SelectTrigger>
            <SelectContent>
              {(asesores ?? []).map((a) => (
                <SelectItem key={a.id} value={a.id}>
                  {a.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {form.formState.errors.asesor_id && (
            <p className="text-xs text-destructive">{form.formState.errors.asesor_id.message}</p>
          )}
        </div>

        <div className="space-y-1">
          <Label>Fecha de entrega real *</Label>
          <Input type="date" {...form.register("fecha_entrega")} />
          {form.formState.errors.fecha_entrega && (
            <p className="text-xs text-destructive">{form.formState.errors.fecha_entrega.message}</p>
          )}
        </div>

        <div className="space-y-1">
          <Label>Link Diagnóstico Inmobiliario (Drive) *</Label>
          <Input
            type="url"
            placeholder="https://drive.google.com/..."
            {...form.register("link_diagnostico")}
          />
          {form.formState.errors.link_diagnostico && (
            <p className="text-xs text-destructive">
              {form.formState.errors.link_diagnostico.message}
            </p>
          )}
        </div>

        <div className="space-y-1">
          <Label>Link Presentación del Diagnóstico (Drive) *</Label>
          <Input
            type="url"
            placeholder="https://drive.google.com/..."
            {...form.register("link_presentacion")}
          />
          {form.formState.errors.link_presentacion && (
            <p className="text-xs text-destructive">
              {form.formState.errors.link_presentacion.message}
            </p>
          )}
        </div>

        <div className="space-y-1">
          <Label>Precio cobrado</Label>
          <Input type="number" min="0" step="1" {...form.register("precio_cobrado")} />
        </div>

        <div className="space-y-1">
          <Label>Notas</Label>
          <Textarea rows={3} {...form.register("notas")} />
        </div>

        {planId && (
          <div className="space-y-2 rounded-md border bg-muted/30 p-4">
            <Label className="text-sm font-semibold">Análisis del plan</Label>
            <p className="text-xs text-muted-foreground">
              Por defecto cada análisis queda como <strong>Entregado</strong>. Marca los que no aplican.
            </p>
            {tareasPlan.length === 0 ? (
              <p className="text-xs text-muted-foreground">Sin análisis configurados en este plan.</p>
            ) : (
              <div className="space-y-2 pt-2">
                {tareasPlan.map((t) => {
                  const checked = tareasNoAplica.includes(t.tipo_analisis_id);
                  return (
                    <label
                      key={t.tipo_analisis_id}
                      className="flex items-center justify-between rounded-md border bg-background px-3 py-2 text-sm"
                    >
                      <span className="font-medium">{t.nombre}</span>
                      <span className="flex items-center gap-2">
                        <span
                          className={`text-xs ${
                            checked ? "text-muted-foreground" : "text-emerald-700"
                          }`}
                        >
                          {checked ? "No aplica" : "Entregado"}
                        </span>
                        <Checkbox
                          checked={checked}
                          onCheckedChange={(v) =>
                            toggleNoAplica(t.tipo_analisis_id, v === true)
                          }
                          aria-label="Marcar como no aplica"
                        />
                      </span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/dashboard/portafolio")}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={importar.isPending}>
            {importar.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Importar engagement
          </Button>
        </div>
      </form>
    </DashboardLayout>
  );
};

export default DashboardImportarEngagement;
