import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type TipoEntregable =
  | "informe_final_pdf"
  | "presentacion_gamma"
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
           created_at, updated_at,
           subido_por_perfil:perfiles!subido_por ( nombre )`,
        )
        .eq("engagement_id", engagementId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Entregable[];
    },
  });
};
