import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface LotePortafolio {
  id: string;
  nombre_lote: string;
  ciudad: string | null;
  sector: string | null;
  area_total_m2: number | null;
  foto_url: string | null;
  lat: number | null;
  lng: number | null;
  valoracion: number | null;
  score_promedio: number | null;
  estado: string | null;
  engagement_id: string | null;
  plan_codigo: string | null;
  plan_nombre: string | null;
}

export interface AreaSaludPortafolio {
  codigo: string;
  nombre: string;
  promedio: number;
  criticos: number;
  warnings: number;
}

export interface AlertaPortafolio {
  tipo: string;
  titulo: string;
  count: number;
  icon: string;
  cta: string;
  cta_label: string;
}

export interface PortafolioPropietarioData {
  kpis: {
    total_lotes: number;
    ciudades_distintas: number;
    score_portafolio: number;
    analisis_completos_pct: number;
    valor_avaluo_total: number;
    vpn_total_proyectado: number;
    lotes_con_vpn: number;
    tir_promedio_ponderada: number;
  };
  lentes: {
    avaluo: {
      valor_total: number;
      valor_m2_promedio: number;
      lote_mas_valioso: { id: string; nombre_lote: string; avaluo: number } | null;
      plusvalia_absoluta: number | null;
      plusvalia_pct: number | null;
      anios_tenencia: number | null;
    };
    desarrollo: {
      vpn_total: number;
      unidades_totales: number;
      area_construible_total: number;
    };
  };
  lotes: LotePortafolio[];
  salud_areas: AreaSaludPortafolio[];
  alertas: AlertaPortafolio[];
  total_lotes: number;
}

export const usePortafolioPropietario = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["portafolio-propietario", user?.id],
    enabled: !!user?.id,
    queryFn: async (): Promise<PortafolioPropietarioData> => {
      const { data, error } = await (supabase as any).rpc(
        "obtener_portafolio_propietario",
        { p_propietario_id: user!.id },
      );
      if (error) throw error;
      return data as PortafolioPropietarioData;
    },
    staleTime: 60 * 1000,
  });
};
