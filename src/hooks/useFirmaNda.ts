import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { NDA_VERSION } from "@/lib/nda";

export const useFirmaNda = (loteId: string | undefined) => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["nda-firmado", user?.id, loteId, NDA_VERSION],
    enabled: !!user?.id && !!loteId,
    queryFn: async (): Promise<boolean> => {
      const { data, error } = await supabase
        .from("ndas_firmados")
        .select("id")
        .eq("desarrollador_id", user!.id)
        .eq("lote_id", loteId!)
        .eq("version_nda", NDA_VERSION)
        .maybeSingle();
      if (error) throw error;
      return !!data;
    },
  });
};
