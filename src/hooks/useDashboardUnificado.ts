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

export type CategoriaArea = "pequeño" | "mediano" | "grande" | "extra_grande";

export interface FiltrosUnificados {
  busqueda?: string;
  filtro?: FiltroLoteUnif;
  // Ubicación
  ciudades?: string[];
  barrios?: string[];
  // Características
  tipos?: string[];
  categoriaArea?: CategoriaArea[];
  areaMin?: number;
  areaMax?: number;
  precioMin?: number;
  precioMax?: number;
  estratos?: number[];
  // Estado publicación
  estadosPublicacion?: ("borrador" | "pendiente_validacion" | "aprobado" | "rechazado")[];
  estadoDisponibilidad?: ("Disponible" | "Reservado" | "Vendido")[];
  soloPublicos?: boolean;
  soloDestacados?: boolean;
  // Engagement
  planesCodigos?: string[];
  estadosEngagement?: (
    | "prospecto"
    | "activo"
    | "en_revision"
    | "entregado"
    | "cerrado"
    | "cancelado"
  )[];
  asesoresIds?: string[];
  slaEstados?: (
    | "cumplido_a_tiempo"
    | "cumplido_con_retraso"
    | "atrasado"
    | "riesgo_fecha"
    | "riesgo_ritmo"
    | "verde"
  )[];
  conEntregablesBorrador?: boolean;
  // Análisis 360
  scoreMin?: number;
  conResolutoria?: boolean;
  // Relaciones
  propietarioId?: string | null;
  conLeadsActivos?: boolean;
  leadsMinimo?: number;
  // Fechas
  creadoDesde?: string;
  creadoHasta?: string;
  ultimaActividadDias?: number;
}

export interface LoteUnificado {
  id: string;
  nombre_lote: string;
  ciudad: string | null;
  barrio: string | null;
  tipo_lote: string | null;
  estrato: number | null;
  destacado: boolean;
  area_total_m2: number | null;
  precio_venta_estimado: number | null;
  foto_url: string | null;
  lat: number | null;
  lng: number | null;
  estado_publicacion: string;
  estado_disponibilidad: string | null;
  publicado_venta: boolean;
  propietario_id: string | null;
  es_publico: boolean;
  score_360: number | null;
  has_resolutoria: boolean;
  created_at: string | null;
  engagement_id: string | null;
  engagement_estado: string | null;
  engagement_avance_pct: number | null;
  plan_codigo: string | null;
  sla_estado: string | null;
  sla_cumplido: boolean | null;
  dias_para_sla: number | null;
  asesor_id: string | null;
  asesor_nombre: string | null;
  plan_nombre: string | null;
  tiene_entregables_borrador: boolean | null;
  ultima_actualizacion: string | null;
  leads_count: number;
  leads_nuevos_count: number;
}

const categoriaArea = (a: number | null): CategoriaArea | null => {
  if (a == null) return null;
  if (a < 500) return "pequeño";
  if (a < 1500) return "mediano";
  if (a < 5000) return "grande";
  return "extra_grande";
};

export const useLotesUnificados = (filtros: FiltrosUnificados) => {
  return useQuery({
    queryKey: ["lotes-unificados", filtros],
    staleTime: 30_000,
    queryFn: async (): Promise<LoteUnificado[]> => {
      const sb = supabase as any;

      const [lotesRes, engRes, leadsRes] = await Promise.all([
        sb
          .from("lotes")
          .select(
            `id, nombre_lote, ciudad, barrio, tipo_lote, estrato, destacado,
             area_total_m2, precio_venta_estimado, foto_url, lat, lng,
             estado_publicacion, estado_disponibilidad, publicado_venta,
             propietario_id, es_publico,
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
          tipo_lote: lote.tipo_lote ?? null,
          estrato: lote.estrato != null ? Number(lote.estrato) : null,
          destacado: !!lote.destacado,
          area_total_m2: lote.area_total_m2 != null ? Number(lote.area_total_m2) : null,
          precio_venta_estimado:
            lote.precio_venta_estimado != null ? Number(lote.precio_venta_estimado) : null,
          foto_url: lote.foto_url,
          estado_publicacion: lote.estado_publicacion,
          estado_disponibilidad: lote.estado_disponibilidad ?? null,
          publicado_venta: !!lote.publicado_venta,
          propietario_id: lote.propietario_id,
          es_publico: !!lote.es_publico,
          score_360: score360,
          has_resolutoria: !!lote.has_resolutoria,
          created_at: lote.created_at ?? null,
          engagement_id: eng?.engagement_id ?? null,
          engagement_estado: eng?.estado ?? null,
          engagement_avance_pct: eng?.avance_pct != null ? Number(eng.avance_pct) : null,
          plan_codigo: eng?.plan_codigo ?? null,
          sla_estado: eng?.sla_estado ?? null,
          sla_cumplido: eng?.sla_cumplido ?? null,
          dias_para_sla: eng?.dias_para_sla != null ? Number(eng.dias_para_sla) : null,
          asesor_id: eng?.asesor_id ?? null,
          asesor_nombre: eng?.asesor_nombre ?? null,
          plan_nombre: eng?.plan_nombre ?? null,
          tiene_entregables_borrador: eng?.tiene_entregables_borrador ?? null,
          ultima_actualizacion: eng?.ultima_actualizacion ?? null,
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

      // Ubicación
      if (filtros.ciudades?.length)
        res = res.filter((l) => filtros.ciudades!.includes(l.ciudad ?? ""));
      if (filtros.barrios?.length)
        res = res.filter((l) => filtros.barrios!.includes(l.barrio ?? ""));

      // Características
      if (filtros.tipos?.length)
        res = res.filter((l) => l.tipo_lote && filtros.tipos!.includes(l.tipo_lote));
      if (filtros.categoriaArea?.length)
        res = res.filter((l) => {
          const c = categoriaArea(l.area_total_m2);
          return c != null && filtros.categoriaArea!.includes(c);
        });
      if (filtros.areaMin != null)
        res = res.filter((l) => (l.area_total_m2 ?? 0) >= filtros.areaMin!);
      if (filtros.areaMax != null)
        res = res.filter((l) => (l.area_total_m2 ?? 0) <= filtros.areaMax!);
      if (filtros.precioMin != null)
        res = res.filter((l) => (l.precio_venta_estimado ?? 0) >= filtros.precioMin!);
      if (filtros.precioMax != null)
        res = res.filter(
          (l) =>
            l.precio_venta_estimado != null && l.precio_venta_estimado <= filtros.precioMax!,
        );
      if (filtros.estratos?.length)
        res = res.filter((l) => l.estrato != null && filtros.estratos!.includes(l.estrato));

      // Estado publicación
      if (filtros.estadosPublicacion?.length)
        res = res.filter((l) =>
          filtros.estadosPublicacion!.includes(l.estado_publicacion as any),
        );
      if (filtros.estadoDisponibilidad?.length)
        res = res.filter(
          (l) =>
            l.estado_disponibilidad &&
            filtros.estadoDisponibilidad!.includes(l.estado_disponibilidad as any),
        );
      if (filtros.soloPublicos) res = res.filter((l) => l.es_publico);
      if (filtros.soloDestacados) res = res.filter((l) => l.destacado);

      // Engagement
      if (filtros.planesCodigos?.length)
        res = res.filter(
          (l) => l.plan_codigo && filtros.planesCodigos!.includes(l.plan_codigo),
        );
      if (filtros.estadosEngagement?.length)
        res = res.filter(
          (l) =>
            l.engagement_estado &&
            filtros.estadosEngagement!.includes(l.engagement_estado as any),
        );
      if (filtros.asesoresIds?.length)
        res = res.filter((l) => l.asesor_id && filtros.asesoresIds!.includes(l.asesor_id));
      if (filtros.slaEstados?.length)
        res = res.filter(
          (l) => l.sla_estado && filtros.slaEstados!.includes(l.sla_estado as any),
        );
      if (filtros.conEntregablesBorrador)
        res = res.filter((l) => !!l.tiene_entregables_borrador);

      // Análisis
      if (filtros.scoreMin != null && filtros.scoreMin > 0)
        res = res.filter((l) => (l.score_360 ?? 0) >= filtros.scoreMin!);
      if (filtros.conResolutoria) res = res.filter((l) => l.has_resolutoria);

      // Relaciones
      if (filtros.propietarioId) {
        if (filtros.propietarioId === "__sin__")
          res = res.filter((l) => !l.propietario_id);
        else res = res.filter((l) => l.propietario_id === filtros.propietarioId);
      }
      if (filtros.conLeadsActivos) res = res.filter((l) => l.leads_count > 0);
      if (filtros.leadsMinimo != null)
        res = res.filter((l) => l.leads_count >= filtros.leadsMinimo!);

      // Fechas
      if (filtros.creadoDesde) {
        const t = new Date(filtros.creadoDesde).getTime();
        res = res.filter((l) => l.created_at && new Date(l.created_at).getTime() >= t);
      }
      if (filtros.creadoHasta) {
        const t = new Date(filtros.creadoHasta).getTime() + 24 * 60 * 60 * 1000 - 1;
        res = res.filter((l) => l.created_at && new Date(l.created_at).getTime() <= t);
      }
      if (filtros.ultimaActividadDias) {
        const lim = Date.now() - filtros.ultimaActividadDias * 24 * 60 * 60 * 1000;
        res = res.filter((l) => {
          const ref = l.ultima_actualizacion ?? l.created_at;
          return ref != null && new Date(ref).getTime() >= lim;
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
