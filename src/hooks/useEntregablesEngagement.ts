import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type TipoEntregable =
  | "diagnostico_inmobiliario"
  | "presentacion_diagnostico"
  | "informe_area"
  | "documento_soporte"
  | "otro";

export type EstadoEntregable = "borrador" | "publicado" | "archivado";

export interface Entregable {
  id: string;
  engagement_id: string;
  tipo: TipoEntregable;
  nombre: string;
  storage_path: string | null;
  url_externa: string | null;
  mime_type: string | null;
  tamano_bytes: number | null;
  estado: EstadoEntregable;
  version: number;
  subido_por: string | null;
  notas: string | null;
  tipo_analisis_id: string | null;
  created_at: string;
  updated_at: string;
  subido_por_perfil: { nombre: string | null } | null;
}

export const useEntregablesEngagement = (engagementId: string | undefined) => {
  return useQuery({
    queryKey: ["entregables-engagement", engagementId],
    enabled: !!engagementId,
    refetchOnWindowFocus: true,
    queryFn: async (): Promise<Entregable[]> => {
      const { data, error } = await supabase
        .from("entregables_engagement" as any)
        .select(
          `id, engagement_id, tipo, nombre, storage_path, url_externa,
           mime_type, tamano_bytes, estado, version, subido_por, notas,
           tipo_analisis_id, created_at, updated_at,
           subido_por_perfil:perfiles!subido_por ( nombre )`,
        )
        .eq("engagement_id", engagementId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Entregable[];
    },
  });
};

/**
 * Separa la lista de entregables en:
 * - diagnostico: último publicado (o último borrador) de tipo diagnostico_inmobiliario
 * - presentacion: idem para presentacion_diagnostico
 * - ligadosPorAnalisis: agrupados por tipo_analisis_id (excluye maestros)
 * - sueltos: resto sin tipo_analisis_id y sin ser maestros
 */
export function separarEntregables(entregables: Entregable[] = []) {
  const elegir = (tipo: TipoEntregable): Entregable | undefined => {
    const delTipo = entregables.filter((e) => e.tipo === tipo && e.estado !== "archivado");
    const publicado = delTipo.find((e) => e.estado === "publicado");
    if (publicado) return publicado;
    return [...delTipo].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    )[0];
  };

  const diagnostico = elegir("diagnostico_inmobiliario");
  const presentacion = elegir("presentacion_diagnostico");

  const ligadosPorAnalisis: Record<string, Entregable[]> = {};
  const sueltos: Entregable[] = [];

  for (const e of entregables) {
    if (e.tipo === "diagnostico_inmobiliario" || e.tipo === "presentacion_diagnostico") {
      continue;
    }
    if (e.tipo_analisis_id) {
      (ligadosPorAnalisis[e.tipo_analisis_id] ||= []).push(e);
    } else {
      sueltos.push(e);
    }
  }

  return { diagnostico, presentacion, ligadosPorAnalisis, sueltos };
}
