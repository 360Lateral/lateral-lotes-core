import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ResumenFinanciero {
  diagnosticos: { ingresos: number; num_transacciones: number };
  expertos: { pagado: number; pendiente: number; fee_retenido_360: number; num_liquidaciones: number };
  ventas: { num_ventas: number; valor_transado: number; fee_360: number };
  comisiones: { pagado: number; pendiente: number; num: number };
  balance: { entradas: number; salidas_pagadas: number; pendiente_por_pagar: number; margen_diagnosticos: number };
}

export const useResumenFinanciero = (desde?: string, hasta?: string) => {
  return useQuery<ResumenFinanciero>({
    queryKey: ["resumen-financiero", desde ?? null, hasta ?? null],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("obtener_resumen_financiero", {
        p_desde: desde ?? null,
        p_hasta: hasta ?? null,
      });
      if (error) throw error;
      return data as unknown as ResumenFinanciero;
    },
  });
};
