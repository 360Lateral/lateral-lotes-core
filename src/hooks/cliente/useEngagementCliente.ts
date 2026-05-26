import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface EntregablePublicado {
  id: string;
  tipo: string;
  tipo_analisis_id: string | null;
  nombre: string;
  version: number;
  notas: string | null;
  created_at: string;
  updated_at: string;
  url_externa?: string | null;
  storage_path?: string | null;
  tiene_archivo?: boolean;
  tiene_url_externa?: boolean;
}

export interface TareaAvance {
  id: string;
  nombre: string;
  tipo_codigo: string | null;
  tipo_analisis_id: string | null;
  estado: string;
}

export interface EngagementClienteDetalle {
  engagement: {
    id: string;
    estado: string;
    avance_pct: number;
    fecha_inicio: string | null;
    fecha_sla: string | null;
    mostrar_avance_al_cliente: boolean;
  };
  lote: {
    id: string;
    nombre_lote: string | null;
    direccion: string | null;
    ciudad: string | null;
  } | null;
  plan: {
    id: string;
    codigo: string | null;
    nombre: string | null;
  } | null;
  asesor: {
    id: string;
    nombre: string | null;
    email: string | null;
  } | null;
  avance: {
    mostrar_detalle: boolean;
    tareas: TareaAvance[];
  };
  entregables_publicados: EntregablePublicado[];
}

export const useEngagementCliente = (engagementId: string | undefined) => {
  return useQuery({
    queryKey: ["engagement-cliente", engagementId],
    enabled: !!engagementId,
    refetchOnWindowFocus: true,
    retry: false,
    queryFn: async (): Promise<EngagementClienteDetalle | null> => {
      const { data, error } = await supabase.rpc(
        "obtener_engagement_para_cliente" as any,
        { p_engagement_id: engagementId },
      );
      // El RPC lanza excepción si el engagement no está activo o no es del cliente:
      // lo tratamos como "no encontrado" para presentar un mensaje genérico.
      if (error) return null;
      return (data ?? null) as EngagementClienteDetalle | null;
    },
  });
};
