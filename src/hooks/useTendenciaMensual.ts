import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface TendenciaMensualFila {
  mes: string;
  mes_label: string;
  engagements_creados: number;
  engagements_completados: number;
  ingresos_cop: number;
  leads_nuevos: number;
}

export const useTendenciaMensual = (mesesAtras: number = 12) => {
  return useQuery({
    queryKey: ["tendencia-mensual", mesesAtras],
    staleTime: 60_000,
    queryFn: async (): Promise<TendenciaMensualFila[]> => {
      const { data, error } = await supabase.rpc(
        "obtener_tendencia_mensual" as any,
        { p_meses_atras: mesesAtras },
      );
      if (error) throw error;
      return (data ?? []) as unknown as TendenciaMensualFila[];
    },
  });
};
