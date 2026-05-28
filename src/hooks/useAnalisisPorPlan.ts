import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface AnalisisIncluido {
  plan_id: string;
  tipo_analisis_id: string;
  codigo: string;
  nombre: string;
}

export const useAnalisisPorPlan = () => {
  return useQuery({
    queryKey: ["analisis-por-plan"],
    queryFn: async (): Promise<AnalisisIncluido[]> => {
      const { data, error } = await (supabase as any)
        .from("planes_analisis")
        .select("plan_id, tipo_analisis_id, incluido, tipos_analisis(codigo, nombre)")
        .eq("incluido", true);
      if (error) throw error;
      return (data ?? []).map((r: any) => ({
        plan_id: r.plan_id,
        tipo_analisis_id: r.tipo_analisis_id,
        codigo: r.tipos_analisis?.codigo,
        nombre: r.tipos_analisis?.nombre,
      }));
    },
    staleTime: 5 * 60 * 1000,
  });
};
