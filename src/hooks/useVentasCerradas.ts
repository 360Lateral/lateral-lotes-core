import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useVentasCerradas = () => {
  return useQuery({
    queryKey: ["ventas-cerradas"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("negociaciones")
        .select(`
          id, precio_venta_final, fee_360_pct, fee_360_monto,
          comprador_externo, fecha_cierre, cerrada_por, developer_id,
          lote:lotes(id, nombre_lote, ciudad, barrio),
          cerrada_por_perfil:perfiles!negociaciones_cerrada_por_fkey(nombre),
          developer:perfiles!negociaciones_developer_id_fkey(nombre, email)
        `)
        .eq("estado", "concretada")
        .order("fecha_cierre", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
};
