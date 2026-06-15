import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface EngagementDetalle {
  id: string;
  lote_id: string;
  plan_id: string | null;
  cliente_id: string | null;
  asesor_asignado_id: string | null;
  estado: string;
  estado_activacion: string | null;
  avance_pct: number;
  fecha_inicio: string | null;
  fecha_sla_objetivo: string | null;
  fecha_entrega: string | null;
  fecha_solicitud: string;
  created_at: string;
  updated_at: string;
  notas: string | null;
  mostrar_avance_al_cliente: boolean;
  lote: {
    id: string;
    nombre_lote: string | null;
    direccion: string | null;
    ciudad: string | null;
    area_total_m2: number | null;
    propietario: { id: string; nombre: string | null; email: string | null } | null;
  } | null;
  plan: {
    id: string;
    codigo: string;
    nombre: string;
    precio_cop: number | null;
  } | null;
  cliente: { id: string; nombre: string | null; email: string | null } | null;
  asesor: { id: string; nombre: string | null; email: string | null } | null;
}

export const useEngagementDetalle = (engagementId: string | undefined) => {
  return useQuery({
    queryKey: ["engagement-detalle", engagementId],
    enabled: !!engagementId,
    queryFn: async (): Promise<EngagementDetalle | null> => {
      const { data, error } = await supabase
        .from("engagements_lote")
        .select(
          `
          id, lote_id, plan_id, cliente_id, asesor_asignado_id, estado,
          estado_activacion,
          avance_pct, fecha_inicio, fecha_sla_objetivo, fecha_entrega, fecha_solicitud,
          created_at, updated_at, notas, mostrar_avance_al_cliente,
          lote:lotes!engagements_lote_lote_id_fkey ( id, nombre_lote, direccion, ciudad, area_total_m2, propietario:perfiles!lotes_propietario_id_fkey ( id, nombre, email ) ),
          plan:planes_diagnostico!engagements_lote_plan_id_fkey ( id, codigo, nombre, precio_cop ),
          cliente:perfiles!engagements_lote_cliente_id_fkey ( id, nombre, email ),
          asesor:perfiles!engagements_lote_asesor_asignado_id_fkey ( id, nombre, email )
        `,
        )
        .eq("id", engagementId!)
        .maybeSingle();
      if (error) throw error;
      return data as unknown as EngagementDetalle | null;
    },
  });
};
