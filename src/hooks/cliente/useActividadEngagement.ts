import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type TipoEventoEngagement =
  | "entregable_publicado"
  | "tarea_completada"
  | "mensaje";

export interface EventoEngagement {
  id: string;
  tipo: TipoEventoEngagement;
  titulo: string;
  fecha: string;
}

/**
 * Combina eventos reales del engagement: entregables publicados + tareas completadas + mensajes
 * al asesor. Degrada elegantemente si alguna tabla devuelve error (devuelve lo que sí cargó).
 */
export const useActividadEngagement = (engagementId: string | undefined) => {
  return useQuery({
    queryKey: ["actividad-engagement", engagementId],
    enabled: !!engagementId,
    queryFn: async (): Promise<EventoEngagement[]> => {
      const eventos: EventoEngagement[] = [];

      // 1. Entregables publicados
      try {
        const { data } = await supabase
          .from("entregables_engagement")
          .select("id, nombre, updated_at, created_at, estado")
          .eq("engagement_id", engagementId!)
          .eq("estado", "publicado")
          .order("updated_at", { ascending: false })
          .limit(10);
        (data ?? []).forEach((e: any) => {
          eventos.push({
            id: `ent-${e.id}`,
            tipo: "entregable_publicado",
            titulo: `Entregable publicado: ${e.nombre}`,
            fecha: e.updated_at ?? e.created_at,
          });
        });
      } catch {
        /* ignore */
      }

      // 2. Tareas de análisis completadas (con nombre del tipo de análisis)
      try {
        const { data } = await supabase
          .from("tareas_analisis")
          .select("id, fecha_completado, tipo_analisis:tipos_analisis ( nombre )")
          .eq("engagement_id", engagementId!)
          .not("fecha_completado", "is", null)
          .order("fecha_completado", { ascending: false })
          .limit(10);
        (data ?? []).forEach((t: any) => {
          const nombre = t.tipo_analisis?.nombre ?? "Análisis";
          eventos.push({
            id: `tar-${t.id}`,
            tipo: "tarea_completada",
            titulo: `${nombre} completado`,
            fecha: t.fecha_completado,
          });
        });
      } catch {
        /* ignore */
      }

      // 3. Mensajes al asesor
      try {
        const { data } = await supabase
          .from("mensajes_asesor_engagement" as any)
          .select("id, tema, mensaje, fecha")
          .eq("engagement_id", engagementId!)
          .order("fecha", { ascending: false })
          .limit(10);
        ((data ?? []) as any[]).forEach((m: any) => {
          eventos.push({
            id: `msg-${m.id}`,
            tipo: "mensaje",
            titulo: m.tema?.trim()
              ? `Mensaje enviado: ${m.tema}`
              : "Mensaje enviado al asesor",
            fecha: m.fecha,
          });
        });
      } catch {
        /* ignore */
      }

      return eventos
        .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
        .slice(0, 8);
    },
  });
};
