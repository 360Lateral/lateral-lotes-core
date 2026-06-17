import { supabase } from "@/integrations/supabase/client";

/**
 * Aplica datos consultados desde MapGIS directamente a la tabla
 * normativa_urbana. Replica el mapeo que hace SeccionNormativa.tsx en su
 * callback `onApply` de MapGISConsulta. Útil cuando el Sheet de Normativa
 * no está abierto: el grid puede aplicar el resultado y al abrir el Sheet
 * después la query refresca los valores.
 *
 * NOTA: `normativa_urbana` no tiene columna `updated_at` — no incluir.
 */
export interface MapGISApplyPayload {
  uso_principal?: string;
  tratamiento?: string;
  indice_construccion?: number | null;
  altura_normativa?: string | null;
}

export async function aplicarPotANormativa(
  loteId: string,
  datos: MapGISApplyPayload,
): Promise<number> {
  const updates: Record<string, any> = {};
  if (datos.uso_principal) updates.uso_principal = datos.uso_principal;
  if (datos.tratamiento) updates.tratamiento = datos.tratamiento;
  if (datos.indice_construccion != null)
    updates.indice_construccion = Number(datos.indice_construccion);
  if (datos.altura_normativa) updates.altura_texto = datos.altura_normativa;

  const campos = Object.keys(updates).length;
  if (campos === 0) return 0;

  const { data: existing, error: selErr } = await (supabase as any)
    .from("normativa_urbana")
    .select("id")
    .eq("lote_id", loteId)
    .maybeSingle();
  if (selErr) throw selErr;

  if (existing) {
    const { error } = await (supabase as any)
      .from("normativa_urbana")
      .update(updates)
      .eq("id", existing.id);
    if (error) throw error;
  } else {
    const { error } = await (supabase as any)
      .from("normativa_urbana")
      .insert({ ...updates, lote_id: loteId });
    if (error) throw error;
  }
  return campos;
}
