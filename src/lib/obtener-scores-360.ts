import { supabase } from "@/integrations/supabase/client";
import type { Scores360 } from "./calcular-score-360";

export async function obtenerScores360(ids: string[]): Promise<Map<string, Scores360>> {
  if (!ids.length) return new Map();
  const { data, error } = await supabase.from("vw_lotes_publicos")
    .select("id,score_juridico,score_normativo,score_servicios,score_ambiental,score_arquitectonico,score_financiero,score_geotecnico,score_mercado")
    .in("id", ids);
  const scores = new Map<string, Scores360>((data ?? []).map((row) => [row.id, row]));
  // The public view is not granted to visitors. Keep the existing authorized
  // catalog as fallback rather than breaking cards/details or bypassing RLS.
  if (error || scores.size < ids.length) {
    const { data: catalogo, error: catalogoError } = await supabase.rpc("listar_catalogo_lotes");
    if (catalogoError) throw catalogoError;
    for (const row of catalogo ?? []) {
      if (ids.includes(row.id) && !scores.has(row.id)) scores.set(row.id, row);
    }
  }
  return scores;
}