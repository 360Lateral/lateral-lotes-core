import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const useMisPropuestas = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["mis-propuestas", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("propuestas_experto")
        .select(`
          id, orden_id, precio_propuesto, plazo_propuesto_dias, mensaje_experto,
          estado, fecha_propuesta,
          orden:ordenes_servicio(
            lote_id, tipo_analisis_id, estado,
            lote:lotes(nombre_lote, ciudad),
            tipo:tipos_analisis(nombre)
          )
        `)
        .eq("experto_id", user!.id)
        .order("fecha_propuesta", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
};
