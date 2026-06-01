import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { PrecioSuscripcion } from "@/hooks/usePreciosSuscripcion";

export const usePreciosSuscripcionAdmin = () => {
  return useQuery({
    queryKey: ["precios-suscripcion-admin"],
    queryFn: async (): Promise<PrecioSuscripcion[]> => {
      const { data, error } = await supabase
        .from("precios_suscripcion")
        .select("id, nivel, periodo_meses, precio_cop, activo")
        .order("nivel")
        .order("periodo_meses");
      if (error) throw error;
      return (data ?? []) as unknown as PrecioSuscripcion[];
    },
  });
};
