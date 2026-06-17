import { useMemo } from "react";
import {
  useAnalisisUnificado,
  type AnalisisDimension,
  type EstadoTareaUnif,
  type TipoAnalisisCodigo,
} from "@/hooks/useAnalisisUnificado";
import {
  useEntregablesEngagement,
  type Entregable,
} from "@/hooks/useEntregablesEngagement";
import { useTareasEngagement } from "@/hooks/useTareasEngagement";

/**
 * Mapeo estado-tarea → % avance, usado en TareasAnalisisList original.
 */
const FACTOR: Record<EstadoTareaUnif, number> = {
  no_aplica: 0,
  pendiente: 0,
  en_progreso: 40,
  en_revision: 70,
  aprobado: 90,
  rechazado: 0,
  entregado: 100,
};

export interface AnalisisItemUnificado extends AnalisisDimension {
  tipo_analisis_id: string | null;
  incluido_en_plan: boolean;
  factor_avance: number;
  entregables: Entregable[];
}

export interface AnalisisUnificadoResult {
  items: AnalisisItemUnificado[];
  valoracionEstimada: number | null;
  scorePromedio: number | null;
  totalAnalisis: number;
  completados: number;
  isLoading: boolean;
  isError: boolean;
}

export const useAnalisisUnificadoEngagement = (
  engagementId: string | undefined,
  loteId: string | undefined,
): AnalisisUnificadoResult => {
  const {
    data: dimensiones,
    isLoading: lDim,
    isError: eDim,
  } = useAnalisisUnificado(loteId, engagementId);
  const {
    data: tareas,
    isLoading: lTar,
    isError: eTar,
  } = useTareasEngagement(engagementId);
  const {
    data: entregables,
    isLoading: lEnt,
    isError: eEnt,
  } = useEntregablesEngagement(engagementId);

  return useMemo<AnalisisUnificadoResult>(() => {
    const dims = dimensiones ?? [];
    const tars = tareas ?? [];
    const ents = entregables ?? [];

    const tipoIdPorCodigo = new Map<string, string>();
    for (const t of tars) {
      const codigo = t.tipo_analisis?.codigo;
      if (codigo) tipoIdPorCodigo.set(codigo, t.tipo_analisis_id);
    }

    const entregablesPorTipoId = new Map<string, Entregable[]>();
    for (const e of ents) {
      if (!e.tipo_analisis_id) continue;
      const lista = entregablesPorTipoId.get(e.tipo_analisis_id) ?? [];
      lista.push(e);
      entregablesPorTipoId.set(e.tipo_analisis_id, lista);
    }

    const items: AnalisisItemUnificado[] = dims.map((d) => {
      const tipo_analisis_id = tipoIdPorCodigo.get(d.tipo_codigo) ?? null;
      // Normativo no tiene tarea operativa: es captura directa siempre incluida
      const incluido_en_plan =
        d.tipo_codigo === "normativo" ? true : d.tarea_id != null;
      const factor_avance = d.tarea_estado
        ? FACTOR[d.tarea_estado] ?? 0
        : d.tipo_codigo === "normativo" && d.score != null
        ? Math.min(100, Math.round((d.score / 10) * 100))
        : 0;
      const entregablesDeEsteTipo = tipo_analisis_id
        ? entregablesPorTipoId.get(tipo_analisis_id) ?? []
        : [];
      return {
        ...d,
        tipo_analisis_id,
        incluido_en_plan,
        factor_avance,
        entregables: entregablesDeEsteTipo,
      };
    });

    // Valoración: precio_estimado_promedio del análisis financiero
    const financiero = items.find((i) => i.tipo_codigo === "financiero");
    const valoracionRaw = (financiero?.hallazgos as any)?.precio_estimado_promedio;
    const valoracionEstimada =
      valoracionRaw != null && Number(valoracionRaw) > 0
        ? Number(valoracionRaw)
        : null;

    const scoresValidos = items
      .map((i) => i.score)
      .filter((s): s is number => typeof s === "number");
    const scorePromedio = scoresValidos.length
      ? scoresValidos.reduce((a, b) => a + b, 0) / scoresValidos.length
      : null;

    const completados = items.filter(
      (i) => i.tarea_estado === "aprobado" || i.tarea_estado === "entregado",
    ).length;

    // KPIs calculados virtuales: valoración y score de viabilidad
    const makeVirtual = (
      codigo: "valoracion" | "score_viabilidad",
      nombre: string,
      score: number | null,
    ): AnalisisItemUnificado => ({
      tipo_codigo: codigo,
      tipo_nombre: nombre,
      analisis_id: null,
      hallazgos: null,
      score,
      observaciones: null,
      tarea_id: null,
      tarea_estado: null,
      tarea_avance_pct: 0,
      responsable_id: null,
      responsable_nombre: null,
      fecha_objetivo: null,
      fecha_completado: null,
      ultima_edicion: null,
      tipo_analisis_id: tipoIdPorCodigo.get(codigo) ?? null,
      incluido_en_plan: true,
      factor_avance: score != null ? Math.round((score / 10) * 100) : 0,
      entregables: [],
    });

    items.push(makeVirtual("valoracion", "Valoración", valoracionEstimada));
    items.push(
      makeVirtual("score_viabilidad", "Score de Viabilidad", scorePromedio),
    );

    return {
      items,
      valoracionEstimada,
      scorePromedio,
      totalAnalisis: items.filter(
        (i) => i.tipo_codigo !== "valoracion" && i.tipo_codigo !== "score_viabilidad",
      ).length,
      completados,
      isLoading: lDim || lTar || lEnt,
      isError: eDim || eTar || eEnt,
    };
  }, [dimensiones, tareas, entregables, lDim, lTar, lEnt, eDim, eTar, eEnt]);
};

export type { TipoAnalisisCodigo, EstadoTareaUnif };
