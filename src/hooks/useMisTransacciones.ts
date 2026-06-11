import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { TransaccionRow } from "@/types/finanzas";

export const useMisTransacciones = () => {
  const { user } = useAuth();
  return useQuery<TransaccionRow[]>({
    queryKey: ["mis-transacciones", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transacciones")
        .select(`
          id, engagement_id, monto_cop, estado, wompi_payment_link_url,
          fecha_creacion, fecha_aprobacion, fecha_expiracion,
          plan:planes_diagnostico(nombre, codigo),
          engagement:engagements_lote(lote_id, lotes(nombre_lote, ciudad))
        `)
        .eq("propietario_id", user!.id)
        .order("fecha_creacion", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as TransaccionRow[];
    },
  });
};
