// Heurísticas simples de score 0-10 por cada análisis del lote.
// Devuelven null si la información es insuficiente para puntuar.

const clamp = (n: number) => Math.max(0, Math.min(10, n));

export const scoreJuridico = (row: Record<string, any> | null | undefined): number | null => {
  if (!row || !row.completado) return null;
  let s = 10;
  const negativos: (keyof typeof row)[] = [
    "gravamenes",
    "hipoteca_activa",
    "servidumbres",
    "deuda_predial",
    "discrepancia_areas",
    "proceso_sucesion",
    "litigio_activo",
  ];
  for (const k of negativos) if (row[k]) s -= 1.5;
  return Math.round(clamp(s) * 10) / 10;
};

export const scoreAmbiental = (row: Record<string, any> | null | undefined): number | null => {
  if (!row || !row.completado) return null;
  let s = 10;
  if (row.ronda_hidrica) s -= 2;
  if (row.reserva_forestal) s -= 2;
  if (row.pasivo_ambiental) s -= 2;
  if (row.requiere_licencia_ambiental) s -= 1;
  const amenaza = (v: string | null) => {
    if (!v) return 0;
    const t = String(v).toLowerCase();
    if (t.includes("alta")) return 2;
    if (t.includes("media")) return 1;
    return 0;
  };
  s -= amenaza(row.amenaza_inundacion);
  s -= amenaza(row.amenaza_remocion);
  return Math.round(clamp(s) * 10) / 10;
};

export const scoreArquitectonico = (row: Record<string, any> | null | undefined): number | null => {
  if (!row || !row.completado) return null;
  const ef = row.eficiencia_lote_pct ?? row.area_vendible_pct;
  if (ef == null) return null;
  return Math.round(clamp(Number(ef) / 10) * 10) / 10;
};

export const scoreFinanciero = (row: Record<string, any> | null | undefined): number | null => {
  if (!row || !row.completado) return null;
  const m = row.margen_bruto_pct;
  if (m == null) return null;
  const v = Number(m);
  let s = 4;
  if (v >= 30) s = 10;
  else if (v >= 20) s = 8;
  else if (v >= 10) s = 6;
  return s;
};

export const scoreGeotecnico = (row: Record<string, any> | null | undefined): number | null => {
  if (!row || !row.completado) return null;
  const p = row.pendiente_pct == null ? null : Number(row.pendiente_pct);
  if (p == null) return null;
  let s = 4;
  if (p < 10) s = 10;
  else if (p < 20) s = 8;
  else if (p < 30) s = 6;
  return s;
};

export const scoreMercado = (row: Record<string, any> | null | undefined): number | null => {
  if (!row || !row.completado) return null;
  const v = row.valorizacion_anual_pct == null ? null : Number(row.valorizacion_anual_pct);
  if (v == null) return null;
  let s = 4;
  if (v >= 10) s = 10;
  else if (v >= 6) s = 8;
  else if (v >= 3) s = 6;
  return s;
};

export const scoreSspp = (row: Record<string, any> | null | undefined): number | null => {
  if (!row || !row.completado) return null;
  let count = 0;
  if (row.acueducto_disponible) count++;
  if (row.alcantarillado_disponible) count++;
  if (row.energia_disponible) count++;
  if (row.gas_disponible) count++;
  if (row.via_pavimentada) count++;
  return Math.round((count / 5) * 10 * 10) / 10;
};

export const promedioScores = (scores: (number | null | undefined)[]): number | null => {
  const v = scores.filter((s): s is number => typeof s === "number");
  if (v.length === 0) return null;
  return Math.round((v.reduce((a, b) => a + b, 0) / v.length) * 10) / 10;
};
