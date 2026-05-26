import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useSolicitudesContactoPendientes = () => {
  return useQuery({
    queryKey: ["solicitudes-contacto-pendientes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("solicitudes_contacto")
        .select(`
          id, mensaje, estado, created_at,
          desarrollador:perfiles!solicitudes_contacto_desarrollador_id_fkey(id, nombre, email, telefono, nivel_suscripcion),
          lote:lotes!solicitudes_contacto_lote_id_fkey(id, nombre_lote, ciudad, barrio, propietario_id)
        `)
        .eq("estado", "pendiente")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
};
