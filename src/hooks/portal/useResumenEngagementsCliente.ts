import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface ResumenEngagementCliente {
  engagement_id: string;
  lote_id: string;
  plan_id: string | null;
  plan_codigo: string | null;
  plan_nombre: string | null;
  estado: string;
  estado_activacion: string;
  avance_pct: number;
  fecha_inicio: string | null;
  fecha_sla_objetivo: string | null;
  fecha_entrega: string | null;
  publicado_venta: boolean;
  lote_nombre: string | null;
  lote_direccion: string | null;
  lote_ciudad: string | null;
  lote_foto_url: string | null;
  lote_lat: number | null;
  lote_lng: number | null;
  analisis_totales_plan: number;
  analisis_completados: number;
  analisis_en_progreso: number;
  analisis_pendientes: number;
  score_promedio: number | null;
  score_viabilidad: number | null;
  valoracion_estimada: number | null;
  documentos_pendientes_count: number;
  dias_sla: number | null;
}

/**
 * RPC agregado: una sola llamada devuelve todos los engagements del cliente
 * con contadores, KPIs y SLA. Reemplaza N+1 cuando se necesitan KPIs por card.
 */
export const useResumenEngagementsCliente = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["resumen-engagements-cliente", user?.id],
    enabled: !!user?.id,
    staleTime: 30 * 1000,
    queryFn: async (): Promise<ResumenEngagementCliente[]> => {
      const { data, error } = await (supabase as any).rpc(
        "obtener_resumen_engagements_cliente",
      );
      if (error) throw error;
      return (data ?? []) as ResumenEngagementCliente[];
    },
  });
};
