import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface FiltrosMercado {
  ciudad?: string;
  barrio?: string;
  categoria_area?: string[];
  rango_precio?: string[];
  uso_actual?: string;
}

export interface LoteMercado {
  lote_id: string;
  codigo_anonimo: string;
  ciudad: string | null;
  barrio: string | null;
  area_m2_redondeada: number;
  categoria_area: string;
  latitud_zona: number | null;
  longitud_zona: number | null;
  rango_precio: string;
  uso_actual: string | null;
  publicado_en: string;
  score_360: number | null;
  has_resolutoria: boolean;
  es_ejemplo?: boolean;
}

export const useMercadoPublico = (filtros: FiltrosMercado = {}) => {
  return useQuery({
    queryKey: ["mercado-publico", JSON.stringify(filtros)],
    queryFn: async (): Promise<LoteMercado[]> => {
      const { data, error } = await (supabase as any).rpc("listar_mercado_publico");
      if (error) throw error;
      const rows = ((data ?? []) as LoteMercado[]).filter((l) => {
        if (filtros.ciudad && l.ciudad !== filtros.ciudad) return false;
        if (filtros.barrio && !(l.barrio ?? "").toLowerCase().includes(filtros.barrio.toLowerCase()))
          return false;
        if (filtros.categoria_area?.length && !filtros.categoria_area.includes(l.categoria_area))
          return false;
        if (filtros.rango_precio?.length && !filtros.rango_precio.includes(l.rango_precio))
          return false;
        if (
          filtros.uso_actual &&
          !(l.uso_actual ?? "").toLowerCase().includes(filtros.uso_actual.toLowerCase())
        )
          return false;
        return true;
      });
      return rows.sort(
        (a, b) => new Date(b.publicado_en).getTime() - new Date(a.publicado_en).getTime(),
      );
    },
  });
};
