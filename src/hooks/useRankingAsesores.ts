import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { periodoToFechas } from "@/lib/periodoToFechas";

export interface RankingAsesoresFila {
  asesor_id: string;
  asesor_nombre: string;
  engagements_totales: number;
  engagements_activos: number;
  engagements_entregados: number;
  avance_promedio: number;
  tiempo_medio_cierre_dias: number | null;
  sla_cumplidos_pct: number | null;
  ingresos_generados_cop: number;
}

export function useRankingAsesores(mesesAtras: number) {
  const { desde, hasta } = periodoToFechas(mesesAtras);
  return useQuery({
    queryKey: ["ranking-asesores", mesesAtras],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("obtener_ranking_asesores", {
        p_desde: desde,
        p_hasta: hasta,
      } as never);
      if (error) throw error;
      return (data ?? []) as unknown as RankingAsesoresFila[];
    },
  });
}
