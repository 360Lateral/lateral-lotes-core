import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type EstadoTarea =
  | "no_aplica"
  | "pendiente"
  | "en_progreso"
  | "en_revision"
  | "aprobado"
  | "rechazado"
  | "entregado";

export interface TareaAnalisis {
  id: string;
  engagement_id: string;
  tipo_analisis_id: string;
  estado: EstadoTarea;
  avance_pct: number;
  updated_at: string;
  created_at: string;
  tipo_analisis: {
    codigo: string;
    nombre: string;
    orden: number | null;
  } | null;
}

export const useTareasEngagement = (engagementId: string | undefined) => {
  return useQuery({
    queryKey: ["tareas-engagement", engagementId],
    enabled: !!engagementId,
    queryFn: async (): Promise<TareaAnalisis[]> => {
      const { data, error } = await supabase
        .from("tareas_analisis")
        .select(
          `id, engagement_id, tipo_analisis_id, estado, avance_pct, updated_at, created_at,
           tipo_analisis:tipos_analisis!tareas_analisis_tipo_analisis_id_fkey ( codigo, nombre, orden )`,
        )
        .eq("engagement_id", engagementId!);
      if (error) throw error;
      const rows = (data ?? []) as unknown as TareaAnalisis[];
      return rows.sort(
        (a, b) => (a.tipo_analisis?.orden ?? 999) - (b.tipo_analisis?.orden ?? 999),
      );
    },
  });
};
