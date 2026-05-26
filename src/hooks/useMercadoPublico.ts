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
}

export const useMercadoPublico = (filtros: FiltrosMercado = {}) => {
  return useQuery({
    queryKey: ["mercado-publico", JSON.stringify(filtros)],
    queryFn: async (): Promise<LoteMercado[]> => {
      let q: any = (supabase as any).from("vw_mercado_publico").select("*");
      if (filtros.ciudad) q = q.eq("ciudad", filtros.ciudad);
      if (filtros.barrio) q = q.ilike("barrio", `%${filtros.barrio}%`);
      if (filtros.categoria_area?.length) q = q.in("categoria_area", filtros.categoria_area);
      if (filtros.rango_precio?.length) q = q.in("rango_precio", filtros.rango_precio);
      if (filtros.uso_actual) q = q.ilike("uso_actual", `%${filtros.uso_actual}%`);
      q = q.order("publicado_en", { ascending: false });
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as LoteMercado[];
    },
  });
};
