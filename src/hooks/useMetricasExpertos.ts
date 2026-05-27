import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface MetricaExperto {
  experto_id: string;
  nombre: string | null;
  email: string | null;
  total_propuestas: number;
  propuestas_ganadas: number;
  propuestas_rechazadas: number;
  propuestas_retiradas: number;
  tasa_adjudicacion_pct: number | null;
  tiempo_respuesta_horas_avg: number | null;
  total_invitaciones: number;
  invitaciones_respondidas: number;
  tasa_respuesta_invitacion_pct: number | null;
  servicios_completados: number;
  tiempo_entrega_dias_avg: number | null;
  sla_cumplido_pct: number | null;
}

export const useMetricasExpertos = () => {
  return useQuery({
    queryKey: ["metricas-expertos"],
    queryFn: async (): Promise<MetricaExperto[]> => {
      const { data, error } = await (supabase as any)
        .from("vw_metricas_experto")
        .select("*")
        .order("propuestas_ganadas", { ascending: false });
      if (error) throw error;
      return (data ?? []) as MetricaExperto[];
    },
  });
};
