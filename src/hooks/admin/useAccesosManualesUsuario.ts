import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface AccesoManualUsuario {
  id: string;
  lote_id: string;
  fecha_compra: string | null;
  fecha_expiracion: string | null;
  estado: string;
  motivo: string | null;
  otorgado_por: string | null;
  lote: { nombre_lote: string | null; ciudad: string | null } | null;
}

export const useAccesosManualesUsuario = (userId: string | undefined) => {
  return useQuery({
    queryKey: ["accesos-manuales-usuario", userId],
    enabled: !!userId,
    queryFn: async (): Promise<AccesoManualUsuario[]> => {
      const { data, error } = await supabase
        .from("accesos_lote")
        .select(
          `id, lote_id, fecha_compra, fecha_expiracion, estado, motivo, otorgado_por,
           lote:lotes(nombre_lote, ciudad)`,
        )
        .eq("desarrollador_id", userId!)
        .eq("tipo", "manual_admin")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as AccesoManualUsuario[];
    },
    staleTime: 30_000,
  });
};
