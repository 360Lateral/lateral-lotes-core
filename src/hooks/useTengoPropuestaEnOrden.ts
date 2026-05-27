import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const useTengoPropuestaEnOrden = (ordenId: string | undefined) => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["tengo-propuesta", user?.id, ordenId],
    enabled: !!user?.id && !!ordenId,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("propuestas_experto")
        .select("id, estado")
        .eq("experto_id", user!.id)
        .eq("orden_id", ordenId!)
        .maybeSingle();
      if (error) throw error;
      return data as { id: string; estado: string } | null;
    },
  });
};
