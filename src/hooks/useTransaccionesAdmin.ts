import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useTransaccionesAdmin = (estado?: string) => {
  return useQuery({
    queryKey: ["transacciones-admin", estado ?? "todas"],
    queryFn: async () => {
      let q: any = (supabase as any).from("transacciones").select(`
        id, engagement_id, monto_cop, estado, wompi_reference, wompi_transaction_id,
        fecha_creacion, fecha_aprobacion,
        plan:planes_diagnostico(nombre, codigo),
        propietario:perfiles!transacciones_propietario_id_fkey(id, nombre, email),
        engagement:engagements_lote(lote_id, lotes(nombre_lote, ciudad))
      `);
      if (estado) q = q.eq("estado", estado);
      const { data, error } = await q.order("fecha_creacion", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
};
