import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const useMisSolicitudesContacto = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["mis-solicitudes-contacto", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("solicitudes_contacto")
        .select("id, lote_id, mensaje, estado, created_at, fecha_procesado")
        .eq("desarrollador_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
};
