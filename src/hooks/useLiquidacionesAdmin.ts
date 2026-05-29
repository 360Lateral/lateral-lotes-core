import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useLiquidacionesAdmin = (estado?: string) => {
  return useQuery({
    queryKey: ["liquidaciones-admin", estado ?? "todas"],
    queryFn: async () => {
      let q: any = (supabase as any).from("liquidaciones_experto").select(`
        id, experto_id, orden_id, engagement_id, monto_bruto, fee_pct, fee_monto, monto_neto,
        moneda, estado, metodo_pago, referencia_pago, fecha_generacion, fecha_pago,
        experto:perfiles!liquidaciones_experto_experto_id_fkey(id, nombre, email, telefono),
        tipo:tipos_analisis(nombre),
        orden:ordenes_servicio(lote_id, lotes(nombre_lote, ciudad))
      `);
      if (estado) q = q.eq("estado", estado);
      const { data, error } = await q.order("fecha_generacion", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
};
