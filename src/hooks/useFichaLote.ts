import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface FichaLoteData {
  encontrada: boolean;
  id?: string;
  nombre_lote?: string;
  ciudad?: string | null;
  barrio?: string | null;
  direccion?: string | null;
  area_total_m2?: number | null;
  tipo_lote?: string | null;
  lat?: number | null;
  lng?: number | null;
  foto_url?: string | null;
  fotos?: { url: string; orden: number }[];
  precio_venta_estimado?: number | null;
  publicado_venta?: boolean;
  estado_publicacion?: string;
  propietario_nombre?: string | null;
  tiene_analisis_juridico?: boolean;
  tiene_analisis_ambiental?: boolean;
  tiene_analisis_arquitectonico?: boolean;
  tiene_analisis_financiero?: boolean;
  tiene_analisis_geotecnico?: boolean;
  tiene_analisis_mercado?: boolean;
  tiene_analisis_sspp?: boolean;
}

export const useFichaLote = (loteId: string | undefined) => {
  return useQuery({
    queryKey: ["ficha-lote", loteId],
    enabled: !!loteId,
    queryFn: async (): Promise<FichaLoteData> => {
      const { data, error } = await supabase.rpc("obtener_ficha_lote" as any, {
        p_lote_id: loteId!,
      });
      if (error) throw error;
      return data as FichaLoteData;
    },
  });
};
