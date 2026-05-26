import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface HistorialNivelEntry {
  id: string;
  nivel_anterior: string | null;
  nivel_nuevo: string;
  motivo: string | null;
  origen: string;
  created_at: string;
  cambiado_por_perfil: { nombre: string | null; email: string | null } | null;
}

export const useHistorialNivel = (desarrolladorId: string | undefined) => {
  return useQuery({
    queryKey: ["audit-nivel-suscripcion", desarrolladorId],
    enabled: !!desarrolladorId,
    queryFn: async (): Promise<HistorialNivelEntry[]> => {
      const { data, error } = await supabase
        .from("audit_nivel_suscripcion")
        .select(
          `id, nivel_anterior, nivel_nuevo, motivo, origen, created_at,
           cambiado_por_perfil:perfiles!audit_nivel_suscripcion_cambiado_por_fkey(nombre, email)`
        )
        .eq("desarrollador_id", desarrolladorId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as HistorialNivelEntry[];
    },
  });
};
