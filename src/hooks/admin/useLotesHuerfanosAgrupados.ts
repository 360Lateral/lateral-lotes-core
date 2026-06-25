import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface GrupoLotesHuerfanos {
  nombre_propietario: string;
  cantidad_lotes: number;
  area_total_m2: number;
  valoracion_total: number | null;
  primer_lote_creado: string;
  ultimo_lote_creado: string;
  lote_ids: string[];
  nombres_lotes: string[];
}

export const useLotesHuerfanosAgrupados = () => {
  return useQuery({
    queryKey: ["lotes-huerfanos-agrupados"],
    queryFn: async (): Promise<GrupoLotesHuerfanos[]> => {
      const { data, error } = await (supabase as any)
        .from("vw_lotes_huerfanos_agrupados")
        .select("*");
      if (error) throw error;
      return (data ?? []) as GrupoLotesHuerfanos[];
    },
    staleTime: 30_000,
  });
};

export const useCountLotesHuerfanos = () => {
  const { data } = useLotesHuerfanosAgrupados();
  return data?.length ?? 0;
};
