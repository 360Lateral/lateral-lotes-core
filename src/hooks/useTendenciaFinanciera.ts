import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface TendenciaFinancieraMes {
  mes: string;
  ingresos_diagnostico: number;
  fee_ventas: number;
  valor_transado: number;
  pagos_expertos: number;
  comisiones: number;
}

export const useTendenciaFinanciera = (meses = 12) => {
  return useQuery<TendenciaFinancieraMes[]>({
    queryKey: ["tendencia-financiera", meses],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("obtener_tendencia_financiera", { p_meses: meses });
      if (error) throw error;
      return (data ?? []) as unknown as TendenciaFinancieraMes[];
    },
  });
};
