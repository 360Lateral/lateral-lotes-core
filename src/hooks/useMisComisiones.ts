import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { ComisionRow } from "@/types/finanzas";

export const useMisComisiones = () => {
  const { user } = useAuth();
  return useQuery<ComisionRow[]>({
    queryKey: ["mis-comisiones", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("comisiones_venta")
        .select(`
          id, base_calculo, comision_pct, comision_monto, estado,
          metodo_pago, fecha_generacion, fecha_pago,
          lote:lotes(id, nombre_lote, ciudad)
        `)
        .eq("comisionista_id", user!.id)
        .order("fecha_generacion", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as ComisionRow[];
    },
  });
};
