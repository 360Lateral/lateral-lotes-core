import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { NivelSuscripcion } from "@/hooks/useNivelSuscripcion";

export interface PrecioSuscripcion {
  id: string;
  nivel: NivelSuscripcion;
  periodo_meses: number;
  precio_cop: number;
  activo: boolean;
}

export const usePreciosSuscripcion = () => {
  return useQuery({
    queryKey: ["precios-suscripcion"],
    queryFn: async (): Promise<PrecioSuscripcion[]> => {
      const { data, error } = await supabase
        .from("precios_suscripcion")
        .select("id, nivel, periodo_meses, precio_cop, activo")
        .eq("activo", true)
        .order("nivel")
        .order("periodo_meses");
      if (error) throw error;
      return (data ?? []) as unknown as PrecioSuscripcion[];
    },
  });
};
