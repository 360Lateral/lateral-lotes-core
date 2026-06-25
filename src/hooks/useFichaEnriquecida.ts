import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ScoresLote {
  score_juridico: number | null;
  score_normativo: number | null;
  score_servicios: number | null;
  score_ambiental: number | null;
  score_geotecnico: number | null;
  score_mercado: number | null;
  score_arquitectonico: number | null;
  score_financiero: number | null;
  precio_venta_estimado: number | null;
}

export interface NormativaLote {
  uso_principal: string | null;
  indice_construccion: number | null;
  indice_ocupacion: number | null;
  altura_max_pisos: number | null;
  altura_max_metros: number | null;
  altura_texto: string | null;
  densidad_max: number | null;
  tratamiento: string | null;
  zona_pot: string | null;
  norma_vigente: string | null;
  aislamiento_frontal_m: number | null;
  aislamiento_posterior_m: number | null;
  aislamiento_lateral_m: number | null;
}

export interface FichaEnriquecidaData {
  scores: ScoresLote | null;
  scorePromedio: number | null;
  analisisCompletados: number;
  scoreViabilidad: number | null;
  normativa: NormativaLote | null;
}

const SCORE_KEYS: (keyof ScoresLote)[] = [
  "score_juridico",
  "score_normativo",
  "score_servicios",
  "score_ambiental",
  "score_geotecnico",
  "score_mercado",
  "score_arquitectonico",
  "score_financiero",
];

export const useFichaEnriquecida = (loteId: string | undefined) => {
  return useQuery({
    queryKey: ["ficha-enriquecida", loteId],
    enabled: !!loteId,
    queryFn: async (): Promise<FichaEnriquecidaData> => {
      const [scoresRes, normRes] = await Promise.all([
        (supabase as any)
          .from("vw_lotes_publicos")
          .select(
            "score_juridico, score_normativo, score_servicios, score_ambiental, score_geotecnico, score_mercado, score_arquitectonico, score_financiero, precio_venta_estimado",
          )
          .eq("id", loteId!)
          .maybeSingle(),
        supabase
          .from("normativa_urbana")
          .select(
            "uso_principal, indice_construccion, indice_ocupacion, altura_max_pisos, altura_max_metros, altura_texto, densidad_max, tratamiento, zona_pot, norma_vigente, aislamiento_frontal_m, aislamiento_posterior_m, aislamiento_lateral_m",
          )
          .eq("lote_id", loteId!)
          .maybeSingle(),
      ]);

      const scores = (scoresRes.data ?? null) as ScoresLote | null;
      const normativa = (normRes.data ?? null) as NormativaLote | null;

      let scorePromedio: number | null = null;
      let analisisCompletados = 0;
      if (scores) {
        const vals = SCORE_KEYS.map((k) => scores[k]).filter(
          (v): v is number => typeof v === "number",
        );
        analisisCompletados = vals.length;
        if (vals.length > 0) {
          scorePromedio = vals.reduce((a, b) => a + b, 0) / vals.length;
        }
      }

      // Score de viabilidad: combinación de jurídico + normativo + servicios (los 3 críticos)
      const viab = scores
        ? [scores.score_juridico, scores.score_normativo, scores.score_servicios].filter(
            (v): v is number => typeof v === "number",
          )
        : [];
      const scoreViabilidad =
        viab.length > 0 ? viab.reduce((a, b) => a + b, 0) / viab.length : null;

      return {
        scores,
        scorePromedio,
        analisisCompletados,
        scoreViabilidad,
        normativa,
      };
    },
  });
};
