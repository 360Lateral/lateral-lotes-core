import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface LoteRecomendado {
  lote_id: string;
  ciudad: string | null;
  barrio: string | null;
  area_total_m2: number | null;
  estrato: number | null;
  tipo_lote: string | null;
  nombre_lote: string | null;
  similitud_score: number;
}

export const useLotesRecomendados = (limit = 6) => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["lotes-recomendados", user?.id, limit],
    enabled: !!user?.id,
    queryFn: async (): Promise<LoteRecomendado[]> => {
      const { data, error } = await (supabase.rpc as any)("lotes_recomendados_desarrollador", {
        p_user_id: user!.id,
        p_limit: limit,
      });
      if (error) throw error;
      return (data as LoteRecomendado[]) ?? [];
    },
  });
};
