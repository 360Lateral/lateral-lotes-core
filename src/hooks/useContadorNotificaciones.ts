import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useContadorNotificaciones() {
  const { data, isLoading } = useQuery({
    queryKey: ["notificaciones-count"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("contar_notificaciones_pendientes");
      if (error) throw error;
      return Number(data ?? 0);
    },
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
  });
  return { count: data ?? 0, isLoading };
}
