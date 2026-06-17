import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type FiltroLoteUnif =
  | "todos"
  | "con_engagement"
  | "por_validar"
  | "en_venta"
  | "vendidos"
  | "sin_asesor"
  | "atrasados";

export interface LoteUnificado {
  id: string;
  nombre_lote: string;
  ciudad: string | null;
  barrio: string | null;
  area_total_m2: number | null;
  foto_url: string | null;
  estado_publicacion: string;
  publicado_venta: boolean;
  propietario_id: string | null;
  es_publico: boolean;
  score_360: number | null;
  has_resolutoria: boolean;
  engagement_id: string | null;
  engagement_estado: string | null;
  engagement_avance_pct: number | null;
  sla_estado: string | null;
  sla_cumplido: boolean | null;
  dias_para_sla: number | null;
  asesor_id: string | null;
  asesor_nombre: string | null;
  plan_nombre: string | null;
  tiene_entregables_borrador: boolean | null;
  leads_count: number;
  leads_nuevos_count: number;
}

export const useLotesUnificados = (filtros: {
  busqueda?: string;
  filtro?: FiltroLoteUnif;
}) => {
  return useQuery({
    queryKey: ["lotes-unificados", filtros],
    staleTime: 30_000,
    queryFn: async (): Promise<LoteUnificado[]> => {
      const sb = supabase as any;

      const [lotesRes, engRes, leadsRes] = await Promise.all([
        sb
          .from("lotes")
          .select(
            `id, nombre_lote, ciudad, barrio, area_total_m2, foto_url,
             estado_publicacion, publicado_venta, propietario_id, es_publico,
             score_juridico, score_ambiental, score_arquitectonico, score_financiero,
             score_geotecnico, score_mercado, score_servicios, score_normativo,
             has_resolutoria, created_at`,
          )
          .order("created_at", { ascending: false }),
        sb.from("vw_portafolio_resumen").select("*"),
        sb.from("leads").select("id, lote_id, estado"),
      ]);

      if (lotesRes.error) throw lotesRes.error;

      const lotes: any[] = lotesRes.data ?? [];
      const engs: any[] = engRes.data ?? [];
      const leads: any[] = leadsRes.data ?? [];

      const engByLote = new Map<string, any>();
      engs.forEach((e) => {
        if (e.lote_id && !engByLote.has(e.lote_id)) engByLote.set(e.lote_id, e);
      });

      const leadsByLote = new Map<string, { total: number; nuevos: number }>();
      leads.forEach((l) => {
        if (!l.lote_id) return;
        const cur = leadsByLote.get(l.lote_id) ?? { total: 0, nuevos: 0 };
        cur.total += 1;
        if (l.estado === "nuevo") cur.nuevos += 1;
        leadsByLote.set(l.lote_id, cur);
      });

      const out: LoteUnificado[] = lotes.map((lote) => {
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
        const score360 =
          scores.length > 0
            ? Number((scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1))
            : null;
        const eng = engByLote.get(lote.id);
        const lc = leadsByLote.get(lote.id) ?? { total: 0, nuevos: 0 };

        return {
          id: lote.id,
          nombre_lote: lote.nombre_lote,
          ciudad: lote.ciudad,
          barrio: lote.barrio,
          area_total_m2: lote.area_total_m2 != null ? Number(lote.area_total_m2) : null,
          foto_url: lote.foto_url,
          estado_publicacion: lote.estado_publicacion,
          publicado_venta: !!lote.publicado_venta,
          propietario_id: lote.propietario_id,
          es_publico: !!lote.es_publico,
          score_360: score360,
          has_resolutoria: !!lote.has_resolutoria,
          engagement_id: eng?.engagement_id ?? null,
          engagement_estado: eng?.estado ?? null,
          engagement_avance_pct: eng?.avance_pct != null ? Number(eng.avance_pct) : null,
          sla_estado: eng?.sla_estado ?? null,
          sla_cumplido: eng?.sla_cumplido ?? null,
          dias_para_sla: eng?.dias_para_sla != null ? Number(eng.dias_para_sla) : null,
          asesor_id: eng?.asesor_id ?? null,
          asesor_nombre: eng?.asesor_nombre ?? null,
          plan_nombre: eng?.plan_nombre ?? null,
          tiene_entregables_borrador: eng?.tiene_entregables_borrador ?? null,
          leads_count: lc.total,
          leads_nuevos_count: lc.nuevos,
        };
      });

      let res = out;
      if (filtros.busqueda?.trim()) {
        const q = filtros.busqueda.toLowerCase();
        res = res.filter(
          (l) =>
            (l.nombre_lote ?? "").toLowerCase().includes(q) ||
            (l.ciudad ?? "").toLowerCase().includes(q) ||
            (l.barrio ?? "").toLowerCase().includes(q) ||
            (l.asesor_nombre ?? "").toLowerCase().includes(q),
        );
      }
      if (filtros.filtro && filtros.filtro !== "todos") {
        const f = filtros.filtro;
        res = res.filter((l) => {
          if (f === "con_engagement") return !!l.engagement_id;
          if (f === "por_validar") return l.estado_publicacion === "pendiente_validacion";
          if (f === "en_venta")
            return l.publicado_venta && l.estado_publicacion === "aprobado";
          if (f === "vendidos") return l.engagement_estado === "cerrado";
          if (f === "sin_asesor") return !!l.engagement_id && !l.asesor_id;
          if (f === "atrasados") return l.sla_estado === "atrasado" && !l.sla_cumplido;
          return true;
        });
      }
      return res;
    },
  });
};

export const useResumenLeads = () => {
  return useQuery({
    queryKey: ["resumen-leads"],
    staleTime: 30_000,
    queryFn: async () => {
      const sb = supabase as any;
      const { data: leads } = await sb
        .from("leads")
        .select("id, nombre, email, estado, created_at, lotes(nombre_lote)")
        .order("created_at", { ascending: false })
        .limit(5);
      const { count: total } = await sb
        .from("leads")
        .select("id", { count: "exact", head: true });
      const { count: nuevos } = await sb
        .from("leads")
        .select("id", { count: "exact", head: true })
        .eq("estado", "nuevo");
      return { leads: leads ?? [], total: total ?? 0, nuevos: nuevos ?? 0 };
    },
  });
};

export const useResumenEngagementsPorEstado = () => {
  return useQuery({
    queryKey: ["resumen-engagements-estado"],
    staleTime: 30_000,
    queryFn: async () => {
      const sb = supabase as any;
      const { data } = await sb
        .from("vw_portafolio_resumen")
        .select("estado, sla_cumplido, sla_estado, dias_en_gestion");
      const lista: any[] = data ?? [];
      const porEstado: Record<string, number> = {};
      lista.forEach((f) => {
        porEstado[f.estado] = (porEstado[f.estado] ?? 0) + 1;
      });
      const cumplidos = lista.filter((f) => f.sla_cumplido).length;
      const total = lista.length;
      const slaCumplidoPct = total > 0 ? Math.round((cumplidos / total) * 100) : 0;
      const tiempoPromedio =
        total > 0
          ? Math.round(
              lista.reduce((acc, f) => acc + Number(f.dias_en_gestion ?? 0), 0) / total,
            )
          : 0;
      return { porEstado, slaCumplidoPct, tiempoPromedio, total };
    },
  });
};
