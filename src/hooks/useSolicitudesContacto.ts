import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type EstadoSolicitud = "pendiente" | "contactado" | "cerrado";

export const useSolicitudesContacto = (estado: EstadoSolicitud = "pendiente") => {
  return useQuery({
    queryKey: ["solicitudes-contacto", estado],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("solicitudes_contacto")
        .select(`
          id, mensaje, estado, created_at, fecha_procesado, notas_admin,
          desarrollador:perfiles!solicitudes_contacto_desarrollador_id_fkey(id, nombre, email, telefono, nivel_suscripcion),
          lote:lotes!solicitudes_contacto_lote_id_fkey(id, nombre_lote, ciudad, barrio, propietario_id),
          procesador:perfiles!solicitudes_contacto_procesado_por_fkey(nombre)
        `)
        .eq("estado", estado)
        .order(estado === "pendiente" ? "created_at" : "fecha_procesado", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
};
