import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface PortafolioKpis {
  lotes_activos: number;
  avance_promedio_pct: number;
  sla_vencidos: number;
  ingresos_mes_cop: number;
  ingresos_mes_usd: number;
  ticket_promedio_cop: number;
  conversion_gratuito_a_pago_pct: number;
  engagements_por_plan: { plan_codigo: string; plan_nombre: string; cantidad: number }[];
  engagements_por_estado: { estado: string; cantidad: number }[];
}

export const usePortafolioKpis = () => {
  return useQuery({
    queryKey: ["portafolio-kpis"],
    staleTime: 60_000,
    queryFn: async (): Promise<PortafolioKpis> => {
      const { data, error } = await supabase.rpc("obtener_kpis_portafolio" as any);
      if (error) throw error;
      return data as unknown as PortafolioKpis;
    },
  });
};

export interface PortafolioFiltros {
  plan_codigo?: string;
  estado?: string;
  asesor_id?: string;
  semaforo_sla?: "verde" | "ambar" | "rojo";
  ciudad?: string;
}

export interface PortafolioResumenRow {
  engagement_id: string;
  lote_id: string;
  lote_nombre: string | null;
  lote_ciudad: string | null;
  lote_barrio: string | null;
  plan_codigo: string | null;
  plan_nombre: string | null;
  estado: string;
  avance_pct: number;
  asesor_id: string | null;
  asesor_nombre: string | null;
  cliente_nombre: string | null;
  dias_en_gestion: number;
  dias_para_sla: number | null;
  semaforo_sla: "verde" | "ambar" | "rojo" | null;
  estado_pago: string;
  precio_cobrado: number | null;
  moneda: string;
  ultima_actualizacion: string;
}

export const usePortafolioResumen = (filtros?: PortafolioFiltros) => {
  return useQuery({
    queryKey: ["portafolio-resumen", filtros],
    queryFn: async () => {
      let q = (supabase as any).from("vw_portafolio_resumen").select("*");
      if (filtros?.plan_codigo) q = q.eq("plan_codigo", filtros.plan_codigo);
      if (filtros?.estado) q = q.eq("estado", filtros.estado);
      if (filtros?.asesor_id) q = q.eq("asesor_id", filtros.asesor_id);
      if (filtros?.semaforo_sla) q = q.eq("semaforo_sla", filtros.semaforo_sla);
      if (filtros?.ciudad) q = q.ilike("lote_ciudad", `%${filtros.ciudad}%`);
      const { data, error } = await q.order("ultima_actualizacion", { ascending: false });
      if (error) throw error;
      return (data ?? []) as PortafolioResumenRow[];
    },
  });
};
