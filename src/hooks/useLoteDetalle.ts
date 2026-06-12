import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  scoreJuridico,
  scoreAmbiental,
  scoreArquitectonico,
  scoreFinanciero,
  scoreGeotecnico,
  scoreMercado,
  scoreSspp,
  promedioScores,
} from "@/lib/lote-scores";

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
  // Scores 360°
  score_juridico?: number | null;
  score_ambiental?: number | null;
  score_arquitectonico?: number | null;
  score_financiero?: number | null;
  score_geotecnico?: number | null;
  score_mercado?: number | null;
  score_sspp?: number | null;
  score_360_promedio?: number | null;
  error?: string;
}

const fetchAnalisis = async (loteId: string) => {
  const tablas = [
    "analisis_juridico",
    "analisis_ambiental",
    "analisis_arquitectonico",
    "analisis_financiero",
    "analisis_geotecnico",
    "analisis_mercado",
    "analisis_sspp",
  ] as const;

  const results = await Promise.all(
    tablas.map((t) =>
      supabase
        .from(t as any)
        .select("*")
        .eq("lote_id", loteId)
        .maybeSingle()
        .then((r) => (r.error ? null : (r.data as any))),
    ),
  );
  const [j, a, ar, f, g, m, s] = results;
  return { j, a, ar, f, g, m, s };
};

export const useLoteDetalle = (loteId: string | undefined) => {
  return useQuery({
    queryKey: ["lote-detalle-por-nivel", loteId],
    enabled: !!loteId,
    queryFn: async (): Promise<LoteDetalle> => {
      const { data, error } = await supabase.rpc("obtener_lote_para_usuario" as any, {
        p_lote_id: loteId!,
      });
      if (error) throw error;
      const base = data as unknown as LoteDetalle;
      if (!base || base.error) return base;

      const nivel = base.nivel_usuario;
      const accesoBasicoPlus =
        base.es_propietario ||
        base.es_admin ||
        base.acceso_completo ||
        ["basico", "profesional", "premium"].includes(nivel);

      if (!accesoBasicoPlus) {
        return base;
      }

      try {
        const { j, a, ar, f, g, m, s } = await fetchAnalisis(loteId!);
        base.score_juridico = scoreJuridico(j);
        base.score_ambiental = scoreAmbiental(a);
        base.score_arquitectonico = scoreArquitectonico(ar);
        base.score_financiero = scoreFinanciero(f);
        base.score_geotecnico = scoreGeotecnico(g);
        base.score_mercado = scoreMercado(m);
        base.score_sspp = scoreSspp(s);
        base.score_360_promedio = promedioScores([
          base.score_juridico,
          base.score_ambiental,
          base.score_arquitectonico,
          base.score_financiero,
          base.score_geotecnico,
          base.score_mercado,
          base.score_sspp,
        ]);
      } catch (e) {
        console.warn("No se pudieron cargar scores de análisis:", e);
      }

      return base;
    },
  });
};
