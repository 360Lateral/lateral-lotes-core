import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const useMisOrdenesExperto = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["mis-ordenes-experto", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("ordenes_servicio")
        .select(`
          id, lote_id, tipo_analisis_id, contrato_marco_id,
          estado, visibilidad, fecha_limite_propuestas, created_at,
          lote:lotes(nombre_lote, ciudad, barrio),
          tipo:tipos_analisis(nombre, codigo),
          contrato:contratos_marco(precio_min, precio_max, plazo_min_dias, plazo_max_dias, moneda)
        `)
        .eq("estado", "abierta")
        .order("fecha_limite_propuestas", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
};
