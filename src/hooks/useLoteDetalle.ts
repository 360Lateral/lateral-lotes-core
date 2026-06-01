import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type NivelUsuario = "gratuito" | "basico" | "profesional" | "premium";

export interface LoteDetalle {
  lote_id: string;
  codigo_anonimo: string;
  ciudad: string | null;
  barrio: string | null;
  nivel_usuario: NivelUsuario;
  es_propietario: boolean;
  es_admin: boolean;
  tiene_nda_firmado: boolean;
  requiere_nda_para_profesional: boolean;
  categoria_area: string;
  rango_precio: string;
  tipo_lote: string | null;
  area_total_m2?: number;
  lat_zona?: number;
  lng_zona?: number;
  estrato?: number;
  tipo_lote_detallado?: string;
  direccion?: string;
  matricula?: string;
  lat?: number;
  lng?: number;
  foto_url?: string;
  nombre_lote?: string;
  precio_venta_estimado?: number;
  notas?: string;
  tiene_analisis_juridico?: boolean;
  tiene_analisis_ambiental?: boolean;
  tiene_analisis_arquitectonico?: boolean;
  tiene_analisis_financiero?: boolean;
  tiene_analisis_geotecnico?: boolean;
  tiene_analisis_mercado?: boolean;
  tiene_analisis_sspp?: boolean;
  acceso_completo?: boolean;
  acceso_por_ppv?: boolean;
  ppv_expira?: string | null;
  error?: string;
}

export const useLoteDetalle = (loteId: string | undefined) => {
  return useQuery({
    queryKey: ["lote-detalle-por-nivel", loteId],
    enabled: !!loteId,
    queryFn: async (): Promise<LoteDetalle> => {
      const { data, error } = await supabase.rpc("obtener_lote_para_usuario" as any, { p_lote_id: loteId! });
      if (error) throw error;
      return data as unknown as LoteDetalle;
    },
  });
};
