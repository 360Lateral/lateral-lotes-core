import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface UltimaTransaccion {
  id: string;
  estado: string;
  monto_cop: number;
  fecha_creacion: string;
  wompi_payment_link_url: string | null;
}

export const useUltimaTransaccionEngagement = (engagementId: string | undefined) => {
  return useQuery({
    queryKey: ["ultima-transaccion", engagementId],
    enabled: !!engagementId,
    queryFn: async (): Promise<UltimaTransaccion | null> => {
      const { data, error } = await (supabase as any)
        .from("transacciones")
        .select("id, estado, monto_cop, fecha_creacion, wompi_payment_link_url")
        .eq("engagement_id", engagementId!)
        .order("fecha_creacion", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return (data as UltimaTransaccion | null) ?? null;
    },
  });
};
