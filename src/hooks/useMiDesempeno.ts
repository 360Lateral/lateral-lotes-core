import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { MetricaExperto } from "./useMetricasExpertos";

export const useMiDesempeno = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["mi-desempeno", user?.id],
    enabled: !!user?.id,
    queryFn: async (): Promise<MetricaExperto | null> => {
      const { data, error } = await (supabase as any)
        .from("vw_metricas_experto")
        .select("*")
        .eq("experto_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data as MetricaExperto | null;
    },
  });
};
