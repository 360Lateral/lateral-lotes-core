import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface PropietarioConActivos {
  id: string;
  nombre: string;
  email: string | null;
  total_lotes: number;
  lotes_con_engagement: number;
  lotes_por_validar: number;
  lotes_publicados: number;
  total_leads: number;
  leads_nuevos: number;
  score_promedio: number | null;
  engagements_atrasados: number;
  engagements_cumplidos: number;
  ultimo_movimiento: string | null;
}

export const usePropietariosConActivos = () => {
  return useQuery({
    queryKey: ["propietarios-con-activos"],
    staleTime: 60_000,
    queryFn: async (): Promise<PropietarioConActivos[]> => {
      const sb = supabase as any;

      const [perfilesRes, lotesRes, engsRes, leadsRes] = await Promise.all([
        sb.from("perfiles").select("id, nombre, email").eq("user_type", "propietario"),
        sb
          .from("lotes")
          .select(
            "id, propietario_id, estado_publicacion, publicado_venta, score_juridico, score_ambiental, score_arquitectonico, score_financiero, score_geotecnico, score_mercado, score_servicios, score_normativo, updated_at",
          ),
        sb.from("vw_portafolio_resumen").select("lote_id, sla_estado, sla_cumplido"),
        sb.from("leads").select("id, lote_id, estado"),
      ]);

      const perfiles: any[] = perfilesRes.data ?? [];
      const lotes: any[] = lotesRes.data ?? [];
      const engagements: any[] = engsRes.data ?? [];
      const leads: any[] = leadsRes.data ?? [];

      const map = new Map<string, PropietarioConActivos>();
      perfiles.forEach((p) => {
        map.set(p.id, {
          id: p.id,
          nombre: p.nombre ?? "Sin nombre",
          email: p.email ?? null,
          total_lotes: 0,
          lotes_con_engagement: 0,
          lotes_por_validar: 0,
          lotes_publicados: 0,
          total_leads: 0,
          leads_nuevos: 0,
          score_promedio: null,
          engagements_atrasados: 0,
          engagements_cumplidos: 0,
          ultimo_movimiento: null,
        });
      });

      // Asegurar que propietarios referenciados por lotes pero no en lista existan
      lotes.forEach((l) => {
        if (l.propietario_id && !map.has(l.propietario_id)) {
          map.set(l.propietario_id, {
            id: l.propietario_id,
            nombre: "Propietario sin perfil",
            email: null,
            total_lotes: 0,
            lotes_con_engagement: 0,
            lotes_por_validar: 0,
            lotes_publicados: 0,
            total_leads: 0,
            leads_nuevos: 0,
            score_promedio: null,
            engagements_atrasados: 0,
            engagements_cumplidos: 0,
            ultimo_movimiento: null,
          });
        }
      });

      const scoreAcum = new Map<string, { sum: number; n: number }>();
      const lotePropMap = new Map<string, string>();

      lotes.forEach((lote) => {
        if (!lote.propietario_id) return;
        const prop = map.get(lote.propietario_id);
        if (!prop) return;
        lotePropMap.set(lote.id, lote.propietario_id);
        prop.total_lotes += 1;
        if (lote.estado_publicacion === "pendiente_validacion") prop.lotes_por_validar += 1;
        if (lote.publicado_venta && lote.estado_publicacion === "aprobado")
          prop.lotes_publicados += 1;
        const ult = lote.updated_at;
        if (ult && (!prop.ultimo_movimiento || ult > prop.ultimo_movimiento))
          prop.ultimo_movimiento = ult;
        const scores = [
          lote.score_juridico,
          lote.score_ambiental,
          lote.score_arquitectonico,
          lote.score_financiero,
          lote.score_geotecnico,
          lote.score_mercado,
          lote.score_servicios,
          lote.score_normativo,
        ]
          .map((s) => (s == null ? null : Number(s)))
          .filter((s): s is number => s != null && !isNaN(s));
        if (scores.length > 0) {
          const promedioLote = scores.reduce((a, b) => a + b, 0) / scores.length;
          const cur = scoreAcum.get(lote.propietario_id) ?? { sum: 0, n: 0 };
          cur.sum += promedioLote;
          cur.n += 1;
          scoreAcum.set(lote.propietario_id, cur);
        }
      });

      scoreAcum.forEach((v, propId) => {
        const prop = map.get(propId);
        if (prop) prop.score_promedio = Number((v.sum / v.n).toFixed(1));
      });

      const engPorLote = new Map<string, any>();
      engagements.forEach((e) => {
        if (e.lote_id && !engPorLote.has(e.lote_id)) engPorLote.set(e.lote_id, e);
      });
      engPorLote.forEach((eng, loteId) => {
        const propId = lotePropMap.get(loteId);
        if (!propId) return;
        const prop = map.get(propId);
        if (!prop) return;
        prop.lotes_con_engagement += 1;
        if (eng.sla_estado === "atrasado" && !eng.sla_cumplido)
          prop.engagements_atrasados += 1;
        if (eng.sla_cumplido) prop.engagements_cumplidos += 1;
      });

      leads.forEach((lead) => {
        const propId = lead.lote_id ? lotePropMap.get(lead.lote_id) : null;
        if (!propId) return;
        const prop = map.get(propId);
        if (!prop) return;
        prop.total_leads += 1;
        if (lead.estado === "nuevo") prop.leads_nuevos += 1;
      });

      return Array.from(map.values())
        .filter((p) => p.total_lotes > 0)
        .sort((a, b) => b.total_lotes - a.total_lotes);
    },
  });
};
