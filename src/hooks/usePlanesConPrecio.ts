import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface PlanConPrecio {
  id: string;
  codigo: string;
  nombre: string;
  precio_smlmv: number;
  precio_cop_legacy: number | null;
  precio_cop_actual: number;
  moneda: string;
  dias_sla: number;
  orden: number;
  activo: boolean;
  descripcion_corta: string | null;
  para_quien: string | null;
  recomendado: boolean;
  smlmv_referencia: number;
  smlmv_anio: number;
}

export const usePlanesConPrecio = () => {
  return useQuery({
    queryKey: ["planes-con-precio"],
    queryFn: async (): Promise<PlanConPrecio[]> => {
      const { data, error } = await (supabase as any)
        .from("vw_planes_con_precio")
        .select("*")
        .order("orden");
      if (error) throw error;
      return (data ?? []) as PlanConPrecio[];
    },
    staleTime: 5 * 60 * 1000,
  });
};
