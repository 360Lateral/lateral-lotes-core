import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const useMisLiquidaciones = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["mis-liquidaciones", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("liquidaciones_experto")
        .select(`
          id, monto_bruto, fee_pct, fee_monto, monto_neto, moneda, estado,
          metodo_pago, fecha_generacion, fecha_pago,
          tipo:tipos_analisis(nombre),
          orden:ordenes_servicio(lote_id, lotes(nombre_lote, ciudad))
        `)
        .eq("experto_id", user!.id)
        .order("fecha_generacion", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
};
