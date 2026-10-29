import { supabase } from "@/integrations/supabase/client";
import { SCORE_360_FIELDS, type Scores360 } from "./calcular-score-360";

const pick = (row: Record<string, unknown>): Scores360 =>
  Object.fromEntries(
    SCORE_360_FIELDS.map((f) => [f, row[f] == null ? null : Number(row[f])]),
  ) as Scores360;

export async function obtenerScores360(ids: string[]): Promise<Map<string, Scores360>> {
  if (!ids.length) return new Map();
  const { data, error } = await supabase.from("vw_lotes_publicos")
    .select("id,score_juridico,score_normativo,score_servicios,score_ambiental,score_arquitectonico,score_financiero,score_geotecnico,score_mercado")
    .in("id", ids);
  const scores = new Map<string, Scores360>(
    (error ? [] : data ?? []).map((row: any) => [row.id, pick(row)]),
  );
  // Visitors can't read the view. Fall back to the authorized market RPC,
  // which returns all eight stored scores for the lots the user may see.
  if (scores.size < ids.length) {
    const { data: mercado, error: mercadoError } = await (supabase as any).rpc("listar_mercado_publico");
    if (mercadoError) throw mercadoError;
    for (const row of (mercado ?? []) as any[]) {
      if (ids.includes(row.lote_id) && !scores.has(row.lote_id)) scores.set(row.lote_id, pick(row));
    }
  }
  return scores;
}
