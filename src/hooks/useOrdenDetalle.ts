import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useOrdenDetalle = (ordenId: string | undefined) => {
  return useQuery({
    queryKey: ["orden-detalle", ordenId],
    enabled: !!ordenId,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("ordenes_servicio")
        .select(`
          id, lote_id, tipo_analisis_id, contrato_marco_id, engagement_id,
          estado, visibilidad, fecha_limite_propuestas, ganador_propuesta_id,
          notas_admin, creado_por, created_at, updated_at,
          lote:lotes(nombre_lote, ciudad, barrio),
          tipo:tipos_analisis(nombre, codigo),
          contrato:contratos_marco(version, precio_min, precio_max, plazo_min_dias, plazo_max_dias, moneda, contenido_legal),
          creador:perfiles!ordenes_servicio_creado_por_fkey(nombre, email),
          invitaciones:invitaciones_orden(experto_id, experto:perfiles!invitaciones_orden_experto_id_fkey(nombre, email))
        `)
        .eq("id", ordenId!)
        .single();
      if (error) throw error;
      return data;
    },
  });
};
