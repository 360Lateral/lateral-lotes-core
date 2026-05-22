import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface EngagementClienteResumen {
  engagement_id: string;
  lote_nombre: string | null;
  lote_direccion: string | null;
  lote_ciudad: string | null;
  plan_codigo: string | null;
  plan_nombre: string | null;
  estado: string;
  avance_pct: number;
  fecha_inicio: string | null;
  fecha_sla: string | null;
  dias_para_sla: number | null;
  total_entregables_publicados: number;
}

export const useMisEngagementsCliente = () => {
  return useQuery({
    queryKey: ["mis-engagements-cliente"],
    refetchOnWindowFocus: true,
    queryFn: async (): Promise<EngagementClienteResumen[]> => {
      const { data, error } = await supabase.rpc(
        "listar_mis_engagements_cliente" as any,
      );
      if (error) throw error;
      return (data ?? []) as EngagementClienteResumen[];
    },
  });
};
