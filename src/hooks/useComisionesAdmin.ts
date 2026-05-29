import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useComisionesAdmin = (estado?: string) => {
  return useQuery({
    queryKey: ["comisiones-admin", estado ?? "todas"],
    queryFn: async () => {
      let q: any = (supabase as any).from("comisiones_venta").select(`
        id, negociacion_id, lote_id, comisionista_id, autorizacion_id,
        base_calculo, comision_pct, comision_monto, estado,
        metodo_pago, referencia_pago, notas, fecha_generacion, fecha_pago,
        comisionista:perfiles!comisiones_venta_comisionista_id_fkey(id, nombre, email, telefono),
        lote:lotes(id, nombre_lote, ciudad)
      `);
      if (estado) q = q.eq("estado", estado);
      const { data, error } = await q.order("fecha_generacion", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
};
