import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface LoteOption {
  id: string;
  nombre_lote: string;
  ciudad: string | null;
}

/**
 * Lista compacta de lotes para selectors admin.
 */
export const useLotesAdminLista = () => {
  return useQuery({
    queryKey: ["lotes-admin-lista"],
    queryFn: async (): Promise<LoteOption[]> => {
      const { data, error } = await supabase
        .from("lotes")
        .select("id, nombre_lote, ciudad")
        .order("nombre_lote", { ascending: true });
      if (error) throw error;
      return (data ?? []) as LoteOption[];
    },
    staleTime: 5 * 60 * 1000,
  });
};
