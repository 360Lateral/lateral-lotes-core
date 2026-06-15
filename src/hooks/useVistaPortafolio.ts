import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface PortafolioVistaFila {
  engagement_id: string;
  lote_id: string;
  lote_nombre: string | null;
  lote_ciudad: string | null;
  lote_barrio: string | null;
  plan_codigo: string | null;
  plan_nombre: string | null;
  cliente_nombre: string | null;
  asesor_id: string | null;
  asesor_nombre: string | null;
  estado: string;
  estado_activacion: "borrador" | "pendiente_pago" | "activo";
  avance_pct: number;
  dias_en_gestion: number;
  dias_para_sla: number | null;
  semaforo_sla: "verde" | "amarillo" | "ambar" | "rojo" | null;
  n_analisis_total: number;
  n_analisis_completados: number;
  tiene_diagnostico: boolean;
  tiene_presentacion: boolean;
  ultima_actualizacion: string;
  sla_estado:
    | "cumplido_a_tiempo"
    | "cumplido_con_retraso"
    | "atrasado"
    | "riesgo_fecha"
    | "riesgo_ritmo"
    | "verde"
    | null;
  sla_cumplido: boolean;
  dias_transcurridos: number;
  dias_totales_sla: number | null;
  fecha_entrega_real: string | null;
  tiene_entregables_borrador: boolean;
}

export interface PortafolioFiltrosUI {
  plan?: string[];
  estado?: string[];
  asesor_id?: string;
  semaforo?: string[];
  busqueda?: string;
  estado_activacion?: ("borrador" | "pendiente_pago" | "activo")[];
}

export const useVistaPortafolio = (filtros: PortafolioFiltrosUI = {}) => {
  return useQuery({
    queryKey: ["vw-portafolio-resumen", JSON.stringify(filtros)],
    queryFn: async (): Promise<PortafolioVistaFila[]> => {
      let q: any = (supabase as any).from("vw_portafolio_resumen").select("*");
      if (filtros.plan?.length) q = q.in("plan_codigo", filtros.plan);
      if (filtros.estado?.length) q = q.in("estado", filtros.estado);
      if (filtros.asesor_id) q = q.eq("asesor_id", filtros.asesor_id);
      if (filtros.estado_activacion?.length)
        q = q.in("estado_activacion", filtros.estado_activacion);
      if (filtros.semaforo?.length) {
        const expanded = filtros.semaforo.flatMap((s) =>
          s === "amarillo" ? ["amarillo", "ambar"] : [s],
        );
        q = q.in("semaforo_sla", expanded);
      }
      if (filtros.busqueda && filtros.busqueda.trim().length >= 2) {
        const t = filtros.busqueda.trim().replace(/,/g, " ");
        q = q.or(
          `lote_nombre.ilike.%${t}%,lote_barrio.ilike.%${t}%,cliente_nombre.ilike.%${t}%`,
        );
      }
      const { data, error } = await q.order("dias_para_sla", {
        ascending: true,
        nullsFirst: false,
      });
      if (error) throw error;
      return (data ?? []) as PortafolioVistaFila[];
    },
  });
};
