import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { EstadoPublicacionLote } from "./useMisActivos";

export interface LotePendienteValidacion {
  id: string;
  nombre_lote: string | null;
  ciudad: string | null;
  barrio: string | null;
  propietario_id: string | null;
  publicado_venta: boolean;
  estado_publicacion: EstadoPublicacionLote;
  precio_venta_estimado: number | null;
  created_at: string;
  perfiles: { nombre: string | null; email: string | null } | null;
}

export const useLotesPendientesValidacion = () => {
  return useQuery({
    queryKey: ["lotes-pendientes-validacion"],
    queryFn: async (): Promise<LotePendienteValidacion[]> => {
      const { data, error } = await supabase
        .from("lotes")
        .select(
          "id, nombre_lote, ciudad, barrio, propietario_id, publicado_venta, estado_publicacion, precio_venta_estimado, created_at, perfiles!lotes_propietario_id_fkey(nombre, email)"
        )
        .eq("estado_publicacion", "pendiente_validacion")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as LotePendienteValidacion[];
    },
  });
};
