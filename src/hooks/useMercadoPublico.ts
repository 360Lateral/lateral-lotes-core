import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Scores360 } from "@/lib/calcular-score-360";
import { obtenerScores360 } from "@/lib/obtener-scores-360";
import { getSignedFotoUrl } from "@/lib/foto-storage";

export interface FiltrosMercado {
  ciudad?: string;
  barrio?: string;
  categoria_area?: string[];
  rango_precio?: string[];
  uso_actual?: string;
}

export interface LoteMercado extends Scores360 {
  lote_id: string;
  codigo_anonimo: string;
  ciudad: string | null;
  barrio: string | null;
  area_m2_redondeada: number;
  categoria_area: string;
  latitud_zona: number | null;
  longitud_zona: number | null;
  rango_precio: string;
  uso_actual: string | null;
  publicado_en: string;
  score_360: number | null;
  has_resolutoria: boolean;
  es_ejemplo?: boolean;
  foto_url?: string | null;
}

export const useMercadoPublico = (filtros: FiltrosMercado = {}) => {
  return useQuery({
    queryKey: ["mercado-publico", JSON.stringify(filtros)],
    queryFn: async (): Promise<LoteMercado[]> => {
      const { data, error } = await (supabase as any).rpc("listar_mercado_publico");
      if (error) throw error;
      const catalogo = (data ?? []) as LoteMercado[];
      // Enrich only the lots authorized by the existing catalog RPC.
      const ids = catalogo.map((lote) => lote.lote_id);
      const [scoresPorId, fotosVista] = await Promise.all([
        obtenerScores360(ids),
        ids.length ? supabase.from("vw_lotes_publicos").select("id, foto_url").in("id", ids) : Promise.resolve({ data: [], error: null }),
      ]);
      const fotos = new Map<string, string | null>((fotosVista.data ?? []).map((foto) => [foto.id, foto.foto_url]));
      const pendientes = ids.filter((id) => !fotos.has(id));
      if (pendientes.length) {
        // The view may be unavailable to visitors; retain the same authorized IDs and RLS.
        const { data: fotosLotes } = await supabase.from("lotes").select("id, foto_url").in("id", pendientes);
        for (const foto of fotosLotes ?? []) fotos.set(foto.id, foto.foto_url);
      }
      const fotosFirmadas = new Map(await Promise.all(catalogo.map(async (lote) => [lote.lote_id, await getSignedFotoUrl(lote.foto_url ?? fotos.get(lote.lote_id))] as const)));
      const rows = catalogo.map((lote) => ({ ...lote, ...scoresPorId.get(lote.lote_id), foto_url: fotosFirmadas.get(lote.lote_id) ?? null })).filter((l) => {
        if (filtros.ciudad && l.ciudad !== filtros.ciudad) return false;
        if (filtros.barrio && !(l.barrio ?? "").toLowerCase().includes(filtros.barrio.toLowerCase()))
          return false;
        if (filtros.categoria_area?.length && !filtros.categoria_area.includes(l.categoria_area))
          return false;
        if (filtros.rango_precio?.length && !filtros.rango_precio.includes(l.rango_precio))
          return false;
        if (
          filtros.uso_actual &&
          !(l.uso_actual ?? "").toLowerCase().includes(filtros.uso_actual.toLowerCase())
        )
          return false;
        return true;
      });
      return rows.sort(
        (a, b) => new Date(b.publicado_en).getTime() - new Date(a.publicado_en).getTime(),
      );
    },
  });
};
