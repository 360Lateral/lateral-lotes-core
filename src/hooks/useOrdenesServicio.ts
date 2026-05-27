import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useOrdenesServicio = (estado?: string) => {
  return useQuery({
    queryKey: ["ordenes-servicio", estado ?? "todas"],
    queryFn: async () => {
      let q: any = (supabase as any)
        .from("ordenes_servicio")
        .select(`
          id, lote_id, tipo_analisis_id, contrato_marco_id, engagement_id,
          estado, visibilidad, fecha_limite_propuestas, ganador_propuesta_id,
          notas_admin, created_at,
          lote:lotes(nombre_lote, ciudad, barrio),
          tipo:tipos_analisis(nombre, codigo),
          contrato:contratos_marco(version, precio_min, precio_max, plazo_min_dias, plazo_max_dias, moneda),
          creador:perfiles!ordenes_servicio_creado_por_fkey(nombre)
        `);
      if (estado) q = q.eq("estado", estado);
      const { data, error } = await q.order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
};
