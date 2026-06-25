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

export interface ArquitectonicoLote {
  m2_construibles_total: number | null;
  unidades_estimadas: number | null;
  area_vendible_pct: number | null;
  tipologias: string | null;
  eficiencia_lote_pct: number | null;
  forma_lote: string | null;
  permite_sotano: boolean | null;
  observaciones: string | null;
}

export interface FinancieroLote {
  valor_compra_lote: number | null;
  costo_construccion_m2: number | null;
  ingresos_proyectados: number | null;
  margen_bruto_pct: number | null;
  tir_pct: number | null;
  vpn: number | null;
  punto_equilibrio_pct: number | null;
  precio_estimado_min: number | null;
  precio_estimado_promedio: number | null;
  precio_estimado_max: number | null;
  observaciones: string | null;
}

export interface MercadoLote {
  precio_venta_m2_zona: number | null;
  precio_unidad_promedio: number | null;
  proyectos_competidores: number | null;
  velocidad_absorcion_unidades_mes: number | null;
  perfil_comprador: string | null;
  valorizacion_anual_pct: number | null;
  observaciones: string | null;
}

export type CodigoAnalisis =
  | "juridico"
  | "normativo"
  | "ambiental"
  | "sspp"
  | "geotecnico"
  | "mercado"
  | "arquitectonico"
  | "financiero";

export type NivelHallazgo = "ok" | "warning" | "critical" | "pending";

export interface HallazgoArea {
  area: CodigoAnalisis;
  nivel: NivelHallazgo;
  mensaje: string;
}

export interface FichaEnriquecidaData {
  scores: ScoresLote | null;
  scorePromedio: number | null;
  analisisCompletados: number;
  scoreViabilidad: number | null;
  normativa: NormativaLote | null;
  arquitectonico: ArquitectonicoLote | null;
  financiero: FinancieroLote | null;
  mercado: MercadoLote | null;
  scoresIndividuales: Record<CodigoAnalisis, number | null>;
  hallazgosCriticos: HallazgoArea[];
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

const SCORE_MAP: Record<CodigoAnalisis, keyof ScoresLote> = {
  juridico: "score_juridico",
  normativo: "score_normativo",
  ambiental: "score_ambiental",
  sspp: "score_servicios",
  geotecnico: "score_geotecnico",
  mercado: "score_mercado",
  arquitectonico: "score_arquitectonico",
  financiero: "score_financiero",
};

const AREA_LABEL: Record<CodigoAnalisis, string> = {
  juridico: "jurídico",
  normativo: "normativo",
  ambiental: "ambiental",
  sspp: "de servicios públicos",
  geotecnico: "geotécnico",
  mercado: "de mercado",
  arquitectonico: "arquitectónico",
  financiero: "financiero",
};

const num = (v: unknown): number | null => {
  if (v == null) return null;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : null;
};

export const useFichaEnriquecida = (loteId: string | undefined) => {
  return useQuery({
    queryKey: ["ficha-enriquecida", loteId],
    enabled: !!loteId,
    queryFn: async (): Promise<FichaEnriquecidaData> => {
      const [scoresRes, normRes, enriqRes] = await Promise.all([
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
        (supabase as any).rpc("obtener_ficha_publica_enriquecida", { p_lote_id: loteId }),
      ]);

      const scores = (scoresRes.data ?? null) as ScoresLote | null;
      const normativa = (normRes.data ?? null) as NormativaLote | null;
      const enriqRaw = (enriqRes.data ?? null) as any;

      const arquitectonico: ArquitectonicoLote | null = enriqRaw?.arquitectonico
        ? {
            m2_construibles_total: num(enriqRaw.arquitectonico.m2_construibles_total),
            unidades_estimadas: num(enriqRaw.arquitectonico.unidades_estimadas),
            area_vendible_pct: num(enriqRaw.arquitectonico.area_vendible_pct),
            tipologias: enriqRaw.arquitectonico.tipologias ?? null,
            eficiencia_lote_pct: num(enriqRaw.arquitectonico.eficiencia_lote_pct),
            forma_lote: enriqRaw.arquitectonico.forma_lote ?? null,
            permite_sotano: enriqRaw.arquitectonico.permite_sotano ?? null,
            observaciones: enriqRaw.arquitectonico.observaciones ?? null,
          }
        : null;

      const financiero: FinancieroLote | null = enriqRaw?.financiero
        ? {
            valor_compra_lote: num(enriqRaw.financiero.valor_compra_lote),
            costo_construccion_m2: num(enriqRaw.financiero.costo_construccion_m2),
            ingresos_proyectados: num(enriqRaw.financiero.ingresos_proyectados),
            margen_bruto_pct: num(enriqRaw.financiero.margen_bruto_pct),
            tir_pct: num(enriqRaw.financiero.tir_pct),
            vpn: num(enriqRaw.financiero.vpn),
            punto_equilibrio_pct: num(enriqRaw.financiero.punto_equilibrio_pct),
            precio_estimado_min: num(enriqRaw.financiero.precio_estimado_min),
            precio_estimado_promedio: num(enriqRaw.financiero.precio_estimado_promedio),
            precio_estimado_max: num(enriqRaw.financiero.precio_estimado_max),
            observaciones: enriqRaw.financiero.observaciones ?? null,
          }
        : null;

      const mercado: MercadoLote | null = enriqRaw?.mercado
        ? {
            precio_venta_m2_zona: num(enriqRaw.mercado.precio_venta_m2_zona),
            precio_unidad_promedio: num(enriqRaw.mercado.precio_unidad_promedio),
            proyectos_competidores: num(enriqRaw.mercado.proyectos_competidores),
            velocidad_absorcion_unidades_mes: num(enriqRaw.mercado.velocidad_absorcion_unidades_mes),
            perfil_comprador: enriqRaw.mercado.perfil_comprador ?? null,
            valorizacion_anual_pct: num(enriqRaw.mercado.valorizacion_anual_pct),
            observaciones: enriqRaw.mercado.observaciones ?? null,
          }
        : null;

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

      const viab = scores
        ? [scores.score_juridico, scores.score_normativo, scores.score_servicios].filter(
            (v): v is number => typeof v === "number",
          )
        : [];
      const scoreViabilidad =
        viab.length > 0 ? viab.reduce((a, b) => a + b, 0) / viab.length : null;

      const scoresIndividuales = Object.fromEntries(
        (Object.keys(SCORE_MAP) as CodigoAnalisis[]).map((codigo) => [
          codigo,
          scores ? (scores[SCORE_MAP[codigo]] as number | null) ?? null : null,
        ]),
      ) as Record<CodigoAnalisis, number | null>;

      const hallazgosCriticos: HallazgoArea[] = [];
      for (const codigo of Object.keys(SCORE_MAP) as CodigoAnalisis[]) {
        const s = scoresIndividuales[codigo];
        if (s == null) continue;
        if (s < 4) {
          hallazgosCriticos.push({
            area: codigo,
            nivel: "critical",
            mensaje: `Score ${s.toFixed(1)}/10 en análisis ${AREA_LABEL[codigo]} — requiere revisión inmediata.`,
          });
        } else if (s < 7) {
          hallazgosCriticos.push({
            area: codigo,
            nivel: "warning",
            mensaje: `Score ${s.toFixed(1)}/10 en análisis ${AREA_LABEL[codigo]} — atención a riesgos.`,
          });
        }
      }

      return {
        scores,
        scorePromedio,
        analisisCompletados,
        scoreViabilidad,
        normativa,
        arquitectonico,
        financiero,
        mercado,
        scoresIndividuales,
        hallazgosCriticos,
      };
    },
  });
};
