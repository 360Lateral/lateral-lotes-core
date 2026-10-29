import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { calcularScore360, type Scores360 } from "@/lib/calcular-score-360";
import { obtenerScores360 } from "@/lib/obtener-scores-360";

export type NivelUsuario = "gratuito" | "basico" | "profesional" | "premium";

export interface LoteDetalle extends Scores360 {
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
  // Scores 360°
  score_juridico?: number | null;
  score_normativo?: number | null;
  score_ambiental?: number | null;
  score_arquitectonico?: number | null;
  score_financiero?: number | null;
  score_geotecnico?: number | null;
  score_mercado?: number | null;
  score_sspp?: number | null;
  score_360_promedio?: number | null;
  score_360_modulos?: number;
  bloqueado?: boolean;
  es_ejemplo?: boolean;
  error?: string;
}

export const useLoteDetalle = (loteId: string | undefined) => {
  return useQuery({
    queryKey: ["lote-detalle-por-nivel", loteId],
    enabled: !!loteId,
    queryFn: async (): Promise<LoteDetalle> => {
      if (!loteId) throw new Error("Falta el identificador del lote");
      const { data, error } = await supabase.rpc("obtener_lote_para_usuario" as any, {
        p_lote_id: loteId,
      });
      if (error) throw error;
      const base = data as unknown as LoteDetalle;
      if (!base || base.error || base.bloqueado) return base;

      const scores = (await obtenerScores360([loteId])).get(loteId);
      Object.assign(base, scores ?? {});
      const score = calcularScore360(scores ?? {});
      base.score_360_promedio = score?.promedio ?? null;
      base.score_360_modulos = score?.modulos ?? 0;
      base.score_sspp = scores?.score_servicios ?? null;

      return base;
    },
  });
};
