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
} from "@/lib/lote-scores";

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
          .from("lotes")
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

      // Tablas de análisis: la base de datos decide qué se puede leer
      // (p. ej. lotes de ejemplo son visibles para todos).
      const tablas = [
        "analisis_juridico",
        "analisis_ambiental",
        "analisis_arquitectonico",
        "analisis_financiero",
        "analisis_geotecnico",
        "analisis_mercado",
        "analisis_sspp",
      ];
      const filas = await Promise.all(
        tablas.map((t) =>
          (supabase as any)
            .from(t)
            .select("*")
            .eq("lote_id", loteId!)
            .limit(1)
            .maybeSingle()
            .then((r: any) => (r.error ? null : r.data)),
        ),
      );
      const [aj, aa, aar, af, ag, am, as_] = filas as any[];

      const scoresDb = (scoresRes.data ?? null) as ScoresLote | null;
      const calc = {
        score_juridico: scoreJuridico(aj),
        score_ambiental: scoreAmbiental(aa),
        score_arquitectonico: scoreArquitectonico(aar),
        score_financiero: scoreFinanciero(af),
        score_geotecnico: scoreGeotecnico(ag),
        score_mercado: scoreMercado(am),
        score_servicios: scoreSspp(as_),
      };
      const hayCalc = Object.values(calc).some((v) => v != null);
      const scores: ScoresLote | null = hayCalc
        ? {
            score_normativo: null,
            precio_venta_estimado:
              scoresDb?.precio_venta_estimado ?? num(af?.precio_estimado_promedio),
            ...calc,
          }
        : scoresDb;
      const normativa = (normRes.data ?? null) as NormativaLote | null;
      const enriqRaw = (enriqRes.data ?? null) as any;
      const arqSrc = enriqRaw?.arquitectonico ?? aar;
      const finSrc = enriqRaw?.financiero ?? af;
      const merSrc = enriqRaw?.mercado ?? am;

      const arquitectonico: ArquitectonicoLote | null = arqSrc
        ? {
            m2_construibles_total: num(arqSrc.m2_construibles_total),
            unidades_estimadas: num(arqSrc.unidades_estimadas),
            area_vendible_pct: num(arqSrc.area_vendible_pct),
            tipologias: arqSrc.tipologias ?? null,
            eficiencia_lote_pct: num(arqSrc.eficiencia_lote_pct),
            forma_lote: arqSrc.forma_lote ?? null,
            permite_sotano: arqSrc.permite_sotano ?? null,
            observaciones: arqSrc.observaciones ?? null,
          }
        : null;

      const financiero: FinancieroLote | null = finSrc
        ? {
            valor_compra_lote: num(finSrc.valor_compra_lote),
            costo_construccion_m2: num(finSrc.costo_construccion_m2),
            ingresos_proyectados: num(finSrc.ingresos_proyectados),
            margen_bruto_pct: num(finSrc.margen_bruto_pct),
            tir_pct: num(finSrc.tir_pct),
            vpn: num(finSrc.vpn),
            punto_equilibrio_pct: num(finSrc.punto_equilibrio_pct),
            precio_estimado_min: num(finSrc.precio_estimado_min),
            precio_estimado_promedio: num(finSrc.precio_estimado_promedio),
            precio_estimado_max: num(finSrc.precio_estimado_max),
            observaciones: finSrc.observaciones ?? null,
          }
        : null;

      const mercado: MercadoLote | null = merSrc
        ? {
            precio_venta_m2_zona: num(merSrc.precio_venta_m2_zona),
            precio_unidad_promedio: num(merSrc.precio_unidad_promedio),
            proyectos_competidores: num(merSrc.proyectos_competidores),
            velocidad_absorcion_unidades_mes: num(merSrc.velocidad_absorcion_unidades_mes),
            perfil_comprador: merSrc.perfil_comprador ?? null,
            valorizacion_anual_pct: num(merSrc.valorizacion_anual_pct),
            observaciones: merSrc.observaciones ?? null,
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
