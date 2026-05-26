import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type EstadoPublicacionLote =
  | "pendiente_validacion"
  | "aprobado"
  | "rechazado"
  | "retirado";

export interface ActivoPropietario {
  id: string;
  nombre_lote: string | null;
  ciudad: string | null;
  barrio: string | null;
  publicado_venta: boolean;
  estado_publicacion: EstadoPublicacionLote;
  precio_venta_estimado: number | null;
  notas_publicacion: string | null;
  foto_url: string | null;
  created_at: string;
}

export const useMisActivos = (propietarioId: string | undefined) => {
  return useQuery({
    queryKey: ["mis-activos", propietarioId],
    enabled: !!propietarioId,
    queryFn: async (): Promise<ActivoPropietario[]> => {
      const { data, error } = await supabase
        .from("lotes")
        .select(
          "id, nombre_lote, ciudad, barrio, publicado_venta, estado_publicacion, precio_venta_estimado, notas_publicacion, foto_url, created_at"
        )
        .eq("propietario_id", propietarioId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as ActivoPropietario[];
    },
  });
};
