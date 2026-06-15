import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface EngagementVigente {
  id: string;
  estado: string;
}

/**
 * Devuelve el engagement más reciente del lote que NO esté en estado
 * 'cerrado' o 'cancelado'. Útil para vincular las vistas de análisis del
 * lote con su engagement vigente.
 */
export const useEngagementVigenteDeLote = (loteId: string | undefined) => {
  return useQuery({
    queryKey: ["engagement-vigente-lote", loteId],
    enabled: !!loteId,
    queryFn: async (): Promise<EngagementVigente | null> => {
      const { data, error } = await (supabase as any)
        .from("engagements_lote")
        .select("id, estado")
        .eq("lote_id", loteId)
        .not("estado", "in", "(cerrado,cancelado)")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return (data as EngagementVigente | null) ?? null;
    },
  });
};
