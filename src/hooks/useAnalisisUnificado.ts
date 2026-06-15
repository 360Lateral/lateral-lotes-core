import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type TipoAnalisisCodigo =
  | "juridico"
  | "ambiental"
  | "arquitectonico"
  | "financiero"
  | "geotecnico"
  | "mercado"
  | "sspp";

export type EstadoTareaUnif =
  | "no_aplica"
  | "pendiente"
  | "en_progreso"
  | "en_revision"
  | "aprobado"
  | "rechazado"
  | "entregado";

export interface AnalisisDimension {
  tipo_codigo: TipoAnalisisCodigo;
  tipo_nombre: string;
  // Datos del análisis (del lote)
  analisis_id: string | null;
  hallazgos: Record<string, any> | null;
  score: number | null;
  observaciones: string | null;
  // Datos de la tarea (del engagement)
  tarea_id: string | null;
  tarea_estado: EstadoTareaUnif | null;
  tarea_avance_pct: number;
  responsable_id: string | null;
  responsable_nombre: string | null;
  fecha_objetivo: string | null;
  fecha_completado: string | null;
  ultima_edicion: string | null;
}

interface MapDim {
  codigo: TipoAnalisisCodigo;
  tabla: "analisis_juridico" | "analisis_ambiental" | "analisis_arquitectonico" | "analisis_financiero" | "analisis_geotecnico" | "analisis_mercado" | "analisis_sspp";
  score_col:
    | "score_juridico"
    | "score_ambiental"
    | "score_arquitectonico"
    | "score_financiero"
    | "score_geotecnico"
    | "score_mercado"
    | "score_servicios";
  nombre_default: string;
}

const TABLAS: MapDim[] = [
  { codigo: "juridico", tabla: "analisis_juridico", score_col: "score_juridico", nombre_default: "Jurídico" },
  { codigo: "ambiental", tabla: "analisis_ambiental", score_col: "score_ambiental", nombre_default: "Ambiental" },
  { codigo: "arquitectonico", tabla: "analisis_arquitectonico", score_col: "score_arquitectonico", nombre_default: "Arquitectónico" },
  { codigo: "financiero", tabla: "analisis_financiero", score_col: "score_financiero", nombre_default: "Financiero" },
  { codigo: "geotecnico", tabla: "analisis_geotecnico", score_col: "score_geotecnico", nombre_default: "Geotécnico" },
  { codigo: "mercado", tabla: "analisis_mercado", score_col: "score_mercado", nombre_default: "Mercado" },
  { codigo: "sspp", tabla: "analisis_sspp", score_col: "score_servicios", nombre_default: "Servicios públicos (SSPP)" },
];

export const useAnalisisUnificado = (
  loteId: string | undefined,
  engagementId?: string,
) => {
  return useQuery({
    queryKey: ["analisis-unificado", loteId, engagementId ?? null],
    enabled: !!loteId,
    queryFn: async (): Promise<AnalisisDimension[]> => {
      const sb = supabase as any;
      const [loteRes, ...analisisRes] = await Promise.all([
        sb.from("lotes").select("*").eq("id", loteId).maybeSingle(),
        ...TABLAS.map((t) =>
          sb.from(t.tabla).select("*").eq("lote_id", loteId).maybeSingle(),
        ),
      ]);

      const tareasRes = engagementId
        ? await sb
            .from("tareas_analisis")
            .select(
              `id, engagement_id, tipo_analisis_id, responsable_id, estado, avance_pct,
               fecha_objetivo, fecha_completado, updated_at,
               tipo:tipos_analisis!tareas_analisis_tipo_analisis_id_fkey ( codigo, nombre ),
               responsable:perfiles!tareas_analisis_responsable_id_fkey ( id, nombre )`,
            )
            .eq("engagement_id", engagementId)
        : { data: [] as any[] };

      const tareas: any[] = tareasRes.data ?? [];
      const lote: any = loteRes.data ?? {};

      return TABLAS.map((t, i) => {
        const analisis = analisisRes[i]?.data ?? null;
        const tarea = tareas.find((tar: any) => tar.tipo?.codigo === t.codigo);
        const scoreVal = lote?.[t.score_col];
        return {
          tipo_codigo: t.codigo,
          tipo_nombre: tarea?.tipo?.nombre ?? t.nombre_default,
          analisis_id: analisis?.id ?? null,
          hallazgos: analisis ?? null,
          score: typeof scoreVal === "number" ? scoreVal : scoreVal != null ? Number(scoreVal) : null,
          observaciones: analisis?.observaciones ?? null,
          tarea_id: tarea?.id ?? null,
          tarea_estado: (tarea?.estado as EstadoTareaUnif) ?? null,
          tarea_avance_pct: Number(tarea?.avance_pct ?? 0),
          responsable_id: tarea?.responsable_id ?? null,
          responsable_nombre: tarea?.responsable?.nombre ?? null,
          fecha_objetivo: tarea?.fecha_objetivo ?? null,
          fecha_completado: tarea?.fecha_completado ?? null,
          ultima_edicion: analisis?.updated_at ?? tarea?.updated_at ?? null,
        };
      });
    },
  });
};
