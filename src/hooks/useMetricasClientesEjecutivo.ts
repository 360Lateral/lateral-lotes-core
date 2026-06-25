import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type RangoClientes = "30d" | "3m" | "12m";

export interface KPIsClientes {
  clientes_activos: number;
  clientes_activos_delta: number;
  clientes_nuevos_mes: number;
  clientes_nuevos_delta: number;
  churn_rate: number;
  churn_rate_delta: number;
  promedio_lotes_desarrollador: number;
  ltv_estimado: number;
}

export interface ClienteRiesgo {
  id: string;
  user_id: string;
  email: string | null;
  nombre: string | null;
  tipo: string;
  plan: string;
  motivo: "vencimiento" | "inactivo";
  fecha_riesgo: string | null;
}

export interface MetricasClientesData {
  kpis: KPIsClientes;
  evolucion_activos: Array<{ periodo: string; activos: number }>;
  evolucion_nuevos: Array<{ periodo: string; nuevos: number }>;
  evolucion_cancelaciones: Array<{ periodo: string; cancelaciones: number }>;
  distribucion_planes: Array<{ plan: string; count: number }>;
  clientes_riesgo: ClienteRiesgo[];
  total_clientes: number;
  rango: RangoClientes;
}

export const useMetricasClientesEjecutivo = (rango: RangoClientes) => {
  return useQuery({
    queryKey: ["metricas-clientes-ejecutivo", rango],
    queryFn: async (): Promise<MetricasClientesData> => {
      const { data, error } = await (supabase as any).rpc(
        "obtener_metricas_clientes_ejecutivo",
        { p_rango: rango }
      );
      if (error) throw error;
      return data as MetricasClientesData;
    },
    staleTime: 5 * 60 * 1000,
  });
};
