import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const useMisAutorizaciones = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["mis-autorizaciones", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("autorizaciones_comisionista")
        .select(
          `id, comision_pct, estado, fecha_vencimiento, created_at, lote_id,
           lote:lotes(nombre_lote, ciudad, barrio, publicado_venta, estado_publicacion, precio_venta_estimado),
           propietario:perfiles!autorizaciones_comisionista_propietario_id_fkey(nombre)`
        )
        .eq("comisionista_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
};
