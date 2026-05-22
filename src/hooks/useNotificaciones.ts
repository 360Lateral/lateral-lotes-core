import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Notificacion {
  id: string;
  destinatario_id: string;
  tipo: string;
  nivel: "amarillo" | "rojo" | string;
  estado: "pendiente" | "leida" | "resuelta";
  titulo: string;
  mensaje: string;
  entidad_tipo: string;
  entidad_id: string;
  data: Record<string, unknown> | null;
  created_at: string;
  leida_at: string | null;
  resuelta_at: string | null;
}

export function useNotificaciones(soloPendientes = false, limit = 30) {
  return useQuery({
    queryKey: ["notificaciones", soloPendientes, limit],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("listar_notificaciones", {
        p_solo_pendientes: soloPendientes,
        p_limit: limit,
      } as never);
      if (error) throw error;
      return (data ?? []) as unknown as Notificacion[];
    },
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
  });
}
