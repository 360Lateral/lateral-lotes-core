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
      // 1) Obtener owner_ids asociados al usuario vía usuario_owner
      const { data: assocs, error: assocErr } = await supabase
        .from("usuario_owner")
        .select("owner_id")
        .eq("user_id", propietarioId!);
      if (assocErr) throw assocErr;

      const ids = Array.from(
        new Set([propietarioId!, ...((assocs ?? []).map((a: any) => a.owner_id))])
      );

      // 2) Traer lotes cuyo propietario_id sea el usuario o cualquiera de sus owners asociados
      const { data, error } = await supabase
        .from("lotes")
        .select(
          "id, nombre_lote, ciudad, barrio, publicado_venta, estado_publicacion, precio_venta_estimado, notas_publicacion, foto_url, created_at"
        )
        .in("propietario_id", ids)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as ActivoPropietario[];
    },
  });
};
