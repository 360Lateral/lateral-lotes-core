import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface EngagementDelLote {
  id: string;
  estado: string;
  cerrado: boolean;
  avance_pct: number | null;
}

/**
 * Engagement para enlazar desde el dashboard: prioriza el activo más reciente
 * y, si no hay, devuelve el último cerrado (no cancelados), para no invitar a
 * crear uno nuevo cuando el lote ya tiene historial.
 */
export const useEngagementDelLote = (loteId: string | undefined) => {
  return useQuery({
    queryKey: ["engagement-del-lote", loteId],
    enabled: !!loteId,
    queryFn: async (): Promise<EngagementDelLote | null> => {
      const { data, error } = await (supabase as any)
        .from("engagements_lote")
        .select("id, estado, avance_pct, created_at")
        .eq("lote_id", loteId)
        .neq("estado", "cancelado")
        .order("created_at", { ascending: false });
      if (error) throw error;
      const lista: { id: string; estado: string; avance_pct: number | string | null }[] = data ?? [];
      const activo = lista.find((e) => e.estado !== "cerrado");
      const elegido = activo ?? lista[0];
      if (!elegido) return null;
      return {
        id: elegido.id,
        estado: elegido.estado,
        cerrado: elegido.estado === "cerrado",
        avance_pct: elegido.avance_pct != null ? Number(elegido.avance_pct) : null,
      };
    },
    staleTime: 60 * 1000,
  });
};
