import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface EngagementRow {
  id: string;
  lote_id: string;
  plan_id: string | null;
  cliente_id: string | null;
  lead_id: string | null;
  asesor_asignado_id: string | null;
  gerente_id: string | null;
  estado: string;
  estado_pago: string;
  moneda: string;
  precio_cobrado: number | null;
  avance_pct: number;
  fecha_solicitud: string;
  fecha_inicio: string | null;
  fecha_sla_objetivo: string | null;
  fecha_entrega: string | null;
  notas: string | null;
  created_at: string;
  updated_at: string;
}

const ESTADOS_VIGENTES = ["prospecto", "activo", "en_revision", "entregado"];

export const useEngagementsList = (filtros?: { estado?: string }) => {
  return useQuery({
    queryKey: ["engagements-list", filtros],
    queryFn: async () => {
      let q = supabase.from("engagements_lote").select("*").order("created_at", { ascending: false });
      if (filtros?.estado) q = q.eq("estado", filtros.estado as any);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as EngagementRow[];
    },
  });
};

export const useEngagementsPorLote = (loteId: string | undefined) => {
  return useQuery({
    queryKey: ["engagements-por-lote", loteId],
    enabled: !!loteId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("engagements_lote")
        .select("*, planes_diagnostico(codigo, nombre)")
        .eq("lote_id", loteId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as any[];
    },
  });
};

/** Returns map loteId -> active engagement (vigente) */
export const useEngagementsActivosPorLotes = (loteIds: string[]) => {
  return useQuery({
    queryKey: ["engagements-activos-lotes", loteIds.sort().join(",")],
    enabled: loteIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("engagements_lote")
        .select("id, lote_id, estado, plan_id, created_at, planes_diagnostico(codigo, nombre)")
        .in("lote_id", loteIds)
        .in("estado", ESTADOS_VIGENTES as any)
        .order("created_at", { ascending: false });
      if (error) throw error;
      const map: Record<string, any> = {};
      for (const row of data ?? []) {
        if (!map[row.lote_id]) map[row.lote_id] = row;
      }
      return map;
    },
  });
};

export interface CrearEngagementInput {
  lote_id: string;
  plan_id: string;
  tipo_cliente: "lead" | "perfil";
  cliente_id: string | null; // perfil.id when tipo=perfil, lead.id when tipo=lead, or null
  asesor_asignado_id: string;
  gerente_id?: string | null;
  fecha_inicio?: string | null;
  precio_cobrado?: number | null;
  moneda?: string;
  notas?: string | null;
  dias_sla?: number | null;
}

export const useCrearEngagement = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CrearEngagementInput) => {
      const clientePerfilId = input.tipo_cliente === "perfil" ? input.cliente_id : null;
      const { data: idRaw, error } = await supabase.rpc("crear_engagement", {
        p_lote_id: input.lote_id,
        p_plan_id: input.plan_id,
        p_cliente_id: clientePerfilId,
      });
      if (error) throw error;
      const engagementId = idRaw as unknown as string;

      // Patch extra fields
      const patch: any = {
        asesor_asignado_id: input.asesor_asignado_id,
        gerente_id: input.gerente_id ?? null,
        notas: input.notas ?? null,
        moneda: input.moneda ?? "COP",
        precio_cobrado: input.precio_cobrado ?? null,
      };
      if (input.tipo_cliente === "lead") {
        patch.lead_id = input.cliente_id;
      }
      if (input.fecha_inicio) {
        patch.fecha_inicio = input.fecha_inicio;
        if (input.dias_sla != null) {
          const base = new Date(input.fecha_inicio);
          base.setDate(base.getDate() + input.dias_sla);
          patch.fecha_sla_objetivo = base.toISOString();
        }
      }

      const { error: upErr } = await supabase
        .from("engagements_lote")
        .update(patch)
        .eq("id", engagementId);
      if (upErr) throw upErr;

      // Count generated tasks
      const { count } = await supabase
        .from("tareas_analisis")
        .select("id", { count: "exact", head: true })
        .eq("engagement_id", engagementId);

      return { id: engagementId, tareas: count ?? 0 };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["engagements-list"] });
      qc.invalidateQueries({ queryKey: ["engagements-por-lote"] });
      qc.invalidateQueries({ queryKey: ["engagements-activos-lotes"] });
    },
    onError: (err: any) => {
      toast.error("Error al crear engagement", { description: err.message });
    },
  });
};

export const useActualizarEngagement = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<EngagementRow> }) => {
      const { error } = await supabase.from("engagements_lote").update(patch as any).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["engagements-list"] });
      qc.invalidateQueries({ queryKey: ["engagements-por-lote"] });
      qc.invalidateQueries({ queryKey: ["engagements-activos-lotes"] });
    },
    onError: (err: any) => {
      toast.error("Error al actualizar engagement", { description: err.message });
    },
  });
};
