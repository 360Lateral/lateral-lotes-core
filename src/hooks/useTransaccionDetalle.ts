import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useTransaccionDetalle = (transaccionId: string | undefined) => {
  return useQuery({
    queryKey: ["transaccion-detalle", transaccionId],
    enabled: !!transaccionId,
    queryFn: async () => {
      const { data: trans, error } = await (supabase as any)
        .from("transacciones")
        .select(`
          id, engagement_id, monto_cop, monto_smlmv, smlmv_referencia, moneda,
          wompi_reference, wompi_transaction_id, wompi_status, wompi_payment_link_url,
          estado, error_msg, metadata, fecha_creacion, fecha_aprobacion,
          plan:planes_diagnostico(nombre, precio_smlmv),
          propietario:perfiles!transacciones_propietario_id_fkey(id, nombre, email, telefono),
          engagement:engagements_lote(
            lote_id, estado_activacion,
            lotes(id, nombre_lote, ciudad, barrio)
          )
        `)
        .eq("id", transaccionId!)
        .single();
      if (error) throw error;

      const { data: eventos } = await (supabase as any)
        .from("eventos_wompi")
        .select("id, evento_id_externo, tipo_evento, procesado, error_procesamiento, recibido_en, procesado_en")
        .eq("transaccion_id", transaccionId!)
        .order("recibido_en", { ascending: false });

      return { transaccion: trans, eventos: (eventos ?? []) as any[] };
    },
  });
};
