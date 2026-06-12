import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface StatsMercado {
  totalLotes: number;
  totalMunicipios: number;
  totalPublicados7d: number;
}

export const useStatsMercado = () => {
  return useQuery<StatsMercado>({
    queryKey: ["stats-mercado"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("vw_mercado_publico")
        .select("ciudad,publicado_en");
      if (error) throw error;
      const rows = (data ?? []) as Array<{ ciudad: string | null; publicado_en: string | null }>;
      const ciudades = new Set<string>();
      let recientes = 0;
      const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
      rows.forEach((r) => {
        if (r.ciudad) ciudades.add(r.ciudad);
        if (r.publicado_en && new Date(r.publicado_en).getTime() > cutoff) recientes += 1;
      });
      return {
        totalLotes: rows.length,
        totalMunicipios: ciudades.size,
        totalPublicados7d: recientes,
      };
    },
    staleTime: 5 * 60 * 1000,
  });
};
