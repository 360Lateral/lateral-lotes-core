import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ConfigPayPerView {
  id: number;
  precio_cop: number;
  dias_acceso: number;
  activo: boolean;
  updated_at: string;
}

export const useConfigPayPerView = () => {
  return useQuery({
    queryKey: ["config-payperview"],
    queryFn: async (): Promise<ConfigPayPerView | null> => {
      const { data, error } = await supabase
        .from("config_payperview")
        .select("*")
        .eq("id", 1)
        .maybeSingle();
      if (error) throw error;
      return (data ?? null) as unknown as ConfigPayPerView | null;
    },
  });
};
