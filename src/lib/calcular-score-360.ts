export const SCORE_360_FIELDS = [
  "score_juridico", "score_normativo", "score_servicios", "score_ambiental",
  "score_arquitectonico", "score_financiero", "score_geotecnico", "score_mercado",
] as const;

export type Scores360 = Partial<Record<(typeof SCORE_360_FIELDS)[number], number | null>>;

export function calcularScore360(lote: Scores360): { promedio: number; modulos: number } | null {
  const scores = SCORE_360_FIELDS.flatMap((field) => {
    const value = lote[field];
    return value == null || !Number.isFinite(value) ? [] : [value];
  });
  if (scores.length === 0) return null;
  return {
    promedio: Math.round((scores.reduce((sum, value) => sum + value, 0) / scores.length) * 10) / 10,
    modulos: scores.length,
  };
}