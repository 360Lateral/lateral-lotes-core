import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { TransaccionRow } from "@/types/finanzas";

export const useTransaccionesAdmin = (estado?: string) => {
  return useQuery<TransaccionRow[]>({
    queryKey: ["transacciones-admin", estado ?? "todas"],
    queryFn: async () => {
      let q = supabase.from("transacciones").select(`
        id, engagement_id, monto_cop, estado, wompi_reference, wompi_transaction_id,
        wompi_status, tipo_pago, error_msg,
        fecha_creacion, fecha_aprobacion,
        plan:planes_diagnostico(nombre, codigo),
        propietario:perfiles!transacciones_propietario_id_fkey(id, nombre, email),
        engagement:engagements_lote(lote_id, lotes(nombre_lote, ciudad))
      `);
      if (estado) q = q.eq("estado", estado as "pendiente" | "aprobada" | "declinada" | "expirada" | "reembolsada" | "error");
      const { data, error } = await q.order("fecha_creacion", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as TransaccionRow[];
    },
  });
};
