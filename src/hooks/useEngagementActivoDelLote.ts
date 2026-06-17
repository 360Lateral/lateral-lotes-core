import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Devuelve el ID del último engagement activo del lote (no cerrado/cancelado).
 * Utilidad ligera para enlaces y redirects.
 */
export const useEngagementActivoDelLote = (loteId: string | undefined) => {
  return useQuery({
    queryKey: ["engagement-activo-lote", loteId],
    enabled: !!loteId,
    queryFn: async (): Promise<string | null> => {
      const { data, error } = await (supabase as any)
        .from("engagements_lote")
        .select("id")
        .eq("lote_id", loteId)
        .not("estado", "in", "(cerrado,cancelado)")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return (data?.id as string | undefined) ?? null;
    },
    staleTime: 60 * 1000,
  });
};
