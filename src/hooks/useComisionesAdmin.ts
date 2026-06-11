import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { ComisionRow } from "@/types/finanzas";

export const useComisionesAdmin = (estado?: string) => {
  return useQuery<ComisionRow[]>({
    queryKey: ["comisiones-admin", estado ?? "todas"],
    queryFn: async () => {
      let q = supabase.from("comisiones_venta").select(`
        id, base_calculo, comision_pct, comision_monto, estado,
        metodo_pago, referencia_pago, fecha_generacion, fecha_pago,
        comisionista:perfiles!comisiones_venta_comisionista_id_fkey(id, nombre, email),
        lote:lotes(id, nombre_lote, ciudad)
      `);
      if (estado) q = q.eq("estado", estado as "pendiente" | "pagada" | "cancelada");
      const { data, error } = await q.order("fecha_generacion", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as ComisionRow[];
    },
  });
};
